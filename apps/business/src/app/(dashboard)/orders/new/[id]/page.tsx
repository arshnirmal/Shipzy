import { DraftEditor } from "@/components/drafts/draft-editor";

type NewOrderEditorPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function NewOrderEditorPage({ params }: NewOrderEditorPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Order</h1>
        <p className="text-muted-foreground">Complete the delivery details before submitting your order.</p>
      </div>

      <DraftEditor draftId={Number.parseInt(id, 10)} />
    </div>
  );
}
