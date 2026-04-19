"use client";

import { useState, Suspense } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BulkCancelDialog } from "@/components/orders/bulk-cancel-dialog";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { useOrders, useBulkCancelOrders } from "@/hooks/use-orders";
import { DEFAULT_FILTERS } from "@/types/orders";
import type { OrderFilters } from "@/types/orders";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

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

  const { data, isLoading } = useOrders(filters);
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
    // Use replace for filter changes to avoid filling history with every keystroke
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleStatusTab(value: string) {
    updateFilters({
      status: value as OrderFilters["status"],
      page: 1, // Reset to first page on status change
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
      toast.error("Bulk cancel failed. Please try again.");
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
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
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

      {/* Table */}
      <OrdersTable
        data={orders}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={updateFilters}
        onBulkCancel={(ids) => setBulkCancelIds(ids)}
      />

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
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
