"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productFormSchema } from "@/types/pos-form-schemas";
import { BarcodeLabel } from "@/components/barcode-label";

export type ProductRecord = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  categoryId: number;
};

type ProductFormValues = z.infer<typeof productFormSchema>;

type ProductDialogProps = {
  product?: ProductRecord;
  categories: Array<{ id: number; name: string }>;
  onSave: (data: ProductFormValues & { id?: number }) => void;
};

const defaultValues: ProductFormValues = {
  name: "",
  price: 0,
  stock: 0,
  barcode: "",
  categoryId: 0,
};

function generateBarcode() {
  const random8 = Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, "0");
  return random8;
}

export function ProductDialog({ product, categories, onSave }: ProductDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });
  const barcodePreview = useWatch({ control: form.control, name: "barcode" });

  useEffect(() => {
    if (!open) return;

    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        stock: product.stock,
        barcode: product.barcode,
        categoryId: product.categoryId,
      });
      return;
    }

    form.reset({ ...defaultValues, barcode: generateBarcode() });
  }, [form, open, product]);

  function onSubmit(data: ProductFormValues) {
    onSave({ ...data, id: product?.id });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={product ? "outline" : "default"}>
          {product ? "Edit" : "Add Product"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit" : "Add"} Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="product-name"
                    placeholder="Coca Cola"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="barcode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-barcode">Barcode</FieldLabel>
                  <Input
                    {...field}
                    id="product-barcode"
                    readOnly
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {barcodePreview && (
              <BarcodeLabel
                value={barcodePreview}
                downloadable
                fileName={`product-barcode-${barcodePreview}`}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-price">Price</FieldLabel>
                    <Input
                      id="product-price"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="stock"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-stock">Stock</FieldLabel>
                    <Input
                      id="product-stock"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={String(field.value || "")}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" disabled={!categories.length}>
              Save Product
            </Button>

            {!categories.length && (
              <p className="text-sm text-muted-foreground">
                Add a category first before creating products.
              </p>
            )}
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

