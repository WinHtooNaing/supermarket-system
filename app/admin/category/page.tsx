"use client";

import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CategoryDialog,
  type CategoryRecord,
} from "@/components/category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCategory, saveCategory, usePosData } from "@/lib/pos-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function toCategoryRecord(category: {
  id: number;
  name: string;
  createdAt: string;
}): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.slice(0, 10),
  };
}

export default function CategoriesPage() {
  const { categories, products, isLoading, error: loadError } = usePosData();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const productCountByCategory = useMemo(() => {
    return products.reduce<Record<number, number>>((acc, product) => {
      acc[product.categoryId] = (acc[product.categoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  async function handleSaveCategory(data: { name: string; id?: number }) {
    try {
      setIsSubmitting(true);
      setError("");
      await saveCategory(data);
      toast.success(
        data.id
          ? "Category updated successfully."
          : "Category created successfully.",
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save category.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      setDeletingId(id);
      setError("");
      await deleteCategory(id);
      toast.success("Category deleted successfully.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete category.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Group products for faster search and cleaner inventory structure.
          </p>
        </div>
        <CategoryDialog
          onSave={handleSaveCategory}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="mt-2 text-2xl font-bold">{categories.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned Products</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Unassigned Products</p>
          <p className="mt-2 text-2xl font-bold">
            {
              products.filter(
                (product) =>
                  !categories.some((c) => c.id === product.categoryId),
              ).length
            }
          </p>
        </div>
      </div>

      {(error || loadError) && (
        <p className="text-sm text-destructive">{error || loadError}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="w-[170px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        {/* <TableBody>
          {categories.map((category) => {
            const productCount = productCountByCategory[category.id] ?? 0;

            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.createdAt.slice(0, 10)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{productCount} products</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <CategoryDialog
                    category={toCategoryRecord(category)}
                    onSave={handleSaveCategory}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDeleteCategory(category.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {isLoading && (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={4}
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading categories...
              </TableCell>
            </TableRow>
          )}
          {!categories.length && (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={4}
              >
                No categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody> */}
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </TableCell>

                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </TableCell>

                <TableCell>
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : categories.length ? (
            categories.map((category) => {
              const productCount = productCountByCategory[category.id] ?? 0;

              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>

                  <TableCell>{category.createdAt.slice(0, 10)}</TableCell>

                  <TableCell>
                    <Badge variant="secondary">{productCount} products</Badge>
                  </TableCell>

                  {/* <TableCell className="space-x-2">
                    <CategoryDialog
                      category={toCategoryRecord(category)}
                      onSave={handleSaveCategory}
                    />

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleDeleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </TableCell> */}
                  <TableCell className="space-x-2">
                    <CategoryDialog
                      category={toCategoryRecord(category)}
                      onSave={handleSaveCategory}
                      isSubmitting={isSubmitting}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          Delete
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete <strong>{category.name}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() =>
                              void handleDeleteCategory(category.id)
                            }
                            disabled={deletingId === category.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingId === category.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={4}
              >
                No categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
