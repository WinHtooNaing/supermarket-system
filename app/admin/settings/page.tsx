"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { readSession, writeSession, type SessionUser } from "@/lib/auth-session";
import { readUsers, updateUserById } from "@/lib/user-store";

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

  const form = useForm<AdminInfoValues>({
    resolver: zodResolver(adminInfoSchema),
    defaultValues: {
      userId: "",
      name: "",
      password: "",
      role: "admin",
    },
  });

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }

    if (session.role !== "admin") {
      router.replace("/sale");
      return;
    }

    const users = readUsers();
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
  }, [form, router, session]);

  function onSubmit(data: AdminInfoValues) {
    if (!session) return;

    const users = readUsers();
    const duplicate = users.find(
      (user) => user.userId === data.userId && user.userId !== session.userId
    );

    if (duplicate) {
      setSaveMessage("");
      setSaveError("This user ID is already used by another account.");
      return;
    }

    updateUserById(session.userId, {
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
  }

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold">Admin Information</h1>
      <p className="text-sm text-muted-foreground">
        Update the admin account details used for login and profile.
      </p>

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
                <Input {...field} id="admin-name" aria-invalid={fieldState.invalid} />
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
                <Input {...field} id="admin-role" readOnly />
              </Field>
            )}
          />

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}

          <Button type="submit" className="w-full sm:w-fit">
            Save Admin Info
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
