"use client";

import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { Package, Truck, IndianRupee, TrendingUp, PlusCircle, BarChart2, Upload } from "lucide-react";

import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { KPICard } from "@/components/analytics/kpi-card";
import { QueryErrorHandler } from "@/components/shared/query-error-handler";
import { RefetchIndicator } from "@/components/shared/refetch-indicator";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const dateFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const dateTo = format(endOfMonth(now), "yyyy-MM-dd");

  const analyticsQuery = useAnalytics(dateFrom, dateTo);
  const { data, isLoading, isFetching, refetch } = analyticsQuery;
  const analytics = data?.data.analytics;

  return (
    <div className="space-y-8 pb-8 reveal-visible">
      {/* Header section with personalized greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {user?.businessName ? `Welcome back, ${user.businessName}!` : "Dashboard"}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <p>Here's your performance for {format(now, "MMMM yyyy")}</p>
            <RefetchIndicator isRefetching={isFetching && !isLoading} />
          </div>
        </div>
      </div>

      <QueryErrorHandler query={analyticsQuery} onRetry={refetch}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Total Orders"
            value={analytics?.orders.total ?? 0}
            icon={Package}
            trend={{ value: 12.5, isPositive: true }}
            isLoading={isLoading}
            className="reveal-visible [animation-delay:100ms]"
          />
          <KPICard
            title="Active Deliveries"
            value={analytics?.orders.active ?? 0}
            icon={Truck}
            trend={{ value: 4.2, isPositive: true }}
            isLoading={isLoading}
            className="reveal-visible [animation-delay:200ms]"
          />
          <KPICard
            title="Monthly Spend"
            value={analytics?.spend.total ?? 0}
            prefix="₹"
            icon={IndianRupee}
            trend={{ value: 2.1, isPositive: false }}
            isLoading={isLoading}
            className="reveal-visible [animation-delay:300ms]"
          />
          <KPICard
            title="Success Rate"
            value={analytics?.orders.successRate ?? 0}
            suffix="%"
            icon={TrendingUp}
            trend={{ value: 1.1, isPositive: true }}
            isLoading={isLoading}
            className="reveal-visible [animation-delay:400ms]"
          />
        </div>
      </QueryErrorHandler>

      {/* Quick Actions Panel */}
      <Card className="gradient-mesh border-primary/20 shadow-lg reveal-visible [animation-delay:500ms] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Package className="w-48 h-48 orb-float" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-foreground/80 max-w-lg text-base">
            Jump right into managing your logistics. Create a new order, upload in bulk, or check your detailed analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 flex flex-wrap gap-4 mt-2">
          <Link
            href="/orders/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-md)] transition-transform hover:scale-105"
            )}
          >
            <PlusCircle className="mr-2 size-5" />
            Create Order
          </Link>
          <Link
            href="/orders/bulk"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "bg-background/50 backdrop-blur border-primary/30 hover:bg-background/80 transition-transform hover:scale-105"
            )}
          >
            <Upload className="mr-2 size-5 text-primary" />
            Bulk Upload
          </Link>
          <Link
            href="/analytics"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "shadow-sm transition-transform hover:scale-105"
            )}
          >
            <BarChart2 className="mr-2 size-5" />
            View Analytics
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
