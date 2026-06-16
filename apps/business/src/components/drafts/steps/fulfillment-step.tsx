import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { CreateOrderData, DraftFulfillment } from "@/types/business";
import { Truck } from "lucide-react";

type FulfillmentStepProps = {
  readonly data: CreateOrderData;
  readonly value: DraftFulfillment;
  readonly onChange: (v: DraftFulfillment) => void;
};

export function FulfillmentStep({ data, value, onChange }: FulfillmentStepProps) {
  const { 
    deliveryTypes = [], 
    vehicleCategories = [], 
    paymentMethods = [] 
  } = data || {};

  const updateField = (field: keyof DraftFulfillment, newVal: number) => {
    onChange({ ...value, [field]: newVal });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Delivery Type */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Delivery Speed</h3>
          <p className="text-sm text-muted-foreground">How fast does this need to get there?</p>
        </div>
        <RadioGroup 
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          value={value.deliveryTypeId.toString()}
          onValueChange={(v) => updateField("deliveryTypeId", Number.parseInt(v, 10))}
        >
          {deliveryTypes.filter(t => t.isActive).map(dt => (
            <div key={dt.deliveryTypeId} className="relative">
              <RadioGroupItem
                value={dt.deliveryTypeId.toString()}
                id={`dt-${dt.deliveryTypeId}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`dt-${dt.deliveryTypeId}`}
                className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <span className="font-semibold">{dt.displayName}</span>
                <span className="mt-1 text-xs text-muted-foreground">{dt.description || `₹${dt.baseRate} base rate`}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Vehicle Category */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Vehicle Category</h3>
          <p className="text-sm text-muted-foreground">Select the right vehicle for your package size.</p>
        </div>
        <RadioGroup 
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
          value={value.vehicleCategoryId.toString()}
          onValueChange={(v) => updateField("vehicleCategoryId", Number.parseInt(v, 10))}
        >
          {vehicleCategories.map(vc => (
            <div key={vc.categoryId} className="relative">
              <RadioGroupItem
                value={vc.categoryId.toString()}
                id={`vc-${vc.categoryId}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`vc-${vc.categoryId}`}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 text-center hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <Truck className="size-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                <span className="text-sm font-medium">{vc.displayName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Up to {vc.maxWeightKg}kg</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Payment Method */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-lg font-medium">Payment Method</h3>
        </div>
        <div className="w-full max-w-sm">
          <Select 
            value={value.paymentMethodId.toString()} 
            onValueChange={v => updateField("paymentMethodId", Number.parseInt(v as string, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.filter(pm => pm.isActive).map(pm => (
                <SelectItem key={pm.methodId} value={pm.methodId.toString()}>
                  {pm.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
