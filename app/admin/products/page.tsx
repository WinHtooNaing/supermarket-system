"use client";

import { useMemo, useState } from "react";

import { BarcodeLabel } from "@/components/barcode-label";
import { PosPageSkeleton } from "@/components/pos-page-skeleton";
import { ProductDialog, type ProductRecord } from "@/components/product-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteProduct,
  saveProduct,
  usePosData,
  type PosProduct,
} from "@/lib/pos-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

function toProductRecord(product: PosProduct): ProductRecord {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    barcode: product.barcode,
    categoryId: product.categoryId,
  };
}

export default function ProductsPage() {
  const { categories, products, sales, isLoading, error } = usePosData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const pageSize = 6;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.barcode.toLowerCase().includes(keyword);
      const matchCategory =
        categoryFilter === "all" ||
        product.categoryId === Number(categoryFilter);

      return matchSearch && matchCategory;
    });
  }, [categoryFilter, products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [currentPage, filteredProducts]);

  const lowStockCount = products.filter(
    (product) => product.stock <= product.reorderLevel,
  ).length;
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  );
  const totalUnitsSold = sales
    .flatMap((sale) => sale.items)
    .reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

  async function handleSaveProduct(
    data: Omit<ProductRecord, "id"> & { id?: number },
  ) {
    try {
      await saveProduct({
        id: data.id!,
        name: data.name,
        price: data.price,
        stock: data.stock,
        barcode: data.barcode,
        categoryId: data.categoryId,
        reorderLevel:
          products.find((product) => product.id === data.id)?.reorderLevel ??
          10,
      });
      toast.success(
        data.id
          ? "Product updated successfully."
          : "Product created successfully.",
      );
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product.",
      );
    }
  }

  async function handleDeleteProduct(id: number) {
    try {
      setDeletingId(id);
      await deleteProduct(id);
      toast.success("Product deleted successfully.");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <PosPageSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage inventory, barcodes, and current stock levels.
          </p>
        </div>
        <ProductDialog
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          onSave={handleSaveProduct}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Inventory Value</p>
          <p className="mt-2 text-2xl font-bold">
            MMK {totalInventoryValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
          <p className="mt-2 text-2xl font-bold">{lowStockCount}</p>
          <p className="text-xs text-muted-foreground">
            {totalUnitsSold.toLocaleString()} units sold across saved bills
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Search by name or barcode"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:col-span-2"
        />

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedProducts.map((product) => {
            const categoryName =
              categories.find((category) => category.id === product.categoryId)
                ?.name ?? "Unknown";
            const isLowStock = product.stock <= product.reorderLevel;

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="min-w-[220px]">
                  <BarcodeLabel
                    value={product.barcode}
                    className="max-w-[220px]"
                    downloadable
                    fileName={`product-${product.id}-barcode`}
                  />
                </TableCell>
                <TableCell>{categoryName}</TableCell>
                <TableCell>MMK {product.price.toLocaleString()}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={isLowStock ? "destructive" : "secondary"}>
                    {isLowStock ? "Restock" : "Healthy"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <ProductDialog
                    product={toProductRecord(product)}
                    categories={categories.map((category) => ({
                      id: category.id,
                      name: category.name,
                    }))}
                    onSave={handleSaveProduct}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletingId === product.id}
                    onClick={() => void handleDeleteProduct(product.id)}
                  >
                    {deletingId === product.id ? (
                      <>
                        <Spinner className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {!paginatedProducts.length && (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={7}
              >
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
