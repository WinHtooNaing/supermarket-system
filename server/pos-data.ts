import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import db from "@/db";
import {
  categories,
  products,
  saleItems,
  sales,
  users,
} from "@/db/schema";

export type PosBootstrapData = {
  users: Array<{
    id: number;
    userId: string;
    password: string;
    name: string;
    role: "admin" | "seller";
    createdAt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    createdAt: string;
  }>;
  products: Array<{
    id: number;
    name: string;
    price: number;
    stock: number;
    barcode: string;
    categoryId: number;
    reorderLevel: number;
    createdAt: string;
    updatedAt: string;
  }>;
  sales: Array<{
    id: number;
    sellerId: number;
    totalAmount: number;
    paymentAmount: number;
    changeAmount: number;
    createdAt: string;
    items: Array<{
      id: number;
      productId: number;
      quantity: number;
      price: number;
    }>;
  }>;
};

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeRole(value: string): "admin" | "seller" {
  return value === "admin" ? "admin" : "seller";
}

export async function getPosBootstrapData(): Promise<PosBootstrapData> {
  const [userRows, categoryRows, productRows, saleRows, saleItemRows] = await Promise.all([
    db.select().from(users).orderBy(asc(users.userId)),
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(products).orderBy(asc(products.name)),
    db.select().from(sales).orderBy(desc(sales.createdAt)),
    db.select().from(saleItems).orderBy(asc(saleItems.id)),
  ]);

  const itemsBySaleId = saleItemRows.reduce<Record<number, PosBootstrapData["sales"][number]["items"]>>(
    (acc, item) => {
      const bucket = acc[item.saleId] ?? [];
      bucket.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
      acc[item.saleId] = bucket;
      return acc;
    },
    {}
  );

  return {
    users: userRows.map((user) => ({
      id: user.id,
      userId: user.userId,
      password: user.password,
      name: user.name,
      role: normalizeRole(user.role),
      createdAt: iso(user.createdAt),
    })),
    categories: categoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: iso(category.createdAt),
    })),
    products: productRows.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      barcode: product.barcode,
      categoryId: product.categoryId,
      reorderLevel: product.reorderLevel,
      createdAt: iso(product.createdAt),
      updatedAt: iso(product.updatedAt),
    })),
    sales: saleRows.map((sale) => ({
      id: sale.id,
      sellerId: sale.sellerId,
      totalAmount: sale.totalAmount,
      paymentAmount: sale.paymentAmount,
      changeAmount: sale.changeAmount,
      createdAt: iso(sale.createdAt),
      items: itemsBySaleId[sale.id] ?? [],
    })),
  };
}

export async function upsertCategory(input: { id?: number; name: string }) {
  const normalizedName = input.name.trim();

  if (input.id) {
    const [row] = await db
      .update(categories)
      .set({ name: normalizedName })
      .where(eq(categories.id, input.id))
      .returning();

    return row;
  }

  const [row] = await db
    .insert(categories)
    .values({ name: normalizedName })
    .returning();

  return row;
}

export async function removeCategory(categoryId: number) {
  const linkedProduct = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, categoryId))
    .limit(1);

  if (linkedProduct.length) {
    throw new Error("Delete or move products in this category first.");
  }

  await db.delete(categories).where(eq(categories.id, categoryId));
}

export async function upsertProduct(input: {
  id?: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  categoryId: number;
  reorderLevel?: number;
}) {
  const payload = {
    name: input.name.trim(),
    price: input.price,
    stock: input.stock,
    barcode: input.barcode.trim(),
    categoryId: input.categoryId,
    reorderLevel: input.reorderLevel ?? 10,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [row] = await db
      .update(products)
      .set(payload)
      .where(eq(products.id, input.id))
      .returning();

    return row;
  }

  const [row] = await db
    .insert(products)
    .values({
      ...payload,
      createdAt: new Date(),
    })
    .returning();

  return row;
}

export async function removeProduct(productId: number) {
  await db.delete(products).where(eq(products.id, productId));
}

export async function upsertUser(input: {
  id?: number;
  userId: string;
  password: string;
  name: string;
  role: "admin" | "seller";
}) {
  const payload = {
    userId: input.userId.trim(),
    password: input.password,
    name: input.name.trim(),
    role: input.role,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [row] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, input.id))
      .returning();

    return row;
  }

  const [row] = await db
    .insert(users)
    .values({
      ...payload,
      createdAt: new Date(),
    })
    .returning();

  return row;
}

export async function removeUser(userId: number) {
  const adminRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  const target = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target[0]) return;

  if (target[0].role === "admin" && adminRows.length <= 1) {
    throw new Error("At least one admin account must remain.");
  }

  await db.delete(users).where(eq(users.id, userId));
}

export async function createSale(input: {
  sellerId: number;
  paymentAmount: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
}) {
  const productIds = input.items.map((item) => item.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const productMap = new Map(productRows.map((product) => [product.id, product]));

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("One or more sale products could not be found.");
    }

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} does not have enough stock.`);
    }
  }

  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const [sale] = await db
    .insert(sales)
    .values({
      sellerId: input.sellerId,
      totalAmount,
      paymentAmount: input.paymentAmount,
      changeAmount: Math.max(input.paymentAmount - totalAmount, 0),
      createdAt: new Date(),
    })
    .returning();

  if (!sale) {
    throw new Error("Failed to create sale.");
  }

  await db.insert(saleItems).values(
    input.items.map((item) => ({
      saleId: sale.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }))
  );

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    await db
      .update(products)
      .set({
        stock: product.stock - item.quantity,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }

  return sale;
}

export async function userIdExists(userId: string, excludeId?: number) {
  const filters = [eq(users.userId, userId.trim())];
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      excludeId
        ? and(eq(users.userId, userId.trim()), sql`${users.id} <> ${excludeId}`)
        : filters[0]
    )
    .limit(1);

  return Boolean(rows.length);
}

export async function categoryNameExists(name: string, excludeId?: number) {
  const normalizedName = name.trim();
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      excludeId
        ? and(eq(categories.name, normalizedName), sql`${categories.id} <> ${excludeId}`)
        : eq(categories.name, normalizedName)
    )
    .limit(1);

  return Boolean(rows.length);
}

export async function barcodeExists(barcode: string, excludeId?: number) {
  const normalizedBarcode = barcode.trim();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(
      excludeId
        ? and(eq(products.barcode, normalizedBarcode), sql`${products.id} <> ${excludeId}`)
        : eq(products.barcode, normalizedBarcode)
    )
    .limit(1);

  return Boolean(rows.length);
}
