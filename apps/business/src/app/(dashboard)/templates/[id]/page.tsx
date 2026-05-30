import { TemplateEditor } from "@/components/templates/template-editor";

export const metadata = {
  title: "Edit Template - Shipzy",
  description: "Edit your order template",
};

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = parseInt(id, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Template #{templateId}</h1>
        <p className="text-muted-foreground mt-0.5">Update your saved order template.</p>
      </div>
      <TemplateEditor mode="edit" templateId={templateId} />
    </div>
  );
}
