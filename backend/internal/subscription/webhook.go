package subscription

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

// WebhookHandler handles Stripe webhook events
type WebhookHandler struct {
	endpointSecret string
	service        *Service
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(endpointSecret string, service *Service) *WebhookHandler {
	return &WebhookHandler{
		endpointSecret: endpointSecret,
		service:        service,
	}
}

// HandleWebhook processes incoming Stripe webhooks
func (h *WebhookHandler) HandleWebhook(payload []byte, signature string) error {
	event, err := webhook.ConstructEvent(payload, signature, h.endpointSecret)
	if err != nil {
		return fmt.Errorf("webhook signature verification failed: %w", err)
	}

	ctx := context.Background()

	switch event.Type {
	case "checkout.session.completed":
		return h.handleCheckoutCompleted(ctx, event)

	case "customer.subscription.created":
		return h.handleSubscriptionCreated(ctx, event)

	case "customer.subscription.updated":
		return h.handleSubscriptionUpdated(ctx, event)

	case "customer.subscription.deleted":
		return h.handleSubscriptionDeleted(ctx, event)

	case "invoice.paid":
		return h.handleInvoicePaid(ctx, event)

	case "invoice.payment_failed":
		return h.handlePaymentFailed(ctx, event)

	default:
		// Ignore other events
		return nil
	}
}

func (h *WebhookHandler) handleCheckoutCompleted(ctx context.Context, event stripe.Event) error {
	var session stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		return err
	}

	userID := session.Metadata["user_id"]
	planID := session.Metadata["plan_id"]
	billingPeriod := session.Metadata["billing_period"]

	// Calculate renewal date based on billing period
	var renewalDate time.Time
	switch billingPeriod {
	case "daily":
		renewalDate = time.Now().AddDate(0, 0, 1)
	case "monthly":
		renewalDate = time.Now().AddDate(0, 1, 0)
	case "yearly":
		renewalDate = time.Now().AddDate(1, 0, 0)
	default:
		renewalDate = time.Now().AddDate(0, 1, 0)
	}

	sub := &Subscription{
		ID:                   uuid.New().String(),
		UserID:               userID,
		PlanID:               planID,
		Status:               "active",
		StripeCustomerID:     session.Customer.ID,
		StripeSubscriptionID: session.Subscription.ID,
		BillingPeriod:        billingPeriod,
		StartDate:            time.Now(),
		RenewalDate:          renewalDate,
	}

	return h.service.CreateSubscription(ctx, sub)
}

func (h *WebhookHandler) handleSubscriptionCreated(ctx context.Context, event stripe.Event) error {
	var subscription stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
		return err
	}

	// Subscription is already created via checkout.session.completed
	// This is mainly for subscriptions created directly via the API
	return nil
}

func (h *WebhookHandler) handleSubscriptionUpdated(ctx context.Context, event stripe.Event) error {
	var subscription stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
		return err
	}

	status := string(subscription.Status)
	return h.service.UpdateSubscription(ctx, subscription.ID, status)
}

func (h *WebhookHandler) handleSubscriptionDeleted(ctx context.Context, event stripe.Event) error {
	var subscription stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
		return err
	}

	return h.service.UpdateSubscription(ctx, subscription.ID, "cancelled")
}

func (h *WebhookHandler) handleInvoicePaid(ctx context.Context, event stripe.Event) error {
	var invoice stripe.Invoice
	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
		return err
	}

	// Update subscription status to active (in case it was past_due)
	if invoice.Subscription != nil {
		return h.service.UpdateSubscription(ctx, invoice.Subscription.ID, "active")
	}
	return nil
}

func (h *WebhookHandler) handlePaymentFailed(ctx context.Context, event stripe.Event) error {
	var invoice stripe.Invoice
	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
		return err
	}

	// Update subscription status to past_due
	if invoice.Subscription != nil {
		return h.service.UpdateSubscription(ctx, invoice.Subscription.ID, "past_due")
	}
	return nil
}
