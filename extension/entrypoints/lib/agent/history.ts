import type { HistoryStep } from "@/types";

export function parseHistorySteps(historyString: string | null): HistoryStep[] {
  if (!historyString) return [];
  try {
    const parsed = JSON.parse(historyString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatHistorySteps(steps: HistoryStep[]): string {
  return JSON.stringify(steps, null, 2);
}