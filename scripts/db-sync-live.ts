import "dotenv/config";

import { eq, sql } from "drizzle-orm";

import db from "@/db";
import { categories, products, users } from "@/db/schema";

async function run(statement: string) {
  await db.execute(sql.raw(statement));
}

async function ensureSchema() {
  await run(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()"
  );
  await run(
    "UPDATE users SET password = 'admin123' WHERE role = 'admin' AND (password IS NULL OR password = '')"
  );
  await run("UPDATE users SET updated_at = now() WHERE updated_at IS NULL");
  await run("ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL");
  await run("ALTER TABLE users ALTER COLUMN user_id SET NOT NULL");
  await run("ALTER TABLE users ALTER COLUMN password SET NOT NULL");
  await run("ALTER TABLE users ALTER COLUMN name SET NOT NULL");
  await run("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
  await run("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'seller'");

  await run(
    "ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()"
  );
  await run("UPDATE categories SET created_at = now() WHERE created_at IS NULL");
  await run("ALTER TABLE categories ALTER COLUMN created_at SET NOT NULL");
  await run("ALTER TABLE categories ALTER COLUMN name SET NOT NULL");
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_unique'
      ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
      END IF;
    END $$;
  `);

  await run("ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level integer DEFAULT 10");
  await run(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()"
  );
  await run(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()"
  );
  await run("UPDATE products SET reorder_level = 10 WHERE reorder_level IS NULL");
  await run("UPDATE products SET created_at = now() WHERE created_at IS NULL");
  await run("UPDATE products SET updated_at = now() WHERE updated_at IS NULL");
  await run("ALTER TABLE products ALTER COLUMN reorder_level SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN created_at SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN updated_at SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN name SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN price SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN stock SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN barcode SET NOT NULL");
  await run("ALTER TABLE products ALTER COLUMN category_id SET NOT NULL");
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_categories_id_fk'
      ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_category_id_categories_id_fk
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
      END IF;
    END $$;
  `);

  await run("ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_amount integer DEFAULT 0");
  await run("ALTER TABLE sales ADD COLUMN IF NOT EXISTS change_amount integer DEFAULT 0");
  await run("UPDATE sales SET payment_amount = total_amount WHERE payment_amount IS NULL");
  await run("UPDATE sales SET change_amount = 0 WHERE change_amount IS NULL");
  await run("UPDATE sales SET created_at = now() WHERE created_at IS NULL");
  await run("ALTER TABLE sales ALTER COLUMN seller_id SET NOT NULL");
  await run("ALTER TABLE sales ALTER COLUMN total_amount SET NOT NULL");
  await run("ALTER TABLE sales ALTER COLUMN payment_amount SET NOT NULL");
  await run("ALTER TABLE sales ALTER COLUMN change_amount SET NOT NULL");
  await run("ALTER TABLE sales ALTER COLUMN created_at SET NOT NULL");
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_seller_id_users_id_fk'
      ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_seller_id_users_id_fk
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT;
      END IF;
    END $$;
  `);

  await run("ALTER TABLE sale_items ALTER COLUMN sale_id SET NOT NULL");
  await run("ALTER TABLE sale_items ALTER COLUMN product_id SET NOT NULL");
  await run("ALTER TABLE sale_items ALTER COLUMN quantity SET NOT NULL");
  await run("ALTER TABLE sale_items ALTER COLUMN price SET NOT NULL");
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_sale_id_sales_id_fk'
      ) THEN
        ALTER TABLE sale_items
        ADD CONSTRAINT sale_items_sale_id_sales_id_fk
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);
  await run(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_product_id_products_id_fk'
      ) THEN
        ALTER TABLE sale_items
        ADD CONSTRAINT sale_items_product_id_products_id_fk
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
      END IF;
    END $$;
  `);
}

async function seedIfNeeded() {
  const [categoryCount, productCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(categories),
    db.select({ count: sql<number>`count(*)::int` }).from(products),
  ]);

  const userRows = await db.select().from(users);
  const hasSeller = userRows.some((user) => user.role === "seller");

  if (!hasSeller) {
    await db.insert(users).values([
      {
        userId: "seller001",
        password: "seller001",
        name: "Kyaw Zin",
        role: "seller",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "seller002",
        password: "seller002",
        name: "Moe Thu",
        role: "seller",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "seller003",
        password: "seller003",
        name: "Hnin Ei",
        role: "seller",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  if ((categoryCount[0]?.count ?? 0) === 0) {
    await db.insert(categories).values([
      { name: "Drinks", createdAt: new Date() },
      { name: "Bakery", createdAt: new Date() },
      { name: "Snacks", createdAt: new Date() },
      { name: "Grocery", createdAt: new Date() },
    ]);
  }

  if ((productCount[0]?.count ?? 0) === 0) {
    const categoryRows = await db.select().from(categories);
    const categoryMap = new Map(categoryRows.map((row) => [row.name, row.id]));

    await db.insert(products).values([
      {
        name: "Coke 325ml",
        price: 1500,
        stock: 24,
        barcode: "8801111111111",
        categoryId: categoryMap.get("Drinks")!,
        reorderLevel: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "White Bread",
        price: 2200,
        stock: 18,
        barcode: "8802222222222",
        categoryId: categoryMap.get("Bakery")!,
        reorderLevel: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Potato Chips",
        price: 1200,
        stock: 40,
        barcode: "8803333333333",
        categoryId: categoryMap.get("Snacks")!,
        reorderLevel: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mineral Water",
        price: 800,
        stock: 52,
        barcode: "8804444444444",
        categoryId: categoryMap.get("Drinks")!,
        reorderLevel: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Instant Coffee",
        price: 3200,
        stock: 11,
        barcode: "8805555555555",
        categoryId: categoryMap.get("Grocery")!,
        reorderLevel: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Chocolate Bar",
        price: 1000,
        stock: 28,
        barcode: "8806666666666",
        categoryId: categoryMap.get("Snacks")!,
        reorderLevel: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Eggs",
        price: 4200,
        stock: 5,
        barcode: "8807777777777",
        categoryId: categoryMap.get("Grocery")!,
        reorderLevel: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Cooking Oil",
        price: 7800,
        stock: 12,
        barcode: "8808888888888",
        categoryId: categoryMap.get("Grocery")!,
        reorderLevel: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  const adminUser = userRows.find((user) => user.role === "admin");
  if (adminUser && !adminUser.password) {
    await db
      .update(users)
      .set({ password: "admin123", updatedAt: new Date() })
      .where(eq(users.id, adminUser.id));
  }
}

async function main() {
  await ensureSchema();
  await seedIfNeeded();
  console.log("Live database schema and seed sync completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
