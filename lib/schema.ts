// import {
//   pgTable,
//   serial,
//   text,
//   integer,
//   timestamp,
// } from "drizzle-orm/pg-core";

// // USERS
// export const users = pgTable("users", {
//   id: serial("id").primaryKey(),
//   userId: text("user_id").unique(),
//   password: text("password"),
//   name: text("name"),
//   role: text("role"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

// // CATEGORIES
// export const categories = pgTable("categories", {
//   id: serial("id").primaryKey(),
//   name: text("name"),
// });

// // PRODUCTS
// export const products = pgTable("products", {
//   id: serial("id").primaryKey(),
//   name: text("name"),
//   price: integer("price"),
//   stock: integer("stock"),
//   barcode: text("barcode").unique(),
//   categoryId: integer("category_id"),
// });

// // SALES
// export const sales = pgTable("sales", {
//   id: serial("id").primaryKey(),
//   sellerId: integer("seller_id"),
//   totalAmount: integer("total_amount"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

// // SALE ITEMS
// export const saleItems = pgTable("sale_items", {
//   id: serial("id").primaryKey(),
//   saleId: integer("sale_id"),
//   productId: integer("product_id"),
//   quantity: integer("quantity"),
//   price: integer("price"),
// });
