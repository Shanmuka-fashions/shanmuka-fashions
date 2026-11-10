/**
 * Shanmuka Fashions — Core Barcode Generation & Thermal Label Printing Engine
 * Supports: Code 128 (Subset B/Auto), Vector SVG, High-Res Canvas,
 * Millimeter Thermal Browser Print, TSPL-II (TSC/Xprinter/TVS), and ZPL-II (Zebra).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFBarcode = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // ── 1. CODE 128 SPECIFICATION & PATTERN TABLE ──
  // 107 standardized symbols: indices 0-102 data chars, 103 Start A, 104 Start B, 105 Start C, 106 Stop
  const CODE128_PATTERNS = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ];

  const START_B = 104;
  const STOP = 106;

  // Category prefix mapping for unique SKU generation
  const CATEGORY_CODES = {
    'kanchipuram': 'KAN',
    'banarasi': 'BNR',
    'organza': 'ORG',
    'silk': 'SLK',
    'cotton': 'COT',
    'designer': 'DES'
  };

  const CATEGORY_NUM_CODES = {
    'kanchipuram': '01',
    'banarasi': '02',
    'organza': '03',
    'silk': '04',
    'cotton': '05',
    'designer': '06'
  };

  /**
   * Encodes a string into Code 128 symbols (Subset B)
   */
  function encodeCode128B(text) {
    if (!text || typeof text !== 'string') text = 'SF-000';
    const cleanText = text.replace(/[^\x20-\x7E]/g, ''); // ASCII 32 - 126
    const codes = [START_B];
    let sum = START_B;

    for (let i = 0; i < cleanText.length; i++) {
      const val = cleanText.charCodeAt(i) - 32;
      codes.push(val);
      sum += val * (i + 1);
    }

    const checksum = sum % 103;
    codes.push(checksum);
    codes.push(STOP);
    return { codes, text: cleanText };
  }

  /**
   * Generates razor-sharp SVG representation of Code 128 barcode
   */
  function generateBarcodeSVG(text, options = {}) {
    const {
      barWidth = 1.5,       // Width of 1 module in px
      barHeight = 40,       // Height of barcode in px
      showText = true,      // Human-readable text below
      fontSize = 11,        // Text font size in pt/px
      textMargin = 4,       // Margin between bars and text
      quietZone = 10,       // Quiet zone (blank padding) in px
      color = '#000000',
      bgColor = 'transparent'
    } = options;

    const { codes, text: cleanText } = encodeCode128B(text);

    let totalModules = 0;
    const elements = [];

    // Calculate total module width and parse alternating bar/space elements
    codes.forEach(code => {
      const pattern = CODE128_PATTERNS[code];
      for (let i = 0; i < pattern.length; i++) {
        const width = parseInt(pattern[i], 10);
        const isBar = (i % 2 === 0);
        elements.push({ width, isBar });
        totalModules += width;
      }
    });

    const totalWidth = (totalModules * barWidth) + (quietZone * 2);
    const totalHeight = barHeight + (showText ? fontSize + textMargin + 2 : 0) + 4;

    let currentX = quietZone;
    const rects = [];

    elements.forEach(el => {
      const elWidth = el.width * barWidth;
      if (el.isBar) {
        rects.push(`<rect x="${currentX.toFixed(2)}" y="2" width="${elWidth.toFixed(2)}" height="${barHeight}" fill="${color}" shape-rendering="crispEdges"/>`);
      }
      currentX += elWidth;
    });

    const textElement = showText ? `
      <text x="${(totalWidth / 2).toFixed(2)}" y="${(barHeight + textMargin + fontSize).toFixed(2)}"
            text-anchor="middle" font-family="'Plus Jakarta Sans', monospace, sans-serif"
            font-size="${fontSize}px" font-weight="600" fill="${color}" letter-spacing="1.5px">
        ${cleanText}
      </text>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}" width="100%" height="${totalHeight}px" style="background:${bgColor}; display:block; margin:0 auto;">
      ${rects.join('')}
      ${textElement}
    </svg>`;
  }

  /**
   * Generates a Data URL (SVG/image) for embedding into img tags or previews
   */
  function generateBarcodeDataURL(text, options = {}) {
    const svg = generateBarcodeSVG(text, options);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /**
   * Generates a unique, non-colliding SKU based on weave category
   */
  function generateUniqueSKU(category = 'Silk', nextId = 1, existingSkus = []) {
    const catLower = (category || 'silk').toLowerCase();
    const prefix = CATEGORY_CODES[catLower] || 'SLK';
    let seq = parseInt(nextId, 10) || 1;
    let candidate = `SF-${prefix}-${String(seq).padStart(3, '0')}`;

    const skuSet = new Set(existingSkus.map(s => String(s).toUpperCase()));
    while (skuSet.has(candidate.toUpperCase())) {
      seq++;
      candidate = `SF-${prefix}-${String(seq).padStart(3, '0')}`;
    }
    return candidate;
  }

  /**
   * Generates an internal Code 128 barcode (NEVER an arbitrary GS1/EAN-13 number)
   * Format: SF + YY (Year 26) + CatCode (01-06) + 4-digit sequence (e.g. SF26010015)
   */
  function generateUniqueBarcode(category = 'Silk', nextId = 1, existingBarcodes = []) {
    const catLower = (category || 'silk').toLowerCase();
    const catCode = CATEGORY_NUM_CODES[catLower] || '04';
    const yearCode = '26'; // Year 2026
    let seq = parseInt(nextId, 10) || 1;
    let candidate = `SF${yearCode}${catCode}${String(seq).padStart(4, '0')}`;

    const barcodeSet = new Set(existingBarcodes.map(b => String(b).toUpperCase()));
    while (barcodeSet.has(candidate.toUpperCase())) {
      seq++;
      candidate = `SF${yearCode}${catCode}${String(seq).padStart(4, '0')}`;
    }
    return candidate;
  }

  /**
   * Generates a serialized unique unit barcode for individually tracked luxury sarees
   * Format: SF26010015-01, SF26010015-02
   */
  function generateUnitBarcode(productBarcode, serialNumber) {
    const clean = (productBarcode || 'SF26010001').trim();
    const seq = String(serialNumber || 1).padStart(2, '0');
    return `${clean}-${seq}`;
  }

  /**
   * Generates clean HTML for a single physical thermal sticker
   */
  function renderStickerHTML(product, config = {}) {
    const {
      width = 50,             // mm
      height = 30,            // mm
      includeBranding = true,
      includePrice = true,
      includeMRP = true,
      includeSKU = true,
      includeCategory = true,
      barcodeHeight = 28,     // px in SVG
      fontSize = 'normal'     // 'compact', 'normal', 'large'
    } = config;

    const barcode = product.barcode || product.sku || 'SF26010001';
    const svgBarcode = generateBarcodeSVG(barcode, {
      barWidth: width <= 40 ? 1.0 : 1.2,
      barHeight: barcodeHeight,
      showText: true,
      fontSize: 9,
      textMargin: 2,
      quietZone: 4
    });

    const formattedPrice = '₹' + (Number(product.price) || 0).toLocaleString('en-IN');
    const formattedMRP = product.old ? '₹' + (Number(product.old) || 0).toLocaleString('en-IN') : null;

    // Size-adaptive font metrics
    const titleSize = width <= 40 ? '9px' : (fontSize === 'compact' ? '9.5px' : '10.5px');
    const priceSize = width <= 40 ? '11px' : (fontSize === 'compact' ? '11px' : '12.5px');
    const metaSize = width <= 40 ? '7.5px' : '8px';

    return `
      <div class="sf-thermal-sticker" style="
        width: ${width}mm;
        height: ${height}mm;
        max-width: ${width}mm;
        max-height: ${height}mm;
        box-sizing: border-box;
        overflow: hidden;
        padding: 1.5mm 2mm;
        margin: 0;
        background: #FFFFFF;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        text-align: center;
        page-break-after: always;
        break-after: page;
        border: 1px dashed #DDD;
      ">
        <!-- Brand Header -->
        ${includeBranding ? `
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 1px; line-height: 1.1; text-transform: uppercase; border-bottom: 0.5px solid #000; width: 100%; padding-bottom: 1px; margin-bottom: 1px;">
            SHANMUKA FASHIONS
          </div>
        ` : ''}

        <!-- Product Title -->
        <div style="font-size: ${titleSize}; font-weight: 700; line-height: 1.15; max-height: 2.3em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; width: 100%; margin: 1px 0;">
          ${product.name || 'Pure Silk Handloom Saree'}
        </div>

        <!-- Barcode Graphic -->
        <div style="width: 100%; margin: 1px 0;">
          ${svgBarcode}
        </div>

        <!-- Price & Meta Section -->
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1px; border-top: 0.5px solid #000; margin-top: 1px;">
          <div style="text-align: left; line-height: 1.1;">
            ${includeSKU ? `<div style="font-size: ${metaSize}; font-weight: 600; color: #222;">SKU: ${product.sku || 'SF-SLK-001'}</div>` : ''}
            ${includeCategory ? `<div style="font-size: ${metaSize}; color: #444;">${product.category || 'Silk'}${product.color ? ' • ' + product.color.split('&')[0].trim() : ''}</div>` : ''}
          </div>

          ${includePrice ? `
            <div style="text-align: right; line-height: 1.1;">
              ${includeMRP && formattedMRP ? `<div style="font-size: 7.5px; text-decoration: line-through; color: #666;">MRP: ${formattedMRP}</div>` : ''}
              <div style="font-size: ${priceSize}; font-weight: 800; color: #000;">${formattedPrice}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generates TSPL-II printer command string for TSC / Xprinter / TVS thermal printers
   */
  function generateTSPL(product, config = {}, quantity = 1) {
    const width = config.width || 50;
    const height = config.height || 30;
    const gap = config.gap || 3;
    const barcode = product.barcode || product.sku || 'SF26010001';
    const priceStr = 'Rs. ' + (Number(product.price) || 0).toLocaleString('en-IN');
    const safeName = (product.name || '').replace(/[\r\n"]/g, '').substring(0, 28);
    const sku = (product.sku || '').replace(/[\r\n"]/g, '');
    const cat = (product.category || 'Silk').replace(/[\r\n"]/g, '');

    return [
      `SIZE ${width} mm, ${height} mm`,
      `GAP ${gap} mm, 0 mm`,
      `DIRECTION 1`,
      `CLS`,
      `TEXT 20,10,"2",0,1,1,"SHANMUKA FASHIONS"`,
      `TEXT 20,32,"1",0,1,1,"${safeName}"`,
      `BARCODE 20,55,"128",45,1,0,2,2,"${barcode}"`,
      `TEXT 20,130,"2",0,1,1,"PRICE: ${priceStr}"`,
      `TEXT 20,158,"1",0,1,1,"SKU: ${sku} | ${cat}"`,
      `PRINT ${quantity},1`,
      ``
    ].join('\n');
  }

  /**
   * Generates ZPL-II printer command string for Zebra / ZPL thermal printers
   */
  function generateZPL(product, config = {}, quantity = 1) {
    const width = config.width || 50;
    const height = config.height || 30;
    const dotsPerMm = 8; // 203 DPI = 8 dots/mm
    const pw = Math.round(width * dotsPerMm);
    const ll = Math.round(height * dotsPerMm);
    const barcode = product.barcode || product.sku || 'SF26010001';
    const priceStr = 'INR ' + (Number(product.price) || 0).toLocaleString('en-IN');
    const safeName = (product.name || '').replace(/[\r\n\^~]/g, '').substring(0, 26);
    const sku = (product.sku || '').replace(/[\r\n\^~]/g, '');
    const cat = (product.category || 'Silk').replace(/[\r\n\^~]/g, '');

    return [
      `^XA`,
      `^PW${pw}`,
      `^LL${ll}`,
      `^CF0,20`,
      `^FO20,15^FDSHANMUKA FASHIONS^FS`,
      `^CF0,18`,
      `^FO20,40^FD${safeName}^FS`,
      `^BY2,2.5,45`,
      `^FO20,70^BCN,45,Y,N,N^FD${barcode}^FS`,
      `^CF0,22`,
      `^FO20,150^FDPRICE: ${priceStr}^FS`,
      `^CF0,16`,
      `^FO20,180^FDSKU: ${sku} | ${cat}^FS`,
      `^PQ${quantity}`,
      `^XZ`,
      ``
    ].join('\n');
  }

  /**
   * Triggers native browser print with exact physical label dimensions
   */
  function printStickersBrowser(labelItems = [], config = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const width = config.width || 50;
    const height = config.height || 30;

    let printArea = document.getElementById('sfPrintStickerContainer');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'sfPrintStickerContainer';
      document.body.appendChild(printArea);
    }

    // Dynamic @page size style ensuring 100% true physical millimeters
    let printStyle = document.getElementById('sfPrintStickerStyle');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'sfPrintStickerStyle';
      document.head.appendChild(printStyle);
    }

    printStyle.textContent = `
      @page {
        size: ${width}mm ${height}mm;
        margin: 0;
      }
      @media screen {
        #sfPrintStickerContainer {
          display: none;
        }
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #FFF !important;
        }
        body * {
          visibility: hidden !important;
        }
        #sfPrintStickerContainer, #sfPrintStickerContainer * {
          visibility: visible !important;
        }
        #sfPrintStickerContainer {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
        }
        .sf-thermal-sticker {
          border: none !important;
          page-break-after: always !important;
          break-after: page !important;
        }
      }
    `;

    // Render each label copy
    let html = '';
    labelItems.forEach(item => {
      const count = parseInt(item.quantity, 10) || 1;
      const stickerHTML = renderStickerHTML(item.product, config);
      for (let i = 0; i < count; i++) {
        html += stickerHTML;
      }
    });

    printArea.innerHTML = html;

    // Trigger Print Dialog
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return {
    encodeCode128B,
    generateBarcodeSVG,
    generateBarcodeDataURL,
    generateUniqueSKU,
    generateUniqueBarcode,
    generateUnitBarcode,
    renderStickerHTML,
    generateTSPL,
    generateZPL,
    printStickersBrowser
  };
}));
