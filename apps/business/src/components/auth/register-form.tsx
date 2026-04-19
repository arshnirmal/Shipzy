"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MONTHLY_VOLUME_VALUES,
  businessRegisterSchema,
  type BusinessRegisterValues,
  type MonthlyVolume,
} from "@/lib/validations/auth";
import type { RegisterPayload } from "@/types/auth";
import { useAuth } from "@/providers/auth-provider";

const MONTHLY_VOLUME_UNSET = "__unset__" as const;

const MONTHLY_VOLUME_LABELS: Record<MonthlyVolume, string> = {
  "0-100": "0 – 100 shipments",
  "100-500": "100 – 500 shipments",
  "500-2000": "500 – 2,000 shipments",
  "2000+": "2,000+ shipments",
};

function toRegisterPayload(values: BusinessRegisterValues): RegisterPayload {
  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
    phoneNumber: values.phoneNumber?.trim()
      ? values.phoneNumber.trim()
      : undefined,
    businessName: values.businessName,
    gstNumber: values.gstNumber?.trim() ? values.gstNumber.trim() : undefined,
    monthlyVolume: values.monthlyVolume,
  };
}

export function RegisterForm({
  onSuccess,
}: Readonly<{ onSuccess?: () => void }>) {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BusinessRegisterValues>({
    resolver: standardSchemaResolver(businessRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      businessName: "",
      gstNumber: "",
      monthlyVolume: undefined,
    },
  });

  async function onSubmit(data: BusinessRegisterValues) {
    setIsLoading(true);
    try {
      await signUp(toRegisterPayload(data));
      toast.success("Account created successfully!");
      if (onSuccess) onSuccess();
      router.push("/dashboard");
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
                <FormLabel>Monthly shipping volume</FormLabel>
                <Select
                  value={field.value ?? MONTHLY_VOLUME_UNSET}
                  onValueChange={(v) =>
                    field.onChange(
                      v === MONTHLY_VOLUME_UNSET ? undefined : (v as MonthlyVolume),
                    )
                  }
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger
                      className="h-11 w-full min-w-0 rounded-lg border-outline-variant/20 bg-surface-container-lowest px-3 text-base shadow-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/30 md:text-sm"
                      size="default"
                    >
                      <SelectValue placeholder="Prefer not to say" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={MONTHLY_VOLUME_UNSET}>
                      Prefer not to say
                    </SelectItem>
                    {MONTHLY_VOLUME_VALUES.map((bucket) => (
                      <SelectItem key={bucket} value={bucket}>
                        {MONTHLY_VOLUME_LABELS[bucket]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Optional. Helps us size your account and support.
                </FormDescription>
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
