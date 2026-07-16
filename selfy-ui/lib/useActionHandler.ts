import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePopupStore } from "@/app/store/usePopupStore";
import { apiClient } from "@/lib/apiClient";
import type { ChoiceAction } from "@/app/components/ChoicePicker";

// ── Shared action shape (returned by action.available) ────────────────────────
export interface PhaseAction {
  id: string;
  label: string;
  description: string;
  emoji: string;
  theme: string;
  action_type: "static" | "dynamic" | "choice";
  yearly_limit: number;
  outcomes?: Record<string, { label: string; tone: string }>;
}

interface ActionResult {
  title: string;
  body: string;
}

interface UseActionHandlerOptions {
  /** Phase slug — matches the backend route prefix e.g. "self", "school", "exam-prep" */
  phase: string;
  charId: string;
  /** Material Symbols icon shown in the success popup */
  popupIcon?: string;
  /** Extra invalidation query keys beyond ["character", charId] */
  extraInvalidate?: string[][];
  onSuccess?: (data: ActionResult) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useActionHandler({
  phase,
  charId,
  popupIcon = "auto_awesome",
  extraInvalidate = [],
  onSuccess,
}: UseActionHandlerOptions) {
  const showPopup   = usePopupStore((s) => s.showPopup);
  const queryClient = useQueryClient();

  // Which choice action is currently waiting for the user to pick an outcome
  const [pendingChoice, setPendingChoice] = useState<ChoiceAction | null>(null);

  // ── Core mutation ─────────────────────────────────────────────────────────
  const mutation = useMutation<ActionResult, Error, { actionId: string; outcome?: string }>({
    mutationFn: async ({ actionId, outcome }) =>
      (
        await apiClient.get(`/${phase}/${charId}/action`, {
          params: {
            action_name: actionId,
            ...(outcome ? { outcome } : {}),
          },
        })
      ).data,

    onSuccess: (data) => {
      showPopup(data.body, data.title, popupIcon);
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      for (const key of extraInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      onSuccess?.(data);
    },

    onError: (err: any) => {
      showPopup(
        err?.response?.data?.detail ?? "Something went wrong.",
        "Oops!",
        "error"
      );
    },
  });

  // ── Dispatch — routes by action type ─────────────────────────────────────
  function handleAction(action: PhaseAction) {
    if (action.action_type === "choice") {
      // Choice: show picker first, resolve after user picks
      setPendingChoice({
        id:          action.id,
        label:       action.label,
        emoji:       action.emoji,
        theme:       action.theme,
        description: action.description,
        outcomes:    action.outcomes ?? {},
      });
      return;
    }

    // Static + Dynamic: resolve immediately, no picker needed
    mutation.mutate({ actionId: action.id });
  }

  function pickOutcome(outcomeKey: string) {
    if (!pendingChoice) return;
    const actionId = pendingChoice.id;
    mutation.mutate({ actionId, outcome: outcomeKey }); // fire immediately
    setTimeout(() => setPendingChoice(null), 350);       // close after feedback is visible
  }

  function dismissChoice() {
    setPendingChoice(null);
  }

  return {
    handleAction,
    pickOutcome,
    dismissChoice,
    pendingChoice,
    isPending: mutation.isPending,
  };
}
