"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest, getErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

type UserProfileResponse = {
  success: true;
  message: string;
  data: {
    profile: AuthUser & {
      createdAt?: string;
      updatedAt?: string;
    };
  };
  timestamp: string;
};

type ProfileUpdatePayload = {
  fullName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest<UserProfileResponse>("/users/me"),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) =>
      apiRequest<UserProfileResponse>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["profile"], data);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
