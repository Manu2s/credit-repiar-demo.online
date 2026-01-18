import { storage } from "./storage";
import { constructStripeEvent } from "./stripeClient";

/**
 * Minimal Stripe webhook handler for Hostinger/VPS deployments.
 *
 * We verify the signature using STRIPE_WEBHOOK_SECRET and then update
 * our internal records using metadata set on PaymentIntents.
 */
export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "This usually means express.json() parsed the body before reaching this handler."
      );
    }

    const event = constructStripeEvent(payload, signature);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as any;
      const meta = pi.metadata || {};
      const userId = meta.userId as string | undefined;
      const planId = meta.planId ? Number(meta.planId) : undefined;
      const paymentId = meta.paymentId ? Number(meta.paymentId) : undefined;

      if (userId) {
        if (paymentId) {
          await storage.updateScheduledPayment(paymentId, userId, {
            status: "completed",
            paidAt: new Date(),
          });
        }
        if (planId) {
          await storage.createTransaction(userId, {
            planId,
            type: "payment",
            amount: pi.amount,
            externalId: pi.id,
            status: "completed",
            description: paymentId
              ? `Payment for scheduled payment #${paymentId}`
              : "Credit plan payment",
          });
        }
      }
      return;
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as any;
      const meta = pi.metadata || {};
      const userId = meta.userId as string | undefined;
      const paymentId = meta.paymentId ? Number(meta.paymentId) : undefined;
      if (userId && paymentId) {
        await storage.updateScheduledPayment(paymentId, userId, {
          status: "failed",
        });
      }
      return;
    }
  }
}
