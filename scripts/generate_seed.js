const fs = require('fs');
const path = require('path');
const db = require(path.join(__dirname, 'sf_database.js'));

const products = db.getProducts({ limit: 100 });
const customers = db.getCustomers();
const suppliers = db.getSuppliers();

let sql = `-- ==============================================================================
-- SHANMUKA FASHIONS — SEED DATA FOR SUPABASE
-- Handloom Sarees, Customers, Suppliers & Inventory
-- ==============================================================================

`;

for (const p of products) {
  const imagesJson = JSON.stringify(p.images || [p.img]).replace(/'/g, "''");
  const desc = (p.desc || '').replace(/'/g, "''");
  const name = (p.name || '').replace(/'/g, "''");
  const category = (p.category || '').replace(/'/g, "''");
  const fabric = (p.fabric || '').replace(/'/g, "''");
  const color = (p.color || '').replace(/'/g, "''");
  const badgeVal = p.badge ? `'${p.badge.replace(/'/g, "''")}'` : 'NULL';
  const oldPriceVal = p.old ? p.old : 'NULL';

  sql += `INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '${p.id}', '${p.sku}', '${p.barcode}', '${name}', '${category}', '${(p.collection || 'Masterloom Heritage').replace(/'/g, "''")}', '${fabric}', '${color}', '${(p.material || 'Pure Silk').replace(/'/g, "''")}', '${(p.weave || 'Handloom Jacquard').replace(/'/g, "''")}', '${(p.pattern || 'Traditional Butta').replace(/'/g, "''")}', '${(p.occasion || 'Bridal & Festive').replace(/'/g, "''")}', '${(p.saree_length || '6.3 Meters').replace(/'/g, "''")}', '${(p.blouse_piece || 'Included').replace(/'/g, "''")}', ${p.purchase_cost || 0}, ${p.price}, ${oldPriceVal}, ${p.stock_qty || 0}, ${p.low_stock_threshold || 2}, ${badgeVal}, '${p.status || 'published'}', ${p.is_featured ? 'true' : 'false'}, '${p.img}', '${imagesJson}'::jsonb, ${p.rating || 5.0}, ${p.reviewsCount || 0}, '${desc}'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;\n\n`;
}

for (const c of customers) {
  sql += `INSERT INTO customers (id, name, phone, email, street, city, state, pincode, total_orders, total_spent, notes)
VALUES (
  '${c.id}', '${c.name.replace(/'/g, "''")}', '${c.phone}', '${c.email || ''}', '${(c.street || '').replace(/'/g, "''")}', '${(c.city || '').replace(/'/g, "''")}', '${(c.state || '').replace(/'/g, "''")}', '${c.pincode || ''}', ${c.total_orders || 0}, ${c.total_spent || 0}, '${(c.notes || '').replace(/'/g, "''")}'
) ON CONFLICT (id) DO NOTHING;\n`;
}

for (const s of suppliers) {
  sql += `INSERT INTO suppliers (id, name, contact_person, phone, email, city, gstin, materials_supplied, total_purchased, balance_due)
VALUES (
  '${s.id}', '${s.name.replace(/'/g, "''")}', '${(s.contact_person || '').replace(/'/g, "''")}', '${s.phone || ''}', '${s.email || ''}', '${(s.city || '').replace(/'/g, "''")}', '${s.gstin || ''}', '${(s.materials_supplied || '').replace(/'/g, "''")}', ${s.total_purchased || 0}, ${s.balance_due || 0}
) ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync('supabase/seed.sql', sql);
console.log('Successfully wrote supabase/seed.sql');
