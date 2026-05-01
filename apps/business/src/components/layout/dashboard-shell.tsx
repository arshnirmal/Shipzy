"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import {
  BanknoteArrowUp,
  BarChart2,
  FileEdit,
  LayoutDashboard,
  LayoutList,
  LogOut,
  PlusCircle,
  Settings,
  ShoppingBag,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";

type DashboardShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/orders", label: "Orders", icon: ShoppingBag, exact: true },
      { href: "/orders/new", label: "New Order", icon: PlusCircle },
      { href: "/drafts", label: "Drafts", icon: FileEdit },
      { href: "/templates", label: "Templates", icon: LayoutList },
      { href: "/orders/bulk", label: "Bulk Create", icon: Upload, exact: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/accounting", label: "Accounting", icon: BanknoteArrowUp },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function initialsFromEmail(email: string) {
  const [namePart] = email.split("@");
  return namePart.slice(0, 2).toUpperCase();
}

const allNavItems = navGroups.flatMap((g) => g.items);

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut, user } = useAuth();

  const activeItem = allNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const params = new URLSearchParams({ auth: "login", next: pathname });
      router.replace(`/?${params.toString()}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading business portal...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-2 py-1"
          >
            <Image src="/app_logo.svg" alt="Shipzy" width={32} height={32} className="shrink-0" />
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">Shipzy Business</p>
              <p className="text-xs text-muted-foreground">Merchant Portal</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter />
      </Sidebar>

      <SidebarInset>
        {/* Offline Banner Slot (renders inside AppProviders at the root) */}
        
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <SidebarTrigger className="hidden md:inline-flex" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Business Portal
              </p>
              <p className="text-sm font-medium">
                {activeItem?.label ?? "Dashboard"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar>
                <AvatarFallback>
                  {initialsFromEmail(user?.email ?? "sb@shipzy.com")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm">
                  {user?.businessName ?? "Business account"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void signOut();
                }}
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-secondary/30 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
