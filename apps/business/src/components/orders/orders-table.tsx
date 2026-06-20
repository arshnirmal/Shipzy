"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { downloadOrdersCsv } from "@/hooks/use-orders";
import { getErrorMessage } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentModeBadge } from "./payment-status-badge";
import type { OrderFilters, OrderListItem, Pagination } from "@/types/orders";

const col = createColumnHelper<OrderListItem>();

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function hasActiveFilters(filters: OrderFilters) {
  return Boolean(
    filters.status !== "all" ||
      filters.search ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.deliveryTypeId ||
      filters.minPrice ||
      filters.maxPrice,
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const maxVisible = 5;
  const safeTotal = Math.max(totalPages, 1);
  const start = Math.max(
    1,
    Math.min(currentPage - Math.floor(maxVisible / 2), safeTotal - maxVisible + 1),
  );
  const end = Math.min(safeTotal, start + maxVisible - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

type OrdersTableProps = {
  data: OrderListItem[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  filters: OrderFilters;
  onFiltersChange: (patch: Partial<OrderFilters>) => void;
  onBulkCancel: (ids: number[]) => void;
};

export function OrdersTable({
  data,
  pagination,
  isLoading,
  filters,
  onFiltersChange,
  onBulkCancel,
}: OrdersTableProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRowSelection({});
  }, [filters.page, filters.search, filters.status, data]);

  const columns = useMemo(
    () => [
      col.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      }),
      col.accessor((row) => row.order.identifiers.orderNumber ?? `#${row.order.identifiers.orderId}`, {
        id: "orderNumber",
        header: "Order",
        cell: ({ getValue, row }) => (
          <Link
            href={`/orders/${row.original.order.identifiers.orderId}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {getValue()}
          </Link>
        ),
      }),
      col.accessor((row) => row.order.status, {
        id: "status",
        header: "Status",
        cell: ({ getValue }) => <OrderStatusBadge status={getValue()} />,
      }),
      col.accessor((row) => row.order.locations.pickup.city, {
        id: "pickup",
        header: "Pickup",
        cell: ({ getValue, row }) => (
          <div className="max-w-[160px]">
            <p className="truncate text-xs font-medium">{getValue()}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.original.order.locations.pickup.fullAddress}
            </p>
          </div>
        ),
      }),
      col.accessor((row) => row.order.locations.delivery.contactName, {
        id: "recipient",
        header: "Recipient",
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="size-3 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{getValue()}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {row.original.order.locations.delivery.city}
              </p>
            </div>
          </div>
        ),
      }),
      col.accessor((row) => row.order.pricing.totalPrice, {
        id: "amount",
        header: () => (
          <button
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => {
              const current = filters.sortBy === "totalPrice" ? filters.sortOrder : "desc";
              onFiltersChange({
                sortBy: "totalPrice",
                sortOrder: current === "desc" ? "asc" : "desc",
                page: 1,
              });
            }}
          >
            Amount
            <ArrowUpDown className="size-3 text-muted-foreground" />
          </button>
        ),
        cell: ({ getValue, row }) =>
          formatCurrency(
            getValue(),
            row.original.order.pricing.currency ?? "INR",
          ),
      }),
      col.accessor((row) => row.order.fulfillment.paymentMode ?? "prepaid", {
        id: "paymentMode",
        header: "Payment",
        cell: ({ getValue }) => (
          <PaymentModeBadge mode={getValue()} />
        ),
      }),
      col.accessor((row) => row.order.timeline.createdAt, {
        id: "createdAt",
        header: () => (
          <button
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => {
              const current = filters.sortBy === "createdAt" ? filters.sortOrder : "desc";
              onFiltersChange({
                sortBy: "createdAt",
                sortOrder: current === "desc" ? "asc" : "desc",
                page: 1,
              });
            }}
          >
            Date
            <ArrowUpDown className="size-3 text-muted-foreground" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(getValue())}
          </span>
        ),
      }),
      col.accessor((row) => row.courier?.name, {
        id: "courier",
        header: "Courier",
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="text-xs">{getValue()}</span>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground"
            >
              Unassigned
            </Badge>
          ),
      }),
    ],
    [filters.sortBy, filters.sortOrder, onFiltersChange],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row.order.identifiers.orderId),
    manualPagination: true,
    manualSorting: true,
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((r) => r.original.order.identifiers.orderId);

  async function handleExport() {
    try {
      await downloadOrdersCsv(filters);
      toast.success("Export downloaded successfully");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  }

  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = filters.page;
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="space-y-3">
      {/* Table toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {pagination ? (
            <>
              {pagination.total.toLocaleString()} order
              {pagination.total !== 1 ? "s" : ""}
            </>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleExport}
          disabled={isLoading || data.length === 0}
        >
          <Download className="size-3.5" />
          Export page
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-outline-variant/20 hover:bg-transparent"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-outline-variant/10">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="py-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex size-20 items-center justify-center rounded-full bg-surface-container-low shadow-sm">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent" />
                      <Package className="relative size-10 text-primary/60" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold tracking-tight text-foreground">
                        No orders found
                      </p>
                      <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto">
                        We could not find any orders matching your current criteria. Try adjusting your filters or date range.
                      </p>
                    </div>
                    {hasActiveFilters(filters) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          onFiltersChange({
                            status: "all",
                            search: "",
                            dateFrom: "",
                            dateTo: "",
                            deliveryTypeId: "",
                            minPrice: "",
                            maxPrice: "",
                            page: 1,
                          })
                        }
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-outline-variant/10 transition-colors"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage <= 1}
              onClick={() => onFiltersChange({ page: currentPage - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {visiblePages.map((page) => {
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="size-8 text-xs"
                  onClick={() => onFiltersChange({ page })}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage >= totalPages}
              onClick={() => onFiltersChange({ page: currentPage + 1 })}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-3 shadow-[var(--shadow-ambient-md)]">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => setRowSelection({})}
          >
            Deselect all
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => onBulkCancel(selectedIds)}
          >
            <Trash2 className="size-3.5" />
            Cancel {selectedIds.length} order
            {selectedIds.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
