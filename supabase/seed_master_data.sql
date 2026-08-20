-- Run this AFTER 0002_master_data.sql, once, in the Supabase SQL editor.
-- Seeds the same demo catalogue as src/data/seed.ts (PRODUCTS/MATERIALS/
-- VENDORS/BOM_RECIPES) into the real tables, so the live app isn't empty.
-- Uses the same store row seed.sql already created.

insert into products (store_id, code, name, price, cat, grad, initial, stock, unit, description)
values
  ('00000000-0000-0000-0000-000000000001', 'PRD-001', 'Espresso', 3.50, 'Beverages', 'linear-gradient(135deg,#8b5e3c,#5a3a24)', 'E', 120, 'แก้ว', 'Single shot of concentrated espresso.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-002', 'Cappuccino', 4.50, 'Beverages', 'linear-gradient(135deg,#c8a27a,#8b5e3c)', 'C', 95, 'แก้ว', 'Espresso with steamed milk and foam.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-003', 'Iced Latte', 5.00, 'Beverages', 'linear-gradient(135deg,#a8794f,#6d4a2f)', 'I', 80, 'แก้ว', 'Chilled espresso with milk over ice.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-004', 'Matcha Latte', 5.50, 'Beverages', 'linear-gradient(135deg,#7fae5e,#4f7a3a)', 'M', 40, 'แก้ว', 'Japanese matcha whisked with steamed milk.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-005', 'Croissant', 3.25, 'Bakery', 'linear-gradient(135deg,#e2b464,#c98f3a)', 'C', 36, 'ชิ้น', 'Buttery, flaky French pastry.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-006', 'Blueberry Muffin', 3.75, 'Bakery', 'linear-gradient(135deg,#6f6bab,#4a4780)', 'M', 28, 'ชิ้น', 'Soft muffin loaded with blueberries.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-007', 'Cinnamon Roll', 4.00, 'Bakery', 'linear-gradient(135deg,#d99a5b,#a8672f)', 'R', 22, 'ชิ้น', 'Rolled pastry with cinnamon sugar glaze.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-008', 'Avocado Toast', 7.50, 'Food', 'linear-gradient(135deg,#6fa678,#3f6f4a)', 'A', 18, 'ชิ้น', 'Sourdough toast topped with mashed avocado.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-009', 'Club Sandwich', 8.25, 'Food', 'linear-gradient(135deg,#d18a5c,#a3572e)', 'S', 15, 'ชิ้น', 'Triple-decker sandwich with chicken and bacon.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-010', 'Caesar Salad', 8.75, 'Food', 'linear-gradient(135deg,#7fae5e,#4f7a3a)', 'S', 12, 'ชิ้น', 'Romaine, parmesan, croutons, caesar dressing.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-011', 'Ceramic Mug', 12.00, 'Retail', 'linear-gradient(135deg,#9a9aab,#5a5a6b)', 'M', 30, 'ชิ้น', 'Branded ceramic mug, 350ml.'),
  ('00000000-0000-0000-0000-000000000001', 'PRD-012', 'Coffee Beans 250g', 14.00, 'Retail', 'linear-gradient(135deg,#5a3a24,#2e1d12)', 'B', 24, 'ชิ้น', 'House-roasted whole bean coffee, 250g bag.');

insert into materials (store_id, code, name, stock, unit, unit_cost)
values
  ('00000000-0000-0000-0000-000000000001', 'RM-001', 'Espresso Beans', 8200, 'g', 0.018),
  ('00000000-0000-0000-0000-000000000001', 'RM-002', 'Milk', 22000, 'ml', 0.0014),
  ('00000000-0000-0000-0000-000000000001', 'RM-003', 'Matcha Powder', 600, 'g', 0.09),
  ('00000000-0000-0000-0000-000000000001', 'RM-004', 'Flour', 14000, 'g', 0.002),
  ('00000000-0000-0000-0000-000000000001', 'RM-005', 'Butter', 3100, 'g', 0.012),
  ('00000000-0000-0000-0000-000000000001', 'RM-006', 'Avocado', 18, 'pcs', 1.20),
  ('00000000-0000-0000-0000-000000000001', 'RM-007', 'Bread Loaf', 6, 'loaf', 2.50);

insert into vendors (store_id, code, name, address, phone, email)
values
  ('00000000-0000-0000-0000-000000000001', 'VD-001', 'Thai Roasters Co.', '99/1 ถ.สุขุมวิท กรุงเทพฯ', '02-123-4567', 'sales@thairoasters.co.th'),
  ('00000000-0000-0000-0000-000000000001', 'VD-002', 'Fresh Farm Supply', '45 ถ.พระราม 9 กรุงเทพฯ', '02-234-5678', 'contact@freshfarm.co.th'),
  ('00000000-0000-0000-0000-000000000001', 'VD-003', 'Pack Plus Ltd.', '12 ถ.ลาดพร้าว กรุงเทพฯ', '02-345-6789', 'info@packplus.co.th');

-- Recipes reference products/materials by code here (looked up via subquery)
-- since the real tables assign fresh ids — matches BOM_RECIPES in seed.ts:
--   r1: Cappuccino  <- 18g Espresso Beans + 150ml Milk
--   r2: Croissant   <- 80g Flour + 40g Butter
--   r3: Avocado Toast <- 0.2 loaf Bread Loaf + 1 pcs Avocado
with new_recipes as (
  insert into recipes (store_id, output_product_id, batch_qty)
  select '00000000-0000-0000-0000-000000000001', p.id, 1
  from products p
  where p.store_id = '00000000-0000-0000-0000-000000000001' and p.code in ('PRD-002', 'PRD-005', 'PRD-008')
  returning id, output_product_id
)
insert into recipe_ingredients (recipe_id, material_id, qty, position)
select r.id, m.id, ing.qty, ing.position
from new_recipes r
join products p on p.id = r.output_product_id
join (values
  ('PRD-002', 'RM-001', 18::numeric, 0), ('PRD-002', 'RM-002', 150::numeric, 1),
  ('PRD-005', 'RM-004', 80::numeric, 0), ('PRD-005', 'RM-005', 40::numeric, 1),
  ('PRD-008', 'RM-007', 0.2::numeric, 0), ('PRD-008', 'RM-006', 1::numeric, 1)
) as ing(product_code, material_code, qty, position) on ing.product_code = p.code
join materials m on m.code = ing.material_code and m.store_id = '00000000-0000-0000-0000-000000000001';
