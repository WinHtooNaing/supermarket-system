"use client";

import { useMemo, useState } from "react";

import { BarcodeLabel } from "@/components/barcode-label";
import { ProductDialog, ProductRecord } from "@/components/product-dialog";
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

const categorySeed = [
  { id: 1, name: "Drink" },
  { id: 2, name: "Food" },
  { id: 3, name: "Snack" },
];

const productSeed: ProductRecord[] = [
  {
    id: 1,
    name: "Coke 325ml",
    price: 1500,
    stock: 25,
    barcode: "8801111111111",
    categoryId: 1,
  },
  {
    id: 2,
    name: "White Bread",
    price: 2200,
    stock: 18,
    barcode: "8802222222222",
    categoryId: 2,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>(productSeed);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || product.categoryId === Number(categoryFilter);

      return matchSearch && matchCategory;
    });
  }, [categoryFilter, products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  function handleSaveProduct(data: Omit<ProductRecord, "id"> & { id?: number }) {
    if (data.id) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === data.id ? { ...product, ...data } : product
        )
      );
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        ...data,
        id: Date.now(),
      },
    ]);
  }

  function handleDeleteProduct(id: number) {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Products</h1>
        <ProductDialog categories={categorySeed} onSave={handleSaveProduct} />
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
            {categorySeed.map((category) => (
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
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedProducts.map((product) => {
            const categoryName =
              categorySeed.find((category) => category.id === product.categoryId)?.name ||
              "Unknown";

            return (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell className="min-w-[220px]">
                  <BarcodeLabel
                    value={product.barcode}
                    className="max-w-[220px]"
                    downloadable
                    fileName={`product-${product.id}-barcode`}
                  />
                </TableCell>
                <TableCell>{categoryName}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell className="space-x-2">
                  <ProductDialog
                    product={product}
                    categories={categorySeed}
                    onSave={handleSaveProduct}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {!paginatedProducts.length && (
            <TableRow>
              <TableCell className="text-center text-muted-foreground" colSpan={6}>
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

