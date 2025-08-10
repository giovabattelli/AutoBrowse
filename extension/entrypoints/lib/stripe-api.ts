import type { StripeStatusResponse, StripeCheckoutResponse } from "@/types";
import { API_BASE } from "@/lib/config";

export async function checkStripeStatus(email: string): Promise<StripeStatusResponse> {
  const response = await fetch(
    `${API_BASE}/stripe/status?email=${encodeURIComponent(email)}`
  );
  if (!response.ok) {
    throw new Error("Failed to check premium status");
  }
  return response.json();
}

export async function createStripeCheckout(
  email: string,
  successUrl: string,
  cancelUrl: string
): Promise<StripeCheckoutResponse> {
  const response = await fetch(`${API_BASE}/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  return response.json();
}

export async function cancelSubscription(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/stripe/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to cancel subscription");
  }

  return response.json();
}

export async function reactivateSubscription(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/stripe/reactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to reactivate subscription");
  }

  return response.json();
}