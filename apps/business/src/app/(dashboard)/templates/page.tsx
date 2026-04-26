"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Search, Trash2, Edit2, Play, LayoutTemplate, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateFormDialog } from "@/components/templates/template-form-dialog";
import { 
  useTemplates, 
  useDeleteTemplate, 
  useCreateDraftFromTemplate 
} from "@/hooks/use-templates";
import type { Template } from "@/types/business";

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const { data, isLoading } = useTemplates(true); // active only
  const deleteTemplate = useDeleteTemplate();
  const createDraft = useCreateDraftFromTemplate();

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate(id, {
        onSuccess: () => toast.success("Template deleted")
      });
    }
  };

  const handleUseTemplate = (id: number) => {
    createDraft.mutate(id, {
      onSuccess: (res) => {
        toast.success("Draft created from template");
        router.push(`/drafts/${res.data.draftId}`);
      },
      onError: (err: any) => toast.error(err.message || "Failed to create draft")
    });
  };

  const templates = data?.data.templates ?? [];
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Save frequent delivery details to quickly create new orders.
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]"
        >
          <PlusCircle className="mr-2 size-4" />
          New Template
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
           {[1,2,3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/50" />)}
        </div>
      ) : null}
      
      {!isLoading && templates.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-highest mb-4">
            <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No templates yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create a template to speed up your recurring deliveries.
          </p>
          <Button onClick={handleCreateNew} variant="outline" className="mt-4">
            Create First Template
          </Button>
        </div>
      ) : null}
      
      {!isLoading && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 border-t pt-4">
          {filteredTemplates.map(template => (
            <Card key={template.templateId} className="group flex flex-col justify-between transition-all hover:shadow-md">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-surface-container font-medium">
                    Used {template.useCount} times
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      render={<Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(template.templateId)}>
                         <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-base" title={template.name}>
                  {template.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-10 flex-1">
                  {template.description || "No description provided."}
                </p>

                <div className="mt-4 pt-4 border-t w-full flex items-center justify-between">
                   <p className="text-[11px] text-muted-foreground">
                     Added {format(new Date(template.createdAt), "MMM d, yyyy")}
                   </p>
                   {/* Create from template action */}
                   <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template.templateId)}
                      disabled={createDraft.isPending}
                      className="h-8"
                   >
                      <Play className="mr-2 h-3 w-3" />
                      Use
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTemplates.length === 0 && searchQuery && (
             <div className="col-span-full py-12 text-center text-muted-foreground">
                No templates match your search.
             </div>
          )}
        </div>
      ) : null}

      <TemplateFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        template={editingTemplate}
      />
    </div>
  );
}
