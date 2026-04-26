"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { OrderFilters } from "@/types/orders";
import { DEFAULT_FILTERS } from "@/types/orders";

type OrdersFiltersProps = {
  filters: OrderFilters;
  onChange: (patch: Partial<OrderFilters>) => void;
};

const DELIVERY_TYPES = [
  { id: "1", label: "Standard" },
  { id: "2", label: "Express" },
  { id: "3", label: "Same-Day" },
];

function hasAdvancedFilters(f: OrderFilters): boolean {
  return !!(f.dateFrom || f.dateTo || f.deliveryTypeId || f.minPrice || f.maxPrice);
}

export function OrdersFilters({ filters, onChange }: OrdersFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(
    () => hasAdvancedFilters(filters),
  );

  function clearAll() {
    onChange({
      search: "",
      dateFrom: "",
      dateTo: "",
      deliveryTypeId: "",
      minPrice: "",
      maxPrice: "",
      page: 1,
    });
    setShowAdvanced(false);
  }

  const isDirty =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.deliveryTypeId ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="space-y-3">
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order #, recipient, address…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="h-9 pl-9 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: "", page: 1 })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-sm"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {hasAdvancedFilters(filters) && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              !
            </span>
          )}
        </Button>

        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-sm text-muted-foreground"
            onClick={clearAll}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChange({ dateFrom: e.target.value, page: 1 })}
                className="h-9 w-36 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChange({ dateTo: e.target.value, page: 1 })}
                className="h-9 w-36 text-sm"
              />
            </div>

            <Separator orientation="vertical" className="mx-1 h-8" />

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Delivery type
              </label>
              <Select
                value={filters.deliveryTypeId || "all"}
                onValueChange={(v) =>
                  onChange({ deliveryTypeId: !v || v === "all" ? "" : v, page: 1 })
                }
              >
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {DELIVERY_TYPES.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="mx-1 h-8" />

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Min amount (₹)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => onChange({ minPrice: e.target.value, page: 1 })}
                className="h-9 w-28 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Max amount (₹)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="∞"
                value={filters.maxPrice}
                onChange={(e) => onChange({ maxPrice: e.target.value, page: 1 })}
                className="h-9 w-28 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
