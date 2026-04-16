"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  Draft,
  DraftCreatePayload,
  DraftListResponse,
  DraftResponse,
  DraftState,
  DraftUpdatePayload,
} from "@/types/business";

// ── List ──────────────────────────────────────────────────────────────────────

export function useDrafts(state?: DraftState, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (state) params.set("state", state);

  return useQuery({
    queryKey: ["drafts", { state, page, limit }],
    queryFn: () =>
      apiRequest<DraftListResponse>(`/business/drafts?${params.toString()}`),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useDraft(id: number | null) {
  return useQuery({
    queryKey: ["drafts", id],
    queryFn: () => apiRequest<DraftResponse>(`/business/drafts/${id}`),
    enabled: id !== null,
    staleTime: 15_000,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DraftCreatePayload) =>
      apiRequest<DraftResponse>("/business/drafts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

// ── Update (PATCH) ────────────────────────────────────────────────────────────

export function useUpdateDraft(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DraftUpdatePayload) =>
      apiRequest<DraftResponse>(`/business/drafts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["drafts", id], data);
      qc.invalidateQueries({ queryKey: ["drafts"], exact: false });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ success: boolean; message: string }>(`/business/drafts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

// ── Submit ────────────────────────────────────────────────────────────────────

export function useSubmitDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ success: boolean; message: string; data: { order: unknown } }>(
        `/business/drafts/${id}/submit`,
        { method: "POST" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getDraftStateLabel(state: DraftState): string {
  return { incomplete: "Incomplete", ready: "Ready", submitted: "Submitted" }[state];
}

export function isDraftEditable(draft: Draft): boolean {
  return !draft.submittedAt;
}
