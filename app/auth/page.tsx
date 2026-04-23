"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import loginSchema from "@/types/login-schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { writeSession } from "@/lib/auth-session";
import { readUsers } from "@/lib/user-store";

const AuthPage = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_id: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    const users = readUsers();
    const user = users.find(
      (item) => item.userId === data.user_id && item.password === data.password
    );

    if (!user) {
      setAuthError("Invalid user ID or password.");
      return;
    }

    setAuthError("");
    writeSession({ userId: user.userId, name: user.name, role: user.role });

    if (user.role === "seller") {
      router.push("/sale");
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <section className="my-auto flex flex-col items-center">
      <h1 className="my-4 text-2xl font-bold">Super Market POS System</h1>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your user ID below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="user_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-user_id">User ID</FieldLabel>
                    <Input
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        field.onChange(value);
                      }}
                      id="form-rhf-demo-user_id"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your user ID"
                      autoComplete="off"
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
                    <FieldLabel htmlFor="form-rhf-demo-password">Password</FieldLabel>
                    <Input
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        field.onChange(value);
                      }}
                      id="form-rhf-demo-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            {authError && <p className="mt-3 text-sm text-destructive">{authError}</p>}

            <div className="mt-4">
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default AuthPage;
