"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";

const step1Schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100),
    email: z.string().email("Please enter a valid email address").max(100),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const wizardSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100),
    email: z.string().email("Please enter a valid email address").max(100),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string(),
    businessName: z
      .string()
      .min(2, "Business name is required")
      .max(200, "Business name is too long"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .max(20)
      .optional()
      .or(z.literal("")),
    gstNumber: z
      .string()
      .max(15, "GST number is too long")
      .optional()
      .or(z.literal("")),
    monthlyVolume: z
      .enum(["0-100", "100-500", "500-2000", "2000+"])
      .optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type WizardFormValues = z.infer<typeof wizardSchema>;

const MONTHLY_VOLUME_OPTIONS = [
  { value: "0-100", label: "0–100 shipments/month" },
  { value: "100-500", label: "100–500 shipments/month" },
  { value: "500-2000", label: "500–2,000 shipments/month" },
  { value: "2000+", label: "2,000+ shipments/month" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, signUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm<WizardFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      phone: "",
      gstNumber: "",
      monthlyVolume: undefined,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleContinue = () => {
    const values = form.getValues();
    const result = step1Schema.safeParse({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof WizardFormValues, {
            message: issue.message,
          });
        }
      }
      return;
    }

    form.clearErrors();
    setStep(2);
  };

  const onSubmit = async (values: WizardFormValues) => {
    const parsed = wizardSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof WizardFormValues, {
            message: issue.message,
          });
        }
      }
      return;
    }

    try {
      await signUp({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone || undefined,
        businessName: parsed.data.businessName,
        gstNumber: parsed.data.gstNumber || undefined,
        monthlyVolume: parsed.data.monthlyVolume,
      });
      toast.success("Account created! Welcome to Shipzy Business.");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete registration";
      toast.error(message);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-tr from-background via-secondary/40 to-accent/30 px-4 py-10">
      <Card className="w-full max-w-lg border-border/70 backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="space-y-1.5">
            <p className="label-sm text-muted-foreground">Step {step} of 2</p>
            <div className="flex gap-1.5">
              <div className="h-1 flex-1 rounded-full bg-primary" />
              <div
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  step === 2 ? "bg-primary" : "bg-border"
                }`}
              />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? "Create your account" : "Set up your business"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Start managing delivery operations with Shipzy Business."
              : "Tell us about your business to personalise your dashboard."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Arjun Sharma"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="owner@store.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleContinue}
                  >
                    Continue →
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business name</FormLabel>
                        <FormControl>
                          <Input placeholder="Shipzy Foods LLP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Phone{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+91 98765 43210"
                              autoComplete="tel"
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
                        <FormItem>
                          <FormLabel>
                            GST number{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="22AAAAA0000A1Z5" {...field} />
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
                        <FormLabel>
                          Monthly shipment volume{" "}
                          <span className="font-normal text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || undefined)
                            }
                          >
                            <option value="">Select a range</option>
                            {MONTHLY_VOLUME_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Setting up..."
                        : "Launch Dashboard →"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>

          {step === 1 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
