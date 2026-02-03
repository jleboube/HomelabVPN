package subscription

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	stripeSubscription "github.com/stripe/stripe-go/v76/subscription"
)

// Service handles subscription-related operations
type Service struct {
	db              *sql.DB
	stripeSecretKey string
}

// Plan represents a subscription plan
type Plan struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Description   string            `json:"description"`
	Pricing       map[string]int64  `json:"pricing"`
	Features      []string          `json:"features"`
	StripePriceID map[string]string `json:"-"`
}

// Subscription represents a user's subscription
type Subscription struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"userId"`
	PlanID               string    `json:"planId"`
	Status               string    `json:"status"`
	StripeCustomerID     string    `json:"stripeCustomerId,omitempty"`
	StripeSubscriptionID string    `json:"stripeSubscriptionId,omitempty"`
	BillingPeriod        string    `json:"billingPeriod"`
	StartDate            time.Time `json:"startDate"`
	RenewalDate          time.Time `json:"renewalDate"`
	CancelledAt          *time.Time `json:"cancelledAt,omitempty"`
}

var plans = []Plan{
	{
		ID:          "basic",
		Name:        "Basic",
		Description: "Essential privacy protection for individuals",
		Pricing: map[string]int64{
			"daily":   200,   // $2.00
			"monthly": 1000,  // $10.00
			"yearly":  8000,  // $80.00
		},
		Features: []string{
			"WireGuard protocol",
			"No activity logs",
			"AES-256 encryption",
			"Up to 3 devices",
			"US server location",
			"Email support",
		},
		StripePriceID: map[string]string{
			"daily":   "price_basic_daily",
			"monthly": "price_basic_monthly",
			"yearly":  "price_basic_yearly",
		},
	},
	{
		ID:          "pro",
		Name:        "Pro",
		Description: "Maximum flexibility for power users",
		Pricing: map[string]int64{
			"daily":   400,   // $4.00
			"monthly": 1500,  // $15.00
			"yearly":  12000, // $120.00
		},
		Features: []string{
			"Everything in Basic",
			"10+ server locations",
			"Unlimited devices",
			"Auto key rotation",
			"Kill switch",
			"Priority support",
			"Custom DNS",
			"Port forwarding",
		},
		StripePriceID: map[string]string{
			"daily":   "price_pro_daily",
			"monthly": "price_pro_monthly",
			"yearly":  "price_pro_yearly",
		},
	},
}

// NewService creates a new subscription service
func NewService(db *sql.DB, stripeSecretKey string) *Service {
	stripe.Key = stripeSecretKey
	return &Service{
		db:              db,
		stripeSecretKey: stripeSecretKey,
	}
}

// GetPlans returns available subscription plans
func (s *Service) GetPlans() []Plan {
	return plans
}

// GetPlan returns a specific plan by ID
func (s *Service) GetPlan(planID string) *Plan {
	for _, plan := range plans {
		if plan.ID == planID {
			return &plan
		}
	}
	return nil
}

// GetUserSubscription returns the user's active subscription
func (s *Service) GetUserSubscription(ctx context.Context, userID string) (*Subscription, error) {
	var sub Subscription
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id,
		       billing_period, start_date, renewal_date, cancelled_at
		FROM subscriptions
		WHERE user_id = $1 AND status = 'active'
	`, userID).Scan(
		&sub.ID, &sub.UserID, &sub.PlanID, &sub.Status,
		&sub.StripeCustomerID, &sub.StripeSubscriptionID,
		&sub.BillingPeriod, &sub.StartDate, &sub.RenewalDate, &sub.CancelledAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no active subscription found")
	}
	if err != nil {
		return nil, err
	}

	return &sub, nil
}

// CreateCheckoutSession creates a Stripe checkout session
func (s *Service) CreateCheckoutSession(ctx context.Context, userID, email, planID, billingPeriod, frontendURL string) (*stripe.CheckoutSession, error) {
	plan := s.GetPlan(planID)
	if plan == nil {
		return nil, fmt.Errorf("plan not found")
	}

	priceID, ok := plan.StripePriceID[billingPeriod]
	if !ok {
		return nil, fmt.Errorf("invalid billing period")
	}

	// Create Stripe checkout session
	params := &stripe.CheckoutSessionParams{
		CustomerEmail: stripe.String(email),
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(frontendURL + "/dashboard?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(frontendURL + "/pricing"),
		Metadata: map[string]string{
			"user_id":        userID,
			"plan_id":        planID,
			"billing_period": billingPeriod,
		},
	}

	return session.New(params)
}

// CreateSubscription creates a new subscription record
func (s *Service) CreateSubscription(ctx context.Context, sub *Subscription) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id,
		                          stripe_subscription_id, billing_period, start_date, renewal_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (user_id) DO UPDATE SET
		plan_id = $3, status = $4, stripe_subscription_id = $6,
		billing_period = $7, renewal_date = $9, updated_at = NOW()
	`, sub.ID, sub.UserID, sub.PlanID, sub.Status, sub.StripeCustomerID,
		sub.StripeSubscriptionID, sub.BillingPeriod, sub.StartDate, sub.RenewalDate)

	return err
}

// UpdateSubscription updates an existing subscription
func (s *Service) UpdateSubscription(ctx context.Context, stripeSubID string, status string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE subscriptions SET status = $1, updated_at = NOW()
		WHERE stripe_subscription_id = $2
	`, status, stripeSubID)
	return err
}

// CancelSubscription cancels a user's subscription
func (s *Service) CancelSubscription(ctx context.Context, userID string) (map[string]interface{}, error) {
	sub, err := s.GetUserSubscription(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Cancel in Stripe
	params := &stripe.SubscriptionCancelParams{
		InvoiceNow: stripe.Bool(false),
		Prorate:    stripe.Bool(true),
	}

	_, err = stripeSubscription.Cancel(sub.StripeSubscriptionID, params)
	if err != nil {
		return nil, err
	}

	// Update local record
	cancelledAt := time.Now()
	_, err = s.db.ExecContext(ctx, `
		UPDATE subscriptions SET status = 'cancelled', cancelled_at = $1, updated_at = NOW()
		WHERE user_id = $2
	`, cancelledAt, userID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"cancelledAt":   cancelledAt,
		"effectiveDate": sub.RenewalDate,
	}, nil
}
