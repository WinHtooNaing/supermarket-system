"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
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
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { loginAction } from "@/server/auth";

const AuthPage = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authError, setAuthError] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_id: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    setAuthError("");

    startTransition(async () => {
      const result = await loginAction(values);

      if (result.errors?.user_id) {
        form.setError("user_id", {
          message: result.errors.user_id[0],
        });
      }

      if (result.errors?.password) {
        form.setError("password", {
          message: result.errors.password[0],
        });
      }

      if (result.message) {
        setAuthError(result.message);
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
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
                    <FieldLabel htmlFor="login-user-id">User ID</FieldLabel>
                    <Input
                      {...field}
                      id="login-user-id"
                      placeholder="Enter your user ID"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                      onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                      onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            {authError && <p className="mt-3 text-sm text-destructive">{authError}</p>}

            <div className="mt-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default AuthPage;
