"use client";

import * as React from "react";
import { MapPin, Search as SearchIcon, Pencil } from "lucide-react";
import { useAddressSearch } from "@/hooks/use-address-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { ResolvedAddress, AddressSuggestion } from "@/types/business";

type AddressSearchWidgetProps = {
  readonly value?: ResolvedAddress | null;
  readonly onChange: (value: ResolvedAddress | null) => void;
  readonly label: string;
};

export function AddressSearchWidget({ value, onChange, label }: AddressSearchWidgetProps) {
  const { searchDebounced, retrieve } = useAddressSearch();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditingSearch, setIsEditingSearch] = React.useState(!value);

  // Detail fields (when a location is selected)
  const [building, setBuilding] = React.useState(value?.building ?? "");
  const [floor, setFloor] = React.useState(value?.floor ?? "");
  const [flatNumber, setFlatNumber] = React.useState(value?.flatNumber ?? "");
  const [contactName, setContactName] = React.useState(value?.contactName ?? "");
  const [contactPhone, setContactPhone] = React.useState(value?.contactPhone ?? "");
  const [howToReach, setHowToReach] = React.useState(value?.howToReach ?? "");

  // Update detail fields when `value` prop changes externally
  React.useEffect(() => {
    if (value) {
      setIsEditingSearch(false);
      setBuilding(value.building ?? "");
      setFloor(value.floor ?? "");
      setFlatNumber(value.flatNumber ?? "");
      setContactName(value.contactName ?? "");
      setContactPhone(value.contactPhone ?? "");
      setHowToReach(value.howToReach ?? "");
    }
  }, [value]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setIsLoading(true);
    searchDebounced(
      q,
      (results) => {
        setSuggestions(results);
        setIsLoading(false);
      },
      (err) => {
        console.error("Address search failed", err);
        setIsLoading(false);
      }
    );
  };

  const handleSelectSuggestion = async (sug: AddressSuggestion) => {
    try {
      setIsLoading(true);
      const details = await retrieve(sug.mapboxId);

      // Extract context
      let city = null;
      let state = null;
      let postalCode = null;

      if (details.context) {
        city = details.context["locality"] ?? details.context["place"] ?? null;
        state = details.context["region"] ?? null;
        postalCode = details.context["postcode"] ?? null;
      }

      // Hacky fallback for postal code if not in context
      if (!postalCode) {
        const mc = details.fullAddress.match(/\b\d{6}\b/);
        if (mc) postalCode = mc[0];
      }

      onChange({
        // Preserve contact info if they already typed it before re-searching
        contactName,
        contactPhone,
        building,
        floor,
        flatNumber,
        howToReach,
        fullAddress: details.fullAddress,
        latitude: details.coordinates?.latitude ?? 0,
        longitude: details.coordinates?.longitude ?? 0,
        city,
        state,
        postalCode,
      });

      setIsEditingSearch(false);
      setQuery("");
      setSuggestions([]);
    } catch (err) {
      console.error("Failed to retrieve place details", err);
    } finally {
      setIsLoading(false);
    }
  };


  // Sync internal local state changes (building, contact, etc.) upwards to the draft object
  // Debounce slightly to avoid aggressive re-renders
  React.useEffect(() => {
    if (!value) return;
    
    // Only trigger if something actually changed from `value`
    if (
      value.building !== building ||
      value.floor !== floor ||
      value.flatNumber !== flatNumber ||
      value.contactName !== contactName ||
      value.contactPhone !== contactPhone ||
      value.howToReach !== howToReach
    ) {
      const handler = setTimeout(() => {
        onChange({
          ...value,
          building,
          floor,
          flatNumber,
          contactName,
          contactPhone,
          howToReach,
        });
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [building, floor, flatNumber, contactName, contactPhone, howToReach, value, onChange]);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
      </div>

      {isEditingSearch ? (
        <div className="space-y-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for building, locality, or street..."
              value={query}
              onChange={handleQueryChange}
              className="pl-9"
            />
          </div>
          
          {suggestions.length > 0 && (
            <Card className="max-h-60 overflow-y-auto">
              <ul className="divide-y divide-border">
                {suggestions.map((sug) => (
                  <li key={sug.mapboxId}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{sug.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{sug.fullAddress}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {isLoading && query.length > 0 && suggestions.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Searching...</p>
          )}
        </div>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Selected Location</p>
                <p className="text-sm text-foreground/80 mt-1">{value?.fullAddress}</p>
                {(value?.latitude && value?.longitude) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEditingSearch(true)} title="Edit Location">
              <Pencil className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail Fields (Always show if we have a location, optional to fill) */}
      {value && !isEditingSearch && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label>Contact Name <span className="text-destructive">*</span></Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone <span className="text-destructive">*</span></Label>
              <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Building / Block</Label>
              <Input value={building} onChange={(e) => setBuilding(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Flat / Unit No.</Label>
              <Input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>How to reach (Optional route instructions)</Label>
            <Textarea 
              value={howToReach} 
              onChange={(e) => setHowToReach(e.target.value)} 
              rows={2} 
              className="resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
