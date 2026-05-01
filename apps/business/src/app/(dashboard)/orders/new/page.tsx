"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateDraft } from "@/hooks/use-drafts";
export default function NewOrderPage() {
  const router = useRouter();
  const createDraft = useCreateDraft();

  useEffect(() => {
    // Attempt to create a blank draft immediately and redirect
    if (!createDraft.isPending && !createDraft.isSuccess) {
      createDraft.mutate(
        { name: `New Order (${new Date().toLocaleDateString()})` },
        {
          onSuccess: (res) => {
            router.replace(`/orders/new/${res.data.draftId}`);
          },
        }
      );
    }
  }, [createDraft, router]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="size-8 animate-spin rounded-full border-4 border-primary/30 border-r-primary" />
      <p className="text-muted-foreground animate-pulse">Initializing editor...</p>
    </div>
  );
}
