from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import HTMLResponse
import stripe
import json
from datetime import datetime, timezone
from app.database import STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET
from app.common.models import StripeRequest

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter()


@router.get("/stripe/status")
async def get_stripe_status(email: str, request: Request):
    premium_col = request.app.state.premium_col
    premium_doc = premium_col.find_one({"email": email}, {"_id": 0})

    if not premium_doc:
        return {"active": False, "status": None}

    current_period_end = premium_doc.get("subscription_current_period_end")
    
    if current_period_end and hasattr(current_period_end, 'timestamp'):
        current_period_end_ts = str(int(current_period_end.timestamp()))
    else:
        current_period_end_ts = None
    
    return {
        "active": premium_doc.get("subscription_status"),
        "status": premium_doc.get("subscription_status"),
        "current_period_end": current_period_end_ts,
    }


@router.post("/stripe/checkout")
async def create_stripe_checkout_session(stripe_req: StripeRequest, request: Request):
    if not STRIPE_PRICE_ID:
        raise HTTPException(status_code=500, detail="Stripe product price is not configured.")

    users_col = request.app.state.users_col
    premium_col = request.app.state.premium_col
    user_doc = users_col.find_one({"email": stripe_req.email})

    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    premium_doc = premium_col.find_one({"email": stripe_req.email})
    customer_id: str | None = None

    if premium_doc and premium_doc.get("stripe_customer_id"):
        customer_id = premium_doc["stripe_customer_id"]
    else:
        customer = stripe.Customer.create(email=stripe_req.email)
        customer_id = customer["id"]
        premium_col.update_one(
            {"email": stripe_req.email},
            {"$set": {"stripe_customer_id": customer_id}},
            upsert=True,
        )

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
            mode="subscription",
            success_url=stripe_req.success_url,
            cancel_url=stripe_req.cancel_url,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"checkout_url": session.url}


@router.get("/stripe/success", response_class=HTMLResponse)
async def payment_success():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful - Opero Labs</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
            }
            .container {
                text-align: center;
                background: white;
                padding: 48px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 500px;
            }
            .success-icon {
                font-size: 72px;
                color: #10b981;
                margin-bottom: 24px;
            }
            h1 {
                color: #1f2937;
                margin-bottom: 16px;
                font-size: 32px;
            }
            p {
                color: #6b7280;
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 32px;
            }
            .close-button {
                background: linear-gradient(to right, #9333ea, #3b82f6);
                color: white;
                border: none;
                padding: 12px 32px;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: opacity 0.2s;
            }
            .close-button:hover {
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Welcome to Opero Labs Premium! Your subscription is now active. You can close this tab and return to the extension to enjoy your premium features.</p>
        </div>
        <script>
            // Notify extension about successful payment
            setTimeout(() => {
                window.close();
            }, 5000);
        </script>
    </body>
    </html>
    """


@router.post("/stripe/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):  # type: ignore
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook payload or signature")
    
    premium_col = request.app.state.premium_col
    users_col = request.app.state.users_col

    if event.type.startswith("customer.subscription"):
        subscription = event.data["object"]
        customer_id = subscription["customer"]
        status = subscription["status"]
        cancel_at_period_end = subscription.get("cancel_at_period_end", False)
        
        if cancel_at_period_end and status == "active":
            status = "canceled"
        
        period_end = None
        if cancel_at_period_end:
            period_end = subscription.get("cancel_at")
        elif subscription.get("items") and subscription["items"].get("data"):
            period_end = subscription["items"]["data"][0].get("current_period_end")

        period_end_datetime = None
        if period_end:
            period_end_datetime = datetime.fromtimestamp(period_end, tz=timezone.utc)
        
        premium_col.update_one(
            {"stripe_customer_id": customer_id},
            {
                "$set": {
                    "subscription_status": status,
                    "subscription_current_period_end": period_end_datetime
                }
            },
            upsert=True,
        )

        premium_flag = 1 if status in ["active", "trialing", "canceled"] else 0
        premium_doc = premium_col.find_one({"stripe_customer_id": customer_id})
        if premium_doc and premium_doc.get("email"):
            users_col.update_one({"email": premium_doc["email"]}, {"$set": {"premium": premium_flag}})

    elif event.type == "invoice.payment_failed":
        customer_id = event.data["object"]["customer"]
        premium_col.update_one(
            {"stripe_customer_id": customer_id},
            {"$set": {"subscription_status": "payment_failed"}},
        )

    return {"received": True}


@router.post("/stripe/cancel")
async def cancel_subscription(request: Request, body: dict):
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    premium_col = request.app.state.premium_col
    premium_doc = premium_col.find_one({"email": email})
    
    if not premium_doc or not premium_doc.get("stripe_customer_id"):
        raise HTTPException(status_code=404, detail="No subscription found")
    
    try:
        subscriptions = stripe.Subscription.list(
            customer=premium_doc["stripe_customer_id"],
            status="active",
            limit=1
        )
        
        if not subscriptions.data:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        subscription = stripe.Subscription.modify(
            subscriptions.data[0].id,
            cancel_at_period_end=True
        )
        
        period_end = subscription.get('cancel_at')
        
        premium_col.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "canceled",
                    "subscription_current_period_end": datetime.fromtimestamp(period_end, tz=timezone.utc) if period_end else None
                }
            }
        )
        
        return {"success": True, "message": "Subscription will be canceled at the end of the billing period"}
        
    except Exception as error_cancelling_subscription:
        raise HTTPException(status_code=500, detail=str(error_cancelling_subscription))


@router.post("/stripe/reactivate")
async def reactivate_subscription(request: Request, body: dict):
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    premium_col = request.app.state.premium_col
    users_col = request.app.state.users_col
    premium_doc = premium_col.find_one({"email": email})
    
    if not premium_doc or not premium_doc.get("stripe_customer_id"):
        raise HTTPException(status_code=404, detail="No subscription found")
    
    try:
        subscriptions = stripe.Subscription.list(
            customer=premium_doc["stripe_customer_id"],
            status="all",
            limit=10
        )
        
        canceled_sub = None
        for sub in subscriptions.data:
            if sub.cancel_at_period_end and sub.status == "active":
                canceled_sub = sub
                break
        
        if not canceled_sub:
            raise HTTPException(status_code=404, detail="No canceled subscription found to reactivate")
        
        subscription = stripe.Subscription.modify(
            canceled_sub.id,
            cancel_at_period_end=False
        )
        
        period_end = None
        if subscription.get('items') and subscription['items'].get('data'):
            period_end = subscription['items']['data'][0].get('current_period_end')
        
        premium_col.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "active",
                    "subscription_current_period_end": datetime.fromtimestamp(period_end, tz=timezone.utc) if period_end else None
                }
            }
        )
        
        users_col.update_one({"email": email}, {"$set": {"premium": 1}})
        
        return {"success": True, "message": "Subscription has been reactivated"}
        
    except Exception as error_reactivating_subscription:
        raise HTTPException(status_code=500, detail=str(error_reactivating_subscription))