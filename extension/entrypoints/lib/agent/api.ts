import type { PageDom, AgentResult } from "@/types";
import { API_BASE } from "@/lib/config";

export async function fetchAgentAction(
  domTree: PageDom,
  prompt: string,
  history: string | null,
  screenshot: string | null,
  agentMode?: string,
  jobApplicationData?: any,
  email?: string,
): Promise<AgentResult> {
  const response = await fetch(`${API_BASE}/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dom: domTree, prompt, history, screenshot, agentMode, jobApplicationData, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to run agent");
  }

  return await response.json();
}

export async function fetchAgentStatus(email: string): Promise<{ agent_runs: number; is_premium: boolean; runs_remaining: number | string }> {
  const response = await fetch(`${API_BASE}/agent/status?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch agent status");
  }

  return await response.json();
}
