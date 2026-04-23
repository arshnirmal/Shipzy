"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  type SavedAddress,
  type CreateAddressPayload,
} from "@/hooks/use-addresses";
import { useAddressSearch } from "@/hooks/use-address-search";

const ADDRESS_TYPES = [
  { value: "home", label: "Home" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "other", label: "Other" },
] as const;

function AddAddressDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { mapboxId: string; name: string; fullAddress: string }[]
  >([]);
  const [selected, setSelected] = useState<{
    fullAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null>(null);

  const [label, setLabel] = useState("");
  const [addressType, setAddressType] = useState<string>("office");

  const { searchDebounced, retrieve } = useAddressSearch();
  const createAddress = useCreateAddress();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!selected) {
      searchDebounced(value, setSuggestions);
    }
  };

  const handleSelectSuggestion = async (mapboxId: string) => {
    try {
      const place = await retrieve(mapboxId);
      setSelected({
        fullAddress: place.fullAddress,
        latitude: place.coordinates?.latitude ?? 0,
        longitude: place.coordinates?.longitude ?? 0,
        city: place.context?.city ?? undefined,
        state: place.context?.state ?? undefined,
        postalCode: place.context?.postalCode ?? undefined,
      });
      setQuery(place.fullAddress);
      setSuggestions([]);
    } catch {
      toast.error("Failed to retrieve address details.");
    }
  };

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select an address from the suggestions.");
      return;
    }
    if (!label.trim()) {
      toast.error("Please provide a label for this address.");
      return;
    }

    const payload: CreateAddressPayload = {
      fullAddress: selected.fullAddress,
      city: selected.city ?? "",
      state: selected.state ?? "",
      postalCode: selected.postalCode ?? "",
      latitude: selected.latitude,
      longitude: selected.longitude,
      addressType,
      label: label.trim(),
      isDefault: false,
    };

    createAddress.mutate(payload, {
      onSuccess: () => {
        toast.success("Address saved successfully.");
        setOpen(false);
        resetForm();
      },
      onError: (err) => toast.error(err.message || "Failed to save address."),
    });
  };

  const resetForm = () => {
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setLabel("");
    setAddressType("office");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger
        render={<Button className="gradient-brand text-primary-foreground" />}
      >
        <PlusCircle className="mr-2 size-4" />
        Add Address
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Saved Address</DialogTitle>
          <DialogDescription>Search for an address to save for quick reuse in orders.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Search Address</Label>
            <Input
              placeholder="Search for an address..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {suggestions.length > 0 && !selected && (
              <div className="max-h-48 overflow-y-auto rounded-md border border-outline-variant/20 bg-surface-container-lowest">
                {suggestions.map((s) => (
                  <button
                    key={s.mapboxId}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                    onClick={() => handleSelectSuggestion(s.mapboxId)}
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{s.fullAddress}</p>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="rounded-md bg-surface-container-low p-3 text-sm">
                <p className="font-medium">{selected.fullAddress}</p>
                <button
                  className="mt-1 text-xs text-primary hover:underline"
                  onClick={() => { setSelected(null); setQuery(""); }}
                >
                  Change address
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g. Main Warehouse"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap gap-2">
                {ADDRESS_TYPES.map((t) => (
                  <Badge
                    key={t.value}
                    variant={addressType === t.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setAddressType(t.value)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAddress.isPending || !selected}
            className="gradient-brand text-primary-foreground"
          >
            {createAddress.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressCard({ address }: { address: SavedAddress }) {
  const deleteAddress = useDeleteAddress();

  const handleDelete = () => {
    if (confirm("Delete this saved address?")) {
      deleteAddress.mutate(address.addressId, {
        onSuccess: () => toast.success("Address deleted."),
        onError: (err) => toast.error(err.message || "Failed to delete address."),
      });
    }
  };

  return (
    <Card className="transition-all hover:shadow-[var(--shadow-ambient-sm)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high">
              <MapPin className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{address.label}</p>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {address.addressType}
                </Badge>
                {address.isDefault && (
                  <Badge variant="default" className="text-[10px]">Default</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {address.fullAddress}
              </p>
              {address.landmark && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Near {address.landmark}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteAddress.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AddressesSection() {
  const { data, isLoading } = useAddresses();
  const addresses = data?.data.addresses ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">Saved Addresses</h3>
          <p className="text-sm text-muted-foreground">
            Manage pickup and delivery addresses for quick order creation.
          </p>
        </div>
        <AddAddressDialog />
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-surface-container-highest mb-4">
              <MapPin className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No saved addresses</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm text-center">
              Save frequently used addresses to speed up order creation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard key={addr.addressId} address={addr} />
          ))}
        </div>
      )}
    </div>
  );
}
