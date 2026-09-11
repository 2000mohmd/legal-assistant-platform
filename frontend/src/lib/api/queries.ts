"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { PracticeArea } from "@/types/practice-area";
import type { ReviewItem } from "@/types/review";

export function usePracticeAreas() {
  return useQuery({
    queryKey: ["practice-areas"],
    queryFn: () => apiClient.get<{ practiceAreas: PracticeArea[] }>("/api/practice-areas"),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ["review-queue"],
    queryFn: () => apiClient.get<{ items: ReviewItem[] }>("/api/review/queue"),
  });
}

export function useReviewItem(id: string) {
  return useQuery({
    queryKey: ["review-item", id],
    queryFn: () => apiClient.get<{ item: ReviewItem }>(`/api/review/${id}`),
    enabled: Boolean(id),
  });
}

export function useReviewAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      action: "approved" | "edited_approve" | "rejected";
      reviewer: string;
      editedDraft?: string;
    }) => apiClient.post<{ item: ReviewItem }>(`/api/review/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-item", id] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });
}
