"use client";

import { useState } from "react";

import { CategoryDialog, CategoryRecord } from "@/components/category-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const categorySeed: CategoryRecord[] = [
  { id: 1, name: "Drink", createdAt: "2026-04-13" },
  { id: 2, name: "Food", createdAt: "2026-04-14" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>(categorySeed);

  function handleSaveCategory(data: { name: string; id?: number }) {
    if (data.id) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === data.id ? { ...category, name: data.name } : category
        )
      );
      return;
    }

    setCategories((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: data.name,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  function handleDeleteCategory(id: number) {
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Categories</h1>
        <CategoryDialog onSave={handleSaveCategory} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[170px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.createdAt}</TableCell>
              <TableCell className="space-x-2">
                <CategoryDialog category={category} onSave={handleSaveCategory} />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {!categories.length && (
            <TableRow>
              <TableCell className="text-center text-muted-foreground" colSpan={3}>
                No categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
