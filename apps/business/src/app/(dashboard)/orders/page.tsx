"use client";

import { useState, Suspense } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BulkCancelDialog } from "@/components/orders/bulk-cancel-dialog";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { QueryErrorHandler } from "@/components/shared/query-error-handler";
import { RefetchIndicator } from "@/components/shared/refetch-indicator";
import { useOrders, useBulkCancelOrders } from "@/hooks/use-orders";
import { DEFAULT_FILTERS } from "@/types/orders";
import type { OrderFilters } from "@/types/orders";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// ── Skeleton for the full table area ─────────────────────────────────────────

function OrdersTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-outline-variant/10 last:border-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bulkCancelIds, setBulkCancelIds] = useState<number[]>([]);

  // Derive filters from URL
  const filters: OrderFilters = {
    ...DEFAULT_FILTERS,
    status: (searchParams.get("status") as OrderFilters["status"]) || DEFAULT_FILTERS.status,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : DEFAULT_FILTERS.page,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : DEFAULT_FILTERS.limit,
    sortBy: (searchParams.get("sortBy") as OrderFilters["sortBy"]) || DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || DEFAULT_FILTERS.sortOrder,
    search: searchParams.get("search") || DEFAULT_FILTERS.search,
    dateFrom: searchParams.get("dateFrom") || DEFAULT_FILTERS.dateFrom,
    dateTo: searchParams.get("dateTo") || DEFAULT_FILTERS.dateTo,
    deliveryTypeId: searchParams.get("deliveryTypeId") || DEFAULT_FILTERS.deliveryTypeId,
    minPrice: searchParams.get("minPrice") || DEFAULT_FILTERS.minPrice,
    maxPrice: searchParams.get("maxPrice") || DEFAULT_FILTERS.maxPrice,
  };

  const ordersQuery = useOrders(filters);
  const { data, isLoading, isFetching, refetch } = ordersQuery;
  const bulkCancel = useBulkCancelOrders();

  function updateFilters(patch: Partial<OrderFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value as string | number));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleStatusTab(value: string) {
    updateFilters({
      status: value as OrderFilters["status"],
      page: 1,
    });
  }

  async function handleBulkCancel(reason: string) {
    try {
      const result = await bulkCancel.mutateAsync({
        ids: bulkCancelIds,
        reason,
      });
      const { cancelled, failed } = result.data.bulk;
      if (cancelled > 0) {
        toast.success(
          `${cancelled} order${cancelled === 1 ? "" : "s"} cancelled successfully.`,
        );
      }
      if (failed > 0) {
        toast.warning(
          `${failed} order${failed === 1 ? "" : "s"} could not be cancelled.`,
        );
      }
    } catch {
      // onError in the hook also fires — toast is shown there
    } finally {
      setBulkCancelIds([]);
    }
  }

  const orders = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <RefetchIndicator isRefetching={isFetching && !isLoading} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage and track all deliveries from your account.
          </p>
        </div>
        <Link
          href="/orders/new"
          className={cn(
            buttonVariants({ size: "default" }),
            "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]",
          )}
        >
          <PlusCircle className="mr-2 size-4" />
          New Order
        </Link>
      </div>

      {/* Status tabs */}
      <Tabs value={filters.status} onValueChange={handleStatusTab}>
        <TabsList className="h-10 bg-surface-container-low p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <OrdersFilters filters={filters} onChange={updateFilters} />

      {/* Table area — show skeleton on first load, then delegate errors */}
      {isLoading ? (
        <OrdersTableSkeleton />
      ) : (
        <QueryErrorHandler query={ordersQuery} onRetry={refetch}>
          <OrdersTable
            data={orders}
            pagination={pagination}
            isLoading={false}
            filters={filters}
            onFiltersChange={updateFilters}
            onBulkCancel={(ids) => setBulkCancelIds(ids)}
          />
        </QueryErrorHandler>
      )}

      {/* Bulk cancel dialog */}
      <BulkCancelDialog
        open={bulkCancelIds.length > 0}
        count={bulkCancelIds.length}
        onConfirm={handleBulkCancel}
        onClose={() => setBulkCancelIds([])}
        isPending={bulkCancel.isPending}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-80" />
          <OrdersTableSkeleton />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
