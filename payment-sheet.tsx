import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planId?: number;
  paymentId?: number;
  onSuccess?: () => void;
}

function CheckoutForm({ 
  amount, 
  planId, 
  paymentId, 
  clientSecret,
  onSuccess, 
  onOpenChange 
}: { 
  amount: number; 
  planId?: number; 
  paymentId?: number; 
  clientSecret: string;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast({ title: submitError.message || "Payment failed", variant: "destructive" });
      setIsProcessing(false);
      setPaymentStatus('failed');
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({ title: error.message || "Payment failed", variant: "destructive" });
        setPaymentStatus('failed');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          await apiRequest("POST", "/api/stripe/confirm-payment", {
            paymentIntentId: paymentIntent.id,
            planId,
            paymentId,
          });

          setPaymentStatus('succeeded');
          toast({ title: "Payment successful!" });
          
          queryClient.invalidateQueries({ queryKey: ["/api/credit-plans"] });
          queryClient.invalidateQueries({ queryKey: ["/api/scheduled-payments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

          setTimeout(() => {
            onSuccess?.();
            onOpenChange(false);
          }, 1500);
        } else if (paymentIntent.status === 'requires_action') {
          toast({ title: "Additional verification required", description: "Please complete the verification process" });
          setPaymentStatus('idle');
        } else {
          toast({ title: `Payment status: ${paymentIntent.status}`, variant: "destructive" });
          setPaymentStatus('failed');
        }
      }
    } catch (err: any) {
      toast({ title: err.message || "Payment failed", variant: "destructive" });
      setPaymentStatus('failed');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {paymentStatus === 'succeeded' ? (
        <div className="flex flex-col items-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-lg font-medium">Payment Successful!</p>
          <p className="text-muted-foreground">{formatCurrency(amount)} paid</p>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="flex flex-col items-center py-8">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-lg font-medium">Payment Failed</p>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPaymentStatus('idle')}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="p-3 bg-muted rounded-md mb-4">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          </div>

          <PaymentElement />

          <Button 
            type="submit" 
            disabled={!stripe || isProcessing} 
            className="w-full"
            data-testid="button-pay"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(amount)}`
            )}
          </Button>
        </>
      )}
    </form>
  );
}

export function PaymentSheet({ open, onOpenChange, amount, planId, paymentId, onSuccess }: PaymentSheetProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: config } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe/config"],
    enabled: open,
  });

  useEffect(() => {
    if (config?.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(config.publishableKey));
    }
  }, [config?.publishableKey]);

  useEffect(() => {
    async function createPaymentIntent() {
      if (!open || !config?.publishableKey || clientSecret) return;
      
      setIsLoading(true);
      try {
        const response = await apiRequest("POST", "/api/stripe/create-payment-intent", {
          amount,
          planId,
          paymentId,
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({ title: "Failed to initialize payment", variant: "destructive" });
        onOpenChange(false);
      }
      setIsLoading(false);
    }

    createPaymentIntent();
  }, [open, config?.publishableKey, amount, planId, paymentId]);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
    }
  }, [open]);

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(221.2, 83.2%, 53.3%)',
        borderRadius: '6px',
      },
    },
  } : undefined;

  const isReady = stripePromise && clientSecret && options;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>
            Complete your credit builder payment securely
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm 
              amount={amount} 
              planId={planId} 
              paymentId={paymentId}
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onOpenChange={onOpenChange}
            />
          </Elements>
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
