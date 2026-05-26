"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { readSession, writeSession, type SessionUser } from "@/lib/auth-session";
import { saveUser, usePosData } from "@/lib/pos-store";
import { toast } from "sonner";

const adminInfoSchema = z.object({
  userId: z
    .string()
    .trim()
    .nonempty("User ID is required.")
    .min(5, "User ID must be at least 5 characters.")
    .max(20, "User ID must be at most 20 characters."),
  name: z
    .string()
    .trim()
    .nonempty("Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  password: z
    .string()
    .nonempty("Password is required.")
    .min(6, "Password must be at least 6 characters.")
    .max(50, "Password must be at most 50 characters."),
  role: z.literal("admin"),
});

type AdminInfoValues = z.infer<typeof adminInfoSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(() => readSession());
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const { users, isLoading } = usePosData();

  const form = useForm<AdminInfoValues>({
    resolver: zodResolver(adminInfoSchema),
    defaultValues: {
      userId: "",
      name: "",
      password: "",
      role: "admin",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session) {
      router.replace("/auth");
      return;
    }

    if (session.role !== "admin") {
      router.replace("/sale");
      return;
    }

    const admin = users.find((user) => user.userId === session.userId);

    if (!admin || admin.role !== "admin") {
      router.replace("/auth");
      return;
    }

    form.reset({
      userId: admin.userId,
      name: admin.name,
      password: admin.password,
      role: "admin",
    });
  }, [form, isLoading, router, session, users]);

  async function onSubmit(data: AdminInfoValues) {
    if (!session) return;

    const duplicate = users.find(
      (user) => user.userId === data.userId && user.userId !== session.userId
    );

    if (duplicate) {
      setSaveMessage("");
      const message = "This user ID is already used by another account.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    const currentAdmin = users.find((user) => user.userId === session.userId);

    if (!currentAdmin) {
      setSaveMessage("");
      const message = "Admin account could not be found.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    try {
      await saveUser({
        id: currentAdmin.id,
        userId: data.userId,
        name: data.name,
        password: data.password,
        role: "admin",
      });

      const nextSession = { userId: data.userId, name: data.name, role: "admin" as const };
      writeSession(nextSession);
      setSession(nextSession);

      setSaveError("");
      setSaveMessage("Admin information updated successfully.");
      toast.success("Admin information updated successfully.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to update admin information.";
      setSaveMessage("");
      setSaveError(message);
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold">Admin Information</h1>
      <p className="text-sm text-muted-foreground">
        Update the admin account details used for login and profile.
      </p>

      {isLoading ? (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-36" />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="userId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="admin-user-id">User ID</FieldLabel>
                  <Input
                    {...field}
                    id="admin-user-id"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
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
                  <FieldLabel htmlFor="admin-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="admin-name"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
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
                  <FieldLabel htmlFor="admin-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="admin-password"
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
              name="role"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="admin-role">Role</FieldLabel>
                  <Input {...field} id="admin-role" readOnly disabled />
                </Field>
              )}
            />

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}

            <Button type="submit" className="w-full sm:w-fit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Admin Info"
              )}
            </Button>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
