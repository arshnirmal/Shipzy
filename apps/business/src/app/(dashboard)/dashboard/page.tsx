"use client";

import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAnalytics } from "@/hooks/use-analytics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/analytics/kpi-card";

export default function DashboardPage() {
  const now = new Date();
  const dateFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const dateTo = format(endOfMonth(now), "yyyy-MM-dd");

  const { data, isLoading } = useAnalytics(dateFrom, dateTo);
  const analytics = data?.data.analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Current month performance ({format(now, "MMMM yyyy")})
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Total Orders"
          value={analytics?.orders.total ?? 0}
          isLoading={isLoading}
        />
        <KPICard
          title="Active Deliveries"
          value={analytics?.orders.active ?? 0}
          isLoading={isLoading}
          className="border-l-4 border-l-amber-500"
        />
        <KPICard
          title="Monthly Spend"
          value={analytics?.spend.total ?? 0}
          prefix="₹"
          isLoading={isLoading}
        />
        <KPICard
          title="Success Rate"
          value={analytics?.orders.successRate ?? 0}
          suffix="%"
          isLoading={isLoading}
          className="border-l-4 border-l-green-500"
        />
      </div>

      <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle>Welcome to Shipzy Business</CardTitle>
          <CardDescription>
            Manage all your hyperlocal logistics from one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground flex gap-4">
            <p className="max-w-xl leading-relaxed">
              Use the sidebar to navigate to your Drafts, manage Order Templates, or upload orders in Bulk. The live analytics dashboard tracks your monthly volume and spend discounts.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
