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
import {
  businessRegisterSchema,
  type BusinessRegisterValues,
} from "@/lib/validations/auth";
import { apiRequest } from "@/lib/api";
import { setStoredTokens, setStoredUser } from "@/lib/auth";
import type { AuthResponseData } from "@/types/auth";

export function RegisterForm({
  onSuccess,
}: Readonly<{ onSuccess?: () => void }>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BusinessRegisterValues>({
    resolver: zodResolver(businessRegisterSchema as any),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      businessName: "",
      gstNumber: "",
      monthlyVolume: "",
    },
  });

  async function onSubmit(data: BusinessRegisterValues) {
    setIsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        data: AuthResponseData;
      }>(
        "/auth/register/business",
        {
          method: "POST",
          body: JSON.stringify({
            identity: {
              fullName: data.fullName,
              phoneNumber: data.phoneNumber || undefined,
            },
            credentials: {
              email: data.email,
              password: data.password,
            },
            business: {
              businessName: data.businessName,
              gstNumber: data.gstNumber || undefined,
              monthlyVolume: data.monthlyVolume || undefined,
            },
          }),
        },
        { auth: false },
      );

      if (response.success && response.data) {
        setStoredTokens({
          accessToken: response.data.auth.tokens.accessToken,
          refreshToken: response.data.auth.tokens.refreshToken,
        });
        setStoredUser(response.data.actor.user);
        toast.success("Account created successfully!");
        if (onSuccess) onSuccess();
        router.push("/dashboard");
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1..."
                      disabled={isLoading}
                      className="h-11 rounded-lg bg-surface-container-lowest border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
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
                    disabled={isLoading}
                    className="h-11 rounded-lg bg-surface-container-lowest border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corp"
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
              name="gstNumber"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>GST Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      className="h-11 rounded-lg bg-surface-container-lowest border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="monthlyVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Volume (Optional)</FormLabel>
                <FormControl>
                  <select
                    className="flex h-11 w-full min-w-0 rounded-lg bg-surface-container-lowest border border-outline-variant/20 focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4 px-3 py-1 text-base transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
                    disabled={isLoading}
                    {...field}
                  >
                    <option value="" disabled>
                      Select volume
                    </option>
                    <option value="0-100">0 - 100</option>
                    <option value="100-500">100 - 500</option>
                    <option value="500-2000">500 - 2000</option>
                    <option value="2000+">2000+</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 rounded-lg gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)] font-medium text-base mt-4"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>
    </div>
  );
}
