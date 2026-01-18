import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-07-30.basil",
    });
  }
  return stripe;
}

export function getStripePublishableKey(): string {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!pk) {
    throw new Error("Missing STRIPE_PUBLISHABLE_KEY");
  }
  return pk;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

export function constructStripeEvent(payload: Buffer, signature: string): Stripe.Event {
  const s = getStripeWebhookSecret();
  const client = getStripeClient();
  return client.webhooks.constructEvent(payload, signature, s);
}
