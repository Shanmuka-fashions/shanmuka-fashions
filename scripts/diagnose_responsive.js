/**
 * Comprehensive Multi-Route Responsive Audit Tool across all requested viewports
 */

const http = require('http');

async function getDevToolsTarget() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page' && t.url.includes('localhost:8000'));
          resolve(page || list.find(t => t.type === 'page'));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runAudit() {
  const target = await getDevToolsTarget();
  if (!target) {
    console.error('No page target found on port 9222');
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(res => ws.onopen = res);

  const viewports = [320, 360, 375, 390, 414, 430, 768, 1024, 1440];
  const routes = [
    '#/',
    '#/catalogue',
    '#/product/1',
    '#/contact',
    '#/story',
    '#/complete-profile',
    '#/account',
    '#/admin'
  ];

  let totalFailures = 0;

  for (const width of viewports) {
    console.log(`\n============================================================`);
    console.log(` 📱 TESTING VIEWPORT WIDTH: ${width}px `);
    console.log(`============================================================`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: width,
      height: 844,
      deviceScaleFactor: width < 768 ? 3 : 2,
      mobile: width < 1024,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });

    for (const route of routes) {
      await send('Runtime.evaluate', {
        expression: `window.location.hash = '${route}';`
      });

      await new Promise(r => setTimeout(r, 450));

      const auditCode = `
        (function() {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          
          // An element is an unintentional horizontal overflow if:
          // 1. It is not inside an intended horizontal scrolling container (overflow-x: auto/scroll)
          // 2. Its rect.right > vw + 1.5
          const overflows = [];
          const all = document.querySelectorAll('*');
          for (const el of all) {
            if (['SCRIPT', 'STYLE', 'HEAD', 'META', 'TITLE', 'LINK'].includes(el.tagName)) continue;
            
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            if (computed.display === 'none' || computed.visibility === 'hidden') continue;

            // Check if element is inside an intended scroll container
            let isInsideScroll = false;
            let parent = el.parentElement;
            while (parent && parent !== document.body && parent !== document.documentElement) {
              const pStyle = window.getComputedStyle(parent);
              if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflowX === 'hidden') {
                isInsideScroll = true;
                break;
              }
              parent = parent.parentElement;
            }

            if (!isInsideScroll && rect.right > vw + 2) {
              overflows.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: (el.className && typeof el.className === 'string') ? el.className.trim() : '',
                rectRight: Math.round(rect.right),
                rectWidth: Math.round(rect.width),
                scrollWidth: el.scrollWidth,
                width: computed.width
              });
            }
          }
          return { vw, vh, docW, bodyW, isOverflow: docW > vw || overflows.length > 0, overflowCount: overflows.length, overflows: overflows.slice(0, 5) };
        })()
      `;

      const evalResult = await send('Runtime.evaluate', {
        expression: auditCode,
        returnByValue: true
      });

      const res = evalResult.result.value;
      if (res.isOverflow) {
        totalFailures++;
        console.log(`❌ FAIL [${width}px] Route: ${route.padEnd(20)} | Viewport: ${res.vw}px | DocScroll: ${res.docW}px | Offending: ${res.overflowCount}`);
        res.overflows.forEach(o => console.log(`     <${o.tag} class="${o.className}"> right:${o.rectRight}px width:${o.rectWidth}px`));
      } else {
        console.log(`✅ PASS [${width}px] Route: ${route.padEnd(20)} | Viewport: ${res.vw}px | DocScroll: ${res.docW}px`);
      }
    }
  }

  console.log(`\n============================================================`);
  console.log(` AUDIT SUMMARY: Total Failures: ${totalFailures} `);
  console.log(`============================================================`);

  ws.close();
  process.exit(totalFailures > 0 ? 1 : 0);
}

runAudit().catch(err => {
  console.error('Audit exception:', err);
  process.exit(1);
});
