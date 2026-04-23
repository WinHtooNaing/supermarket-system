"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { saleFormSchema } from "@/types/pos-form-schemas";

type SaleFormValues = z.infer<typeof saleFormSchema>;

export type SaleRecord = {
  id: number;
  sellerId: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
};

type SaleDialogProps = {
  sellers: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string; price: number }>;
  onSave: (
    data: SaleFormValues & {
      totalAmount: number;
    }
  ) => void;
};

const defaultValues: SaleFormValues = {
  sellerId: 0,
  items: [{ productId: 0, quantity: 1, price: 0 }],
};

export function SaleDialog({ sellers, products, onSave }: SaleDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = useWatch({ control: form.control, name: "items" });

  const totalAmount = useMemo(() => {
    return (items || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );
  }, [items]);

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
    }
  }, [form, open]);

  function onSubmit(data: SaleFormValues) {
    onSave({
      ...data,
      totalAmount,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Create Sale</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="sellerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Seller</FieldLabel>
                  <Select
                    value={String(field.value || "")}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={String(seller.id)}>
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sale Items</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ productId: 0, quantity: 1, price: 0 })}
                >
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-4">
                  <Controller
                    name={`items.${index}.productId`}
                    control={form.control}
                    render={({ field: productField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Product</FieldLabel>
                        <Select
                          value={String(productField.value || "")}
                          onValueChange={(value) => {
                            const productId = Number(value);
                            productField.onChange(productId);

                            const selectedProduct = products.find((p) => p.id === productId);
                            form.setValue(
                              `items.${index}.price`,
                              selectedProduct?.price ?? 0,
                              { shouldValidate: true }
                            );
                          }}
                        >
                          <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.quantity`}
                    control={form.control}
                    render={({ field: quantityField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Quantity</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          value={quantityField.value}
                          onChange={(e) => quantityField.onChange(e.target.value)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.price`}
                    control={form.control}
                    render={({ field: priceField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Price</FieldLabel>
                        <Input
                          type="number"
                          min={0}
                          value={priceField.value}
                          onChange={(e) => priceField.onChange(e.target.value)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {form.formState.errors.items?.message && (
                <FieldError errors={[form.formState.errors.items]} />
              )}
            </div>

            <div className="rounded-md border p-3 text-sm">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{totalAmount}</p>
            </div>

            <Button type="submit" disabled={!sellers.length || !products.length}>
              Save Sale
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
