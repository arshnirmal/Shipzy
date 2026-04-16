"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  DraftResponse,
  Template,
  TemplateCreatePayload,
  TemplateListResponse,
  TemplateResponse,
  TemplateUpdatePayload,
} from "@/types/business";

export function useTemplates(isActive = true, page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    isActive: String(isActive),
  });
  return useQuery({
    queryKey: ["templates", { isActive, page, limit }],
    queryFn: () =>
      apiRequest<TemplateListResponse>(`/business/templates?${params.toString()}`),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useTemplate(id: number | null) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: () => apiRequest<TemplateResponse>(`/business/templates/${id}`),
    enabled: id !== null,
    staleTime: 30_000,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplateCreatePayload) =>
      apiRequest<TemplateResponse>("/business/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TemplateUpdatePayload }) =>
      apiRequest<TemplateResponse>(`/business/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["templates", id] });
      qc.invalidateQueries({ queryKey: ["templates"], exact: false });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ success: boolean; message: string }>(`/business/templates/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useCreateDraftFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) =>
      apiRequest<DraftResponse>(`/business/templates/${templateId}/draft`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}
