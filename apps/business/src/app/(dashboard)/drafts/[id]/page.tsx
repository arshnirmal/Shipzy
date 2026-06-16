import { DraftEditor } from "@/components/drafts/draft-editor";

type DraftEditorPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function DraftEditorPage({ params }: DraftEditorPageProps) {
  const { id } = await params;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Draft</h1>
        <p className="text-muted-foreground">
          Continue editing this saved draft. Use <span className="font-medium">Save Draft</span> to persist
          changes, or <span className="font-medium">Submit Order</span> on the Review step to convert it to a live order.
        </p>
      </div>
      
      <DraftEditor draftId={Number.parseInt(id, 10)} />
    </div>
  );
}
