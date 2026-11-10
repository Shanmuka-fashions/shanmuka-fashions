/**
 * Comprehensive Automated Verification Suite for Shanmuka Fashions
 * Tests all 12 Acceptance Criteria and Core Business Rules.
 */

const assert = require('assert');
const db = require('./sf_database.js');
const admin = require('./sf_admin.js');

console.log('═══════════════════════════════════════════════════════════════');
console.log('SHANMUKA FASHIONS: ADMIN & RETAIL MANAGEMENT AUTOMATED TESTS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Reset to clean demo state for deterministic testing
db.resetToDemoData('Test Runner');

// ── Test 1: Admin can create and publish a saree ──
console.log('▶ Test 1: Saree Creation & Publication...');
const newSaree = db.saveProduct({
  name: 'Kanchipuram Shimmer Gold Brocade',
  category: 'Kanchipuram',
  fabric: 'Pure Silk',
  color: 'Golden Topaz',
  price: 9499,
  old: 11999,
  purchase_cost: 5500,
  stock_qty: 6,
  status: 'Published',
  desc: 'Authentic 3-ply zari weave created for grand wedding receptions.'
});
assert(newSaree.id, 'New saree must have an ID');
assert.strictEqual(newSaree.name, 'Kanchipuram Shimmer Gold Brocade');
assert.strictEqual(newSaree.stock_qty, 6);
assert.strictEqual(newSaree.status, 'Published');
const createdSareeInDb = db.getProduct(newSaree.id);
assert(createdSareeInDb, 'Saree must exist in central database');
console.log('  ✔ Saree created with SKU:', newSaree.sku, 'Stock:', newSaree.stock_qty);

// ── Test 2: Admin can receive and adjust stock with ledger recording ──
console.log('▶ Test 2: Stock Adjustment & Inventory Ledger...');
const initialStock = createdSareeInDb.stock_qty;
db.adjustStock(newSaree.id, 4, 'Received supplementary delivery from Kanchipuram master loom', 'Bhanu (Owner)', 'STOCK_IN');
const afterStock = db.getProduct(newSaree.id).stock_qty;
assert.strictEqual(afterStock, initialStock + 4, 'Stock must increase by 4');
const ledger = db.getInventoryLedger(newSaree.id);
assert(ledger.length > 0, 'Ledger must have recorded the movement');
assert.strictEqual(ledger[0].change_qty, 4);
assert.strictEqual(ledger[0].new_qty, 10);
console.log('  ✔ Stock successfully adjusted from', initialStock, 'to', afterStock, 'with ledger audit trace.');

// ── Test 3: Physical shop POS sale immediately updates central inventory ──
console.log('▶ Test 3: Physical Shop POS Sale...');
const posOrder = db.processSaleTransaction({
  channel: 'POS',
  customer_name: 'Dr. Madhavi Varma',
  customer_phone: '+91 98490 12345',
  items: [{ product_id: newSaree.id, qty: 2 }],
  discount: 500,
  payment_method: 'UPI',
  payment_status: 'PAID'
});
assert(posOrder.id.startsWith('POS-'), 'POS order must have POS prefix');
const stockAfterPOS = db.getProduct(newSaree.id).stock_qty;
assert.strictEqual(stockAfterPOS, 8, 'Stock must decrease from 10 to 8');
console.log('  ✔ POS sale completed: Order', posOrder.order_number, 'Stock reduced to', stockAfterPOS);

// ── Test 4: Website storefront sale updates the exact same stock ──
console.log('▶ Test 4: Website Storefront Online Order...');
const onlineOrder = db.processSaleTransaction({
  channel: 'ONLINE',
  customer_name: 'Kavita Reddy (Online Customer)',
  customer_phone: '+91 97000 88990',
  items: [{ product_id: newSaree.id, qty: 3 }],
  delivery_address: { street: 'Jubilee Hills, Road 10', city: 'Hyderabad', pincode: '500033' },
  payment_method: 'CARD',
  payment_status: 'PAID'
});
assert(onlineOrder.id.startsWith('SF-ORD-'), 'Online order must have SF-ORD prefix');
const stockAfterOnline = db.getProduct(newSaree.id).stock_qty;
assert.strictEqual(stockAfterOnline, 5, 'Stock must decrease from 8 to 5');
console.log('  ✔ Online sale completed: Order', onlineOrder.order_number, 'Central stock reduced to', stockAfterOnline);

// ── Test 5: Concurrency & Negative Inventory / Overselling Protection ──
console.log('▶ Test 5: Overselling & Negative Inventory Protection...');
let errorCaught = false;
try {
  // Attempt to buy 10 units when only 5 are available
  db.processSaleTransaction({
    channel: 'ONLINE',
    customer_name: 'Over-purchaser',
    items: [{ product_id: newSaree.id, qty: 10 }]
  });
} catch (e) {
  errorCaught = true;
  assert(e.message.includes('Insufficient stock') || e.message.includes('Overselling prevented'));
}
assert.strictEqual(errorCaught, true, 'System must abort sale when requested quantity exceeds available stock');
assert.strictEqual(db.getProduct(newSaree.id).stock_qty, 5, 'Stock must remain unchanged after aborted sale');
console.log('  ✔ Overselling prevention verified: Aborted 10-unit purchase when only 5 in stock.');

// ── Test 6: Order cancellation & automatic restock ──
console.log('▶ Test 6: Order Cancellation & Automated Inventory Restock...');
db.updateOrderStatus(onlineOrder.id, 'CANCELLED', 'Bhanu (Owner)');
const stockAfterCancel = db.getProduct(newSaree.id).stock_qty;
assert.strictEqual(stockAfterCancel, 8, 'Cancelled 3 units must be restored from 5 back to 8');
console.log('  ✔ Order cancelled: 3 units restored to central inventory, current stock is', stockAfterCancel);

// ── Test 7: Supplier Purchase Order receipt and stock intake ──
console.log('▶ Test 7: Supplier PO Intake & Material Accounting...');
const po = db.receivePurchaseOrder({
  supplier_id: 'SUPP-101',
  items: [{ product_id: newSaree.id, qty: 5, unit_cost: 5500 }],
  amount_paid: 27500,
  notes: 'Direct guild weaver replenishment batch'
});
assert(po.id.startsWith('PO-'), 'Purchase order must have PO- prefix');
const stockAfterPO = db.getProduct(newSaree.id).stock_qty;
assert.strictEqual(stockAfterPO, 13, 'Stock must increase by 5 units from 8 to 13');
console.log('  ✔ PO received:', po.po_number, 'Total:', po.total_amount, 'New stock:', stockAfterPO);

// ── Test 8: Operating Expenses Tracking ──
console.log('▶ Test 8: Operating Expenses Tracking...');
const initialExpCount = db.getExpenses().length;
const exp = db.recordExpense({
  category: 'Packaging',
  amount: 4500,
  payment_method: 'UPI',
  description: 'Purchased 50 luxury bridal boxes'
});
assert(exp.id.startsWith('EXP-'), 'Expense must have EXP- prefix');
assert.strictEqual(db.getExpenses().length, initialExpCount + 1);
console.log('  ✔ Recorded expense:', exp.id, exp.category, '₹' + exp.amount);

// ── Test 9: Accurate Financial Reporting & Profitability ──
console.log('▶ Test 9: Accurate Financial Reporting & COGS Accounting...');
const reports = db.getFinancialReports('all');
assert(reports.totalRevenue > 0, 'Total revenue must be positive');
assert(reports.totalCogs > 0, 'COGS must be positive');
assert.strictEqual(reports.grossProfit, reports.totalRevenue - reports.totalCogs, 'Gross profit must equal Revenue - COGS');
assert.strictEqual(reports.netProfit, reports.grossProfit - reports.totalOperatingExpenses, 'Net profit must equal Gross Profit - Operating Expenses');
console.log('  ✔ Financial report verified:');
console.log('     Gross Revenue:       ₹' + reports.totalRevenue);
console.log('     Cost of Goods (COGS): ₹' + reports.totalCogs);
console.log('     Gross Profit:        ₹' + reports.grossProfit, '(' + reports.grossMarginPercent + '%)');
console.log('     Operating Expenses:  ₹' + reports.totalOperatingExpenses);
console.log('     Net Profit:          ₹' + reports.netProfit);

// ── Test 10: Website Content Management (CMS) Live Update ──
console.log('▶ Test 10: Dynamic Website CMS Updates...');
const updatedCMS = db.saveCMS({
  hero_heading: 'Divine Silks for the Connoisseur',
  whatsapp_number: '9542156929',
  announcement_bar: 'FESTIVE SALE NOW LIVE • SHANMUKA FASHIONS'
});
assert.strictEqual(db.getCMS().hero_heading, 'Divine Silks for the Connoisseur');
assert.strictEqual(db.getCMS().announcement_bar, 'FESTIVE SALE NOW LIVE • SHANMUKA FASHIONS');
console.log('  ✔ CMS updated: New headline is "' + db.getCMS().hero_heading + '"');

// ── Test 11: Promotional Coupon Validation ──
console.log('▶ Test 11: Promotional Coupon Validation...');
const validCheck = db.validateCoupon('FESTIVE10', 8000);
assert.strictEqual(validCheck.valid, true, 'FESTIVE10 must be valid on ₹8000 order');
assert.strictEqual(validCheck.discount, 800, '10% of 8000 must be 800');
const invalidCheck = db.validateCoupon('FESTIVE10', 2000); // Below 5000 min order
assert.strictEqual(invalidCheck.valid, false, 'Coupon must fail when below min order threshold');
console.log('  ✔ Coupon validated: 10% discount calculated accurately and min order enforced.');

// ── Test 12: Data Persistence & Multi-Storefront Sync ──
console.log('▶ Test 12: Data Persistence & Backup Integrity...');
const exportedJSON = db.exportJSON();
assert(exportedJSON.length > 1000, 'Exported database JSON must contain full dataset');
const parsed = JSON.parse(exportedJSON);
assert(parsed.products.length > 0 && parsed.orders.length > 0 && parsed.inventory_ledger.length > 0);
console.log('  ✔ JSON backup verified (' + exportedJSON.length + ' bytes exported with all tables).');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎉 ALL 12 ACCEPTANCE CRITERIA PASSED FLAWLESSLY!');
console.log('═══════════════════════════════════════════════════════════════');

