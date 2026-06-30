import stripe
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.billing import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    InvoiceOut,
    PaymentMethodOut,
    PlanOut,
    PortalSessionResponse,
    SubscriptionOut,
)
from app.services import billing_service
from app.services.billing_service import NoActiveSubscriptionError, PlanUnavailableError

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans")
async def get_plans() -> list[PlanOut]:
    try:
        return billing_service.get_plans()
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/checkout-session")
async def create_checkout_session(
    payload: CheckoutSessionRequest, current_user: User = Depends(get_current_user)
) -> CheckoutSessionResponse:
    try:
        checkout_url = billing_service.create_checkout_session(current_user, payload.tier)
    except PlanUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return CheckoutSessionResponse(checkout_url=checkout_url)


@router.post("/portal-session")
async def create_portal_session(current_user: User = Depends(get_current_user)) -> PortalSessionResponse:
    try:
        portal_url = billing_service.create_portal_session(current_user)
    except NoActiveSubscriptionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return PortalSessionResponse(portal_url=portal_url)


@router.get("/subscription")
async def get_subscription(current_user: User = Depends(get_current_user)) -> SubscriptionOut:
    try:
        return billing_service.get_subscription(current_user)
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/invoices")
async def list_invoices(current_user: User = Depends(get_current_user)) -> list[InvoiceOut]:
    try:
        return billing_service.list_invoices(current_user)
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/payment-methods")
async def list_payment_methods(current_user: User = Depends(get_current_user)) -> list[PaymentMethodOut]:
    try:
        return billing_service.list_payment_methods(current_user)
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/cancel-subscription")
async def cancel_subscription(current_user: User = Depends(get_current_user)) -> SubscriptionOut:
    try:
        return billing_service.cancel_subscription(current_user)
    except NoActiveSubscriptionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/resume-subscription")
async def resume_subscription(current_user: User = Depends(get_current_user)) -> SubscriptionOut:
    try:
        return billing_service.resume_subscription(current_user)
    except NoActiveSubscriptionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
