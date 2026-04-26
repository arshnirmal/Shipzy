"use client";

import { useState } from "react";

import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, PlusCircle, Trash2, Edit2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { DraftStateBadge } from "@/components/drafts/draft-state-badge";
import { useDrafts, useCreateDraft, useDeleteDraft, useSubmitDraft } from "@/hooks/use-drafts";
import type { DraftState } from "@/types/business";
import { useRouter } from "next/navigation";

export default function DraftsPage() {
  const router = useRouter();
  const [filterState, setFilterState] = useState<DraftState | "all">("all");
  
  const { data, isLoading } = useDrafts(filterState === "all" ? undefined : filterState);
  const createDraft = useCreateDraft();
  const deleteDraft = useDeleteDraft();
  const submitDraft = useSubmitDraft();

  const handleCreateDraft = () => {
    createDraft.mutate(
      { name: `New Order (${new Date().toLocaleDateString()})` },
      { onSuccess: (res) => router.push(`/drafts/${res.data.draftId}`) }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this draft?")) {
      deleteDraft.mutate(id, {
        onSuccess: () => toast.success("Draft deleted")
      });
    }
  };

  const handleSubmit = (id: number) => {
    submitDraft.mutate(id, {
      onSuccess: () => {
         toast.success("Draft submitted successfully");
         router.push("/orders");
      },
      onError: (err: any) => toast.error(err.message || "Failed to submit")
    });
  };

  const drafts = data?.data.drafts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Draft Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Continue working on saved deliveries before submission.
          </p>
        </div>
        <Button
          onClick={handleCreateDraft}
          disabled={createDraft.isPending}
          className="gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]"
        >
          {createDraft.isPending ? (
            <div className="mr-2 size-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
          ) : (
            <PlusCircle className="mr-2 size-4" />
          )}
          New Draft
        </Button>
      </div>

      <Tabs 
        value={filterState} 
        onValueChange={(v) => setFilterState(v as DraftState | "all")}
      >
        <TabsList className="h-10 bg-surface-container-low p-1">
          <TabsTrigger value="all" className="rounded-md px-4 text-sm">All Drafts</TabsTrigger>
          <TabsTrigger value="incomplete" className="rounded-md px-4 text-sm">Incomplete</TabsTrigger>
          <TabsTrigger value="ready" className="rounded-md px-4 text-sm">Ready to Submit</TabsTrigger>
          <TabsTrigger value="submitted" className="rounded-md px-4 text-sm">Submitted</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-muted/50" />)}
        </div>
      ) : null}
      
      {!isLoading && drafts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-highest mb-4">
            <Copy className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No drafts found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {filterState === "all" 
              ? "Start by creating a new draft order."
              : `No drafts currently match the '${filterState}' state.`}
          </p>
          <Button onClick={handleCreateDraft} variant="outline" className="mt-4">
             Create your first draft
          </Button>
        </div>
      ) : null}
      
      {!isLoading && drafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drafts.map((draft) => (
            <Card key={draft.draftId} className="group relative overflow-hidden transition-all hover:shadow-[var(--shadow-ambient-sm)]">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <DraftStateBadge state={draft.state} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    ID #{draft.draftId}
                  </span>
                </div>
                
                <h3 className="line-clamp-1 font-semibold text-base mb-1" title={draft.name || "Untitled Draft"}>
                  {draft.name || "Untitled Draft"}
                </h3>
                
                <div className="space-y-1.5 mt-4 text-sm text-muted-foreground">
                  <p className="line-clamp-1 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-[8px] font-bold">P</span>
                    {draft.pickupLocation?.fullAddress || <span className="italic opacity-60">No pickup set</span>}
                  </p>
                  <p className="line-clamp-1 flex items-center gap-2">
                     <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-500 text-[8px] font-bold">D</span>
                    {draft.deliveryLocation?.fullAddress || <span className="italic opacity-60">No delivery set</span>}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                   <p className="text-[11px] text-muted-foreground">
                     Updated • {format(new Date(draft.updatedAt), "MMM d, p")}
                   </p>
                   
                   <div className="flex gap-1.5">
                     {!draft.submittedAt && (
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="size-7"
                         onClick={(e) => { e.preventDefault(); router.push(`/drafts/${draft.draftId}`); }}
                         title="Edit"
                       >
                         <Edit2 className="size-3" />
                       </Button>
                     )}
                     
                     {!draft.submittedAt && draft.state === "ready" && (
                       <Button 
                         variant="secondary" 
                         size="icon" 
                         className="size-7 text-primary hover:bg-primary hover:text-primary-foreground"
                         onClick={(e) => { e.preventDefault(); handleSubmit(draft.draftId); }}
                         disabled={submitDraft.isPending}
                         title="Submit Order"
                       >
                         <Play className="size-3" />
                       </Button>
                     )}

                     {!draft.submittedAt && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.preventDefault(); handleDelete(draft.draftId); }}
                          disabled={deleteDraft.isPending}
                          title="Delete"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
