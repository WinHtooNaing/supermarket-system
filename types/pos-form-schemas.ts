import z from "zod";

export const roleOptions = ["admin", "seller"] as const;

export const sellerFormSchema = z.object({
  userId: z
    .string()
    .trim()
    .nonempty("User ID is required.")
    .min(5, "User ID must be at least 5 characters.")
    .max(20, "User ID must be at most 20 characters."),
  password: z
    .string()
    .nonempty("Password is required.")
    .min(6, "Password must be at least 6 characters.")
    .max(50, "Password must be at most 50 characters."),
  name: z
    .string()
    .trim()
    .nonempty("Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  role: z.enum(roleOptions, { message: "Role is required." }),
});

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty("Category name is required.")
    .min(2, "Category name must be at least 2 characters.")
    .max(50, "Category name must be at most 50 characters."),
});

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty("Product name is required.")
    .min(2, "Product name must be at least 2 characters.")
    .max(120, "Product name must be at most 120 characters."),
  price: z.coerce
    .number({ message: "Price is required." })
    .int("Price must be a whole number.")
    .min(0, "Price cannot be negative."),
  stock: z.coerce
    .number({ message: "Stock is required." })
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative."),
  barcode: z
    .string()
    .trim()
    .nonempty("Barcode is required.")
    .min(3, "Barcode must be at least 3 characters.")
    .max(64, "Barcode must be at most 64 characters."),
  categoryId: z.coerce
    .number({ message: "Category is required." })
    .int("Category is required.")
    .positive("Category is required."),
});

export const saleItemFormSchema = z.object({
  productId: z.coerce
    .number({ message: "Product is required." })
    .int("Product is required.")
    .positive("Product is required."),
  quantity: z.coerce
    .number({ message: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1."),
  price: z.coerce
    .number({ message: "Price is required." })
    .int("Price must be a whole number.")
    .min(0, "Price cannot be negative."),
});

export const saleFormSchema = z.object({
  sellerId: z.coerce
    .number({ message: "Seller is required." })
    .int("Seller is required.")
    .positive("Seller is required."),
  items: z.array(saleItemFormSchema).min(1, "Add at least one sale item."),
});
