import { TemplateEditor } from "@/components/templates/template-editor";

export const metadata = {
  title: "New Template - Shipzy",
  description: "Create a new order template",
};

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Template</h1>
        <p className="text-muted-foreground mt-0.5">Set up default details for orders you place frequently.</p>
      </div>
      <TemplateEditor mode="create" />
    </div>
  );
}
