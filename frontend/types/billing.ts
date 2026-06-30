export type PlanTier = "free" | "pro" | "business";

export interface PlanOut {
  tier: PlanTier;
  available: boolean;
  unit_amount: number | null;
  currency: string | null;
  interval: string | null;
}

export interface SubscriptionOut {
  tier: PlanTier;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface InvoiceOut {
  id: string;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export interface PaymentMethodOut {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}
