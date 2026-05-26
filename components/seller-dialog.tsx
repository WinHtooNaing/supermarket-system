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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { roleOptions, sellerFormSchema } from "@/types/pos-form-schemas";

export type SellerRecord = {
  id: number;
  userId: string;
  password: string;
  name: string;
  role: "admin" | "seller";
  createdAt: string;
};

type SellerFormValues = z.infer<typeof sellerFormSchema>;

type SellerDialogProps = {
  seller?: SellerRecord;
  onSave: (data: SellerFormValues & { id?: number }) => void | Promise<void>;
};

export function SellerDialog({ seller, onSave }: SellerDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      userId: "",
      password: "",
      name: "",
      role: "seller",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;

    form.reset({
      userId: seller?.userId ?? "",
      password: seller?.password ?? "",
      name: seller?.name ?? "",
      role: seller?.role ?? "seller",
    });
  }, [form, open, seller]);

  async function onSubmit(data: SellerFormValues) {
    await onSave({ ...data, id: seller?.id });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={seller ? "outline" : "default"}>
          {seller ? "Edit" : "Add Seller"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seller ? "Edit" : "Add"} Seller</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="userId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="seller-user-id">User ID</FieldLabel>
                  <Input
                    {...field}
                    id="seller-user-id"
                    placeholder="seller001"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="seller-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="seller-password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="seller-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="seller-name"
                    placeholder="Mg Mg"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Seller"
              )}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
