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
import { cn } from "@/lib/utils";

const MONTHLY_VOLUME_UNSET = "__unset__" as const;


const MONTHLY_VOLUME_LABELS: Record<MonthlyVolume, string> = {
  "0-100": "0 – 100 shipments",
  "100-500": "100 – 500 shipments",
  "500-2000": "500 – 2,000 shipments",
  "2000+": "2,000+ shipments",
};

/** Base UI Select requires `items` for SelectValue to show labels, not raw values. */
const MONTHLY_VOLUME_SELECT_ITEMS: ReadonlyArray<{
  value: typeof MONTHLY_VOLUME_UNSET | MonthlyVolume;
  label: string;
}> = [
  { value: MONTHLY_VOLUME_UNSET, label: "Prefer not to say" },
  ...MONTHLY_VOLUME_VALUES.map((v) => ({
    value: v,
    label: MONTHLY_VOLUME_LABELS[v],
  })),
];

function toRegisterPayload(values: BusinessRegisterValues): RegisterPayload {
  const phone = values.phoneNumber.replaceAll(/\s/g, "").trim();
  const phoneNumber =
    phone === "" || phone === "+91" ? undefined : phone;

  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
    phoneNumber,
    businessName: values.businessName.trim(),
    gstNumber: values.gstNumber.trim()
      ? values.gstNumber.trim().toUpperCase()
      : undefined,
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
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "+91",
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
                      className="h-11"
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
              render={({ field, fieldState }) => {
                const raw = field.value ?? "";
                const tail = raw.startsWith("+91")
                  ? raw.slice(3)
                  : raw.replaceAll(/\D/g, "");
                const safeDigits = tail.replaceAll(/\D/g, "").slice(0, 10);

                return (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <div
                      className={cn(
                        "field-control flex h-11 min-w-0 items-stretch overflow-hidden p-0",
                        "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/30",
                        fieldState.error &&
                          "border-destructive ring-4 ring-destructive/25 dark:border-destructive",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="flex shrink-0 items-center border-r border-outline-variant/40 bg-muted/25 px-3 text-sm text-muted-foreground select-none tabular-nums dark:bg-muted/20"
                      >
                        +91
                      </span>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 shadow-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          placeholder="9876543210"
                          disabled={isLoading}
                          value={safeDigits}
                          onChange={(e) => {
                            const next = e.target.value
                              .replaceAll(/\D/g, "")
                              .slice(0, 10);
                            field.onChange(`+91${next}`);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                    className="h-11"
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
                    placeholder="8+ characters, letter and number"
                    disabled={isLoading}
                    className="h-11"
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
                      className="h-11"
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
                      placeholder="15-character GSTIN if registered"
                      disabled={isLoading}
                      className="h-11"
                      spellCheck={false}
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
                  items={MONTHLY_VOLUME_SELECT_ITEMS}
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
                      className="h-11 w-full min-w-0 px-3 text-base md:text-sm"
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
