"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { apiRequest } from "@/lib/api";
import { setStoredTokens, setStoredUser } from "@/lib/auth";
import type { AuthResponseData } from "@/types/auth";

export function LoginForm({ onSuccess }: Readonly<{ onSuccess?: () => void }>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginValues) {
    setIsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        data: AuthResponseData;
      }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ credentials: data }),
        },
        { auth: false },
      );

      if (response.success && response.data) {
        setStoredTokens({
          accessToken: response.data.auth.tokens.accessToken,
          refreshToken: response.data.auth.tokens.refreshToken,
        });
        setStoredUser(response.data.actor.user);
        toast.success("Welcome back!");
        if (onSuccess) onSuccess();
        router.push("/dashboard");
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="h-11 rounded-lg bg-surface-container-lowest border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-11 rounded-lg bg-surface-container-lowest border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-11 rounded-lg gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)] font-medium text-base mt-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  );
}
