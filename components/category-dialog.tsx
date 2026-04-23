"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { categoryFormSchema } from "@/types/pos-form-schemas";

export type CategoryRecord = {
  id: number;
  name: string;
  createdAt: string;
};

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type CategoryDialogProps = {
  category?: CategoryRecord;
  onSave: (data: CategoryFormValues & { id?: number }) => void;
};

export function CategoryDialog({ category, onSave }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({ name: category?.name ?? "" });
  }, [category, form, open]);

  function onSubmit(data: CategoryFormValues) {
    onSave({ ...data, id: category?.id });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={category ? "outline" : "default"}>
          {category ? "Edit" : "Add Category"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit" : "Add"} Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
                  <Input
                    {...field}
                    id="category-name"
                    placeholder="Drink"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button type="submit">Save Category</Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
