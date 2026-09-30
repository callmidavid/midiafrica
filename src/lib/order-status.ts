// Order status vocabulary — shared by storefront + admin.
// Payment states are set ONLY by the Bachs webhook. Admins control fulfilment.
export const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
export const FULFILMENT_STATUSES = ["processing", "in_transit", "delivered", "cancelled", "refunded"] as const;

export type OrderStatusValue =
  | (typeof PAYMENT_STATUSES)[number]
  | (typeof FULFILMENT_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  processing: "Processing",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const STATUS_CONTROL: Record<string, "automatic" | "admin"> = {
  pending: "automatic",
  paid: "automatic",
  failed: "automatic",
  processing: "admin",
  in_transit: "admin",
  delivered: "admin",
  cancelled: "admin",
  refunded: "admin",
};

// Progress tracker order (linear happy path)
export const TRACKER_STEPS = ["pending", "paid", "processing", "in_transit", "delivered"] as const;
export const TRACKER_LABELS = ["Awaiting payment", "Paid", "Processing", "In transit", "Delivered"] as const;

export const REVENUE_STATUSES = ["paid", "processing", "in_transit", "delivered"];

export function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s;
}
