"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { AlertCircle, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KPICard } from "@/components/analytics/kpi-card";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useAnalytics } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading, error } = useAnalytics(dateFrom, dateTo);

  // Validate range <= 366 days
  const isValidRange = (() => {
    if (!dateFrom || !dateTo) return false;
    const f = new Date(dateFrom);
    const t = new Date(dateTo);
    const diffTime = Math.abs(t.getTime() - f.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 366;
  })();

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const analytics = data?.data.analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <BarChart2 className="h-8 w-8 text-primary" /> Analytics
          </h1>
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

      {isValidRange ? (
        error ? (
          <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error Loading Data</AlertTitle>
             <AlertDescription>{error.message || "Something went wrong."}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* KPI Row 1: Volume */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Orders"
                value={analytics?.orders.total ?? 0}
                isLoading={isLoading}
                className="border-l-4 border-l-blue-500"
              />
              <KPICard
                title="Delivered"
                value={analytics?.orders.delivered ?? 0}
                isLoading={isLoading}
                className="border-l-4 border-l-green-500"
              />
              <KPICard
                title="Cancelled"
                value={analytics?.orders.cancelled ?? 0}
                isLoading={isLoading}
                className="border-l-4 border-l-red-500"
              />
              <KPICard
                title="Active / In Progress"
                value={analytics?.orders.active ?? 0}
                isLoading={isLoading}
                className="border-l-4 border-l-amber-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {/* Spend Overview */}
               <Card className="lg:col-span-2">
                 <CardHeader>
                   <CardTitle className="text-base font-medium">Financial Overview</CardTitle>
                 </CardHeader>
                 <CardContent className="flex flex-col sm:flex-row gap-8">
                    <div className="flex-1 space-y-2">
                       <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                       <p className="text-4xl font-bold tracking-tight">
                         {isLoading ? (
                           <span className="inline-block h-10 w-32 animate-pulse bg-muted rounded" />
                         ) : (
                           `₹${(analytics?.spend.total ?? 0).toLocaleString()}`
                         )}
                       </p>
                    </div>
                    <div className="hidden sm:block w-px bg-border" />
                    <div className="flex-1 space-y-2">
                       <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                       <p className="text-4xl font-bold tracking-tight text-primary">
                         {isLoading ? (
                           <span className="inline-block h-10 w-24 animate-pulse bg-muted rounded" />
                         ) : (
                           `₹${(analytics?.spend.average ?? 0).toLocaleString(undefined, {maximumFractionDigits: 1})}`
                         )}
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
                         <span className="font-bold">{isLoading ? "-" : `${analytics?.orders.successRate ?? 0}%`}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div 
                            className="h-full bg-green-500 transition-all duration-1000 ease-out" 
                            style={{ width: `${analytics?.orders.successRate ?? 0}%` }}
                          />
                      </div>
                   </div>

                   <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Delivery Duration</p>
                      <p className="text-2xl font-semibold">
                        {isLoading ? "-" : `${analytics?.delivery.avgDurationMins ?? 0}`} <span className="text-base font-normal text-muted-foreground">mins</span>
                      </p>
                   </div>
                 </CardContent>
               </Card>
            </div>
          </>
        )
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Date Range</AlertTitle>
          <AlertDescription>
            The selected date range exceeds 366 days. Please select a shorter period.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
