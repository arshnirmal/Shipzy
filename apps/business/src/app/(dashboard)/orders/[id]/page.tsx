import { OrderDetailView } from "@/components/orders/order-detail-view";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderDetailView id={id} />;
}
