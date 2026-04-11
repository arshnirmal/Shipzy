import { PagePlaceholder } from "@/components/shared/page-placeholder";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title={`Order #${id}`}
      description="Review live order status, courier assignment, and timeline details."
    />
  );
}
