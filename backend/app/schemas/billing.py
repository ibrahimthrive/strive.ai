from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class CheckoutSessionRequest(BaseModel):
    tier: Literal["pro", "business"]


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class PortalSessionResponse(BaseModel):
    portal_url: str


class PlanOut(BaseModel):
    tier: Literal["free", "pro", "business"]
    available: bool
    unit_amount: int | None = None
    currency: str | None = None
    interval: str | None = None
    upload_limit_per_day: int | None = None


class SubscriptionOut(BaseModel):
    tier: Literal["free", "pro", "business"]
    status: str
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False


class InvoiceOut(BaseModel):
    id: str
    amount_paid: int
    currency: str
    status: str | None
    created: datetime
    hosted_invoice_url: str | None
    invoice_pdf: str | None


class PaymentMethodOut(BaseModel):
    id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool
