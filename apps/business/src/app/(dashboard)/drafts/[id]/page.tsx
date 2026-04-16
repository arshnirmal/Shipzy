import { DraftEditor } from "@/components/drafts/draft-editor";

type DraftEditorPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function DraftEditorPage({ params }: DraftEditorPageProps) {
  const { id } = await params;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Draft Editor</h1>
        <p className="text-muted-foreground">Complete the missing details to submit this order.</p>
      </div>
      
      <DraftEditor draftId={Number.parseInt(id, 10)} />
    </div>
  );
}
