import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { DraftPackage, DraftItem } from "@/types/business";

type PackageStepProps = {
  readonly pkg: DraftPackage;
  readonly onPkgChange: (v: DraftPackage) => void;
  readonly items: DraftItem[];
  readonly onItemsChange: (v: DraftItem[]) => void;
};

export function PackageStep({ pkg, onPkgChange, items, onItemsChange }: PackageStepProps) {
  const addItem = () => {
    onItemsChange([...items, { name: "", quantity: 1, value: null }]);
  };

  const updateItem = (index: number, field: keyof DraftItem, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const updatePkg = (field: keyof DraftPackage, val: any) => {
    onPkgChange({ ...pkg, [field]: val });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Items to Deliver</h3>
            <p className="text-sm text-muted-foreground">List what's inside the package.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 size-4" /> Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No items added yet. Click 'Add Item' to start.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={`item-${idx}`} className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Item Name</Label>
                  <Input 
                    placeholder="e.g. Blue T-Shirt" 
                    value={item.name} 
                    onChange={e => updateItem(idx, "name", e.target.value)} 
                    required
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={e => updateItem(idx, "quantity", Number.parseInt(e.target.value, 10) || 1)} 
                    required
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs text-muted-foreground">Value (₹)</Label>
                  <Input 
                    type="number" 
                    placeholder="Optional"
                    value={item.value ?? ""} 
                    onChange={e => updateItem(idx, "value", e.target.value ? Number.parseFloat(e.target.value) : null)} 
                  />
                </div>
                <div className="pt-6">
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(idx)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package Options */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium">Package Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Package Description</Label>
            <Input 
              placeholder="e.g. Medium Brown Box" 
              value={pkg.description ?? ""}
              onChange={e => updatePkg("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Special Instructions for Courier</Label>
            <Textarea 
              placeholder="e.g. Needs to be kept upright, fragile item." 
              value={pkg.specialInstructions ?? ""}
              onChange={e => updatePkg("specialInstructions", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Label>Total Declared Value (₹)</Label>
              <Input 
                type="number" 
                placeholder="For insurance purposes"
                value={pkg.declaredValue ?? ""}
                onChange={e => updatePkg("declaredValue", e.target.value ? Number.parseFloat(e.target.value) : null)}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Send tracking links to recipient</p>
              </div>
              <Switch 
                checked={pkg.notifyRecipientSms ?? false} 
                onCheckedChange={v => updatePkg("notifyRecipientSms", v)} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
