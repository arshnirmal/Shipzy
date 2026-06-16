import { NewOrderWizard } from "@/components/orders/new-order-wizard";

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Order</h1>
        <p className="text-muted-foreground">
          Fill in the delivery details and place your order directly. You can also{" "}
          <span className="font-medium">Save as Draft</span> at any point to continue later.
        </p>
      </div>

      <NewOrderWizard />
    </div>
  );
}
