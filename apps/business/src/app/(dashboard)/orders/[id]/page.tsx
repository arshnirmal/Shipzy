import { Suspense } from "react";
import { OrderDetailView, OrderDetailSkeleton } from "@/components/orders/order-detail-view";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  
  return (
    <ErrorBoundary resetKey={id}>
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailView id={id} />
      </Suspense>
    </ErrorBoundary>
  );
}
