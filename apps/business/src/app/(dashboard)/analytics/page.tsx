"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/analytics/kpi-card";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { QueryErrorHandler } from "@/components/shared/query-error-handler";
import { RefetchIndicator } from "@/components/shared/refetch-indicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

// ── Skeleton for the KPI grid ─────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-8 mt-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const analyticsQuery = useAnalytics(dateFrom, dateTo);
  const { data, isLoading, isFetching, refetch } = analyticsQuery;

  // Validate range <= 366 days
  const isValidRange = (() => {
    if (!dateFrom || !dateTo) return false;
    const diffDays = Math.ceil(
      Math.abs(new Date(dateTo).getTime() - new Date(dateFrom).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return diffDays <= 366;
  })();

  function handleDateChange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
  }

  const analytics = data?.data.analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <BarChart2 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <RefetchIndicator isRefetching={isFetching && !isLoading} />
          </div>
          <p className="mt-1 text-muted-foreground">
            Track delivery volume, cost trends, and on-time performance.
          </p>
        </div>
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={handleDateChange}
        />
      </div>

      {/* Invalid range warning */}
      {!isValidRange && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Date Range</AlertTitle>
          <AlertDescription>
            The selected date range exceeds 366 days. Please select a shorter period.
          </AlertDescription>
        </Alert>
      )}

      {/* Data area */}
      {isValidRange && (
        <>
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <QueryErrorHandler query={analyticsQuery} onRetry={refetch}>
              <>
                {/* KPI Row: Volume */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Total Orders"
                    value={analytics?.orders.total ?? 0}
                    isLoading={false}
                    className="border-l-4 border-l-blue-500"
                  />
                  <KPICard
                    title="Delivered"
                    value={analytics?.orders.delivered ?? 0}
                    isLoading={false}
                    className="border-l-4 border-l-green-500"
                  />
                  <KPICard
                    title="Cancelled"
                    value={analytics?.orders.cancelled ?? 0}
                    isLoading={false}
                    className="border-l-4 border-l-red-500"
                  />
                  <KPICard
                    title="Active / In Progress"
                    value={analytics?.orders.active ?? 0}
                    isLoading={false}
                    className="border-l-4 border-l-amber-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Financial Overview */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-8">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                        <p className="text-4xl font-bold tracking-tight">
                          ₹{(analytics?.spend.total ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="hidden sm:block w-px bg-border" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Average Order Value
                        </p>
                        <p className="text-4xl font-bold tracking-tight text-primary">
                          ₹
                          {(analytics?.spend.average ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <span className="font-bold">
                            {analytics?.orders.successRate ?? 0}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-green-500 transition-all duration-1000 ease-out"
                            style={{ width: `${analytics?.orders.successRate ?? 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Avg. Delivery Duration
                        </p>
                        <p className="text-2xl font-semibold">
                          {analytics?.delivery.avgDurationMins ?? 0}{" "}
                          <span className="text-base font-normal text-muted-foreground">
                            mins
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            </QueryErrorHandler>
          )}
        </>
      )}
    </div>
  );
}
