"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { Building2 } from "lucide-react";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const authParam = searchParams.get("auth");
  const isOpen = authParam === "login" || authParam === "register";

  const closeDialog = () => {
    // Navigate back to the same path but without the auth search param
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("auth");
    const searchString = newSearchParams.toString();
    const newUrl = searchString ? `${pathname}?${searchString}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("auth", value);
    router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden p-0 bg-surface-container-lowest border border-outline-variant/20 shadow-[0_12px_32px_rgba(13,28,46,0.06)]">
        <div className="flex flex-col items-center justify-center p-8 pb-4 text-center">
          <div className="gradient-brand flex h-14 w-14 items-center justify-center rounded-lg mb-4 shadow-[var(--shadow-ambient-sm)]">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Shipzy for Business
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            Manage your hyperlocal deliveries effortlessly.
          </DialogDescription>
        </div>

        <Tabs 
          value={authParam || "login"} 
          onValueChange={handleTabChange}
          className="w-full px-8 pb-8"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-lg bg-surface-container-low p-1">
            <TabsTrigger value="login" className="rounded-lg h-full label-md">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg h-full label-md">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0 animate-in fade-in-50 slide-in-from-left-2 duration-300">
            <LoginForm onSuccess={closeDialog} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-0 animate-in fade-in-50 slide-in-from-right-2 duration-300">
            <RegisterForm onSuccess={closeDialog} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
