import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, Calendar, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { PaymentSheet } from "@/components/payment-sheet";
import type { CreditPlan, ScheduledPayment } from "@shared/schema";

const createPlanSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  totalAmount: z.coerce.number().min(100, "Minimum $1.00"),
  termMonths: z.coerce.number().min(1).max(60, "Term must be 1-60 months"),
  startDate: z.string().min(1, "Start date is required"),
  autopayEnabled: z.boolean().default(false),
});

type CreatePlanForm = z.infer<typeof createPlanSchema>;

export default function CreditPlans() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; planId: number; paymentId?: number } | null>(null);

  const form = useForm<CreatePlanForm>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      planName: "",
      totalAmount: 0,
      termMonths: 12,
      startDate: new Date().toISOString().split('T')[0],
      autopayEnabled: false,
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery<CreditPlan[]>({
    queryKey: ["/api/credit-plans"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<ScheduledPayment[]>({
    queryKey: ["/api/scheduled-payments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePlanForm) => {
      const monthlyPayment = Math.ceil(data.totalAmount / data.termMonths);
      return apiRequest("POST", "/api/credit-plans", {
        planName: data.planName,
        totalAmount: data.totalAmount,
        monthlyPayment,
        termMonths: data.termMonths,
        startDate: new Date(data.startDate).toISOString(),
        autopayEnabled: data.autopayEnabled,
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Credit plan created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create credit plan", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreditPlan> }) => {
      return apiRequest("PUT", `/api/credit-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-plans"] });
      toast({ title: "Plan updated" });
    },
    onError: () => {
      toast({ title: "Failed to update plan", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "defaulted": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanPayments = (planId: number) => {
    return payments?.filter((p) => p.planId === planId) || [];
  };

  const getPaymentProgress = (planId: number) => {
    const planPayments = getPlanPayments(planId);
    const completed = planPayments.filter((p) => p.status === "completed").length;
    return planPayments.length > 0 ? (completed / planPayments.length) * 100 : 0;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const watchedTotal = form.watch("totalAmount");
  const watchedTerm = form.watch("termMonths");
  const calculatedMonthly = watchedTotal && watchedTerm ? Math.ceil(watchedTotal / watchedTerm) : 0;

  if (plansLoading || paymentsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-plans-title">Credit Builder Plans</h1>
          <p className="text-muted-foreground">Build your credit with scheduled payments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) form.reset();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-plan">
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Credit Builder Plan</DialogTitle>
              <DialogDescription>Set up a new payment plan to build your credit</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="planName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Credit Builder 2024" data-testid="input-plan-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (cents) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          placeholder="e.g., 50000 for $500"
                          data-testid="input-total-amount"
                        />
                      </FormControl>
                      <FormDescription>Enter amount in cents (e.g., 50000 = $500)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="termMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (months) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          min={1}
                          max={60}
                          data-testid="input-term-months"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {calculatedMonthly > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-lg font-semibold">{formatCurrency(calculatedMonthly)}</p>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autopayEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div>
                        <FormLabel>Enable Autopay</FormLabel>
                        <FormDescription>Automatically pay on due dates</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-autopay"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-plan">
                    {createMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {plans?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Credit Builder Plans</h3>
            <p className="text-muted-foreground mb-4">Create your first plan to start building credit</p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans?.map((plan) => {
            const progress = getPaymentProgress(plan.id);
            const planPayments = getPlanPayments(plan.id);
            const completedPayments = planPayments.filter((p) => p.status === "completed").length;
            const nextPayment = planPayments
              .filter((p) => p.status === "scheduled")
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

            return (
              <Card key={plan.id} data-testid={`card-plan-${plan.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{plan.planName}</CardTitle>
                      <CardDescription>
                        {plan.termMonths} month term
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium">{formatCurrency(plan.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly</p>
                        <p className="font-medium">{formatCurrency(plan.monthlyPayment)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{completedPayments} / {planPayments.length} payments</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {nextPayment && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="text-muted-foreground">Next: </span>
                          <span className="font-medium">
                            {formatCurrency(nextPayment.amount)} due {new Date(nextPayment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setPaymentDetails({ 
                            amount: nextPayment.amount, 
                            planId: plan.id, 
                            paymentId: nextPayment.id 
                          });
                          setPaymentOpen(true);
                        }}
                        data-testid={`button-pay-${nextPayment.id}`}
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.autopayEnabled || false}
                        onCheckedChange={(checked) => 
                          updateMutation.mutate({ id: plan.id, data: { autopayEnabled: checked } })
                        }
                        disabled={plan.status !== "active"}
                      />
                      <span className="text-sm text-muted-foreground">Autopay</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPlan(plan)}
                      data-testid={`button-view-plan-${plan.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.planName}</DialogTitle>
            <DialogDescription>Payment schedule and details</DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPlan.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-medium">{formatCurrency(selectedPlan.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(selectedPlan.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedPlan.status)}>{selectedPlan.status}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Payment Schedule</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {getPlanPayments(selectedPlan.id)
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((payment, index) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">#{index + 1}</span>
                          <span>{new Date(payment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(payment.amount)}</span>
                          <Badge 
                            variant="secondary"
                            className={
                              payment.status === "completed" ? "bg-green-100 text-green-800" :
                              payment.status === "late" ? "bg-red-100 text-red-800" :
                              ""
                            }
                          >
                            {payment.status}
                          </Badge>
                          {payment.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPaymentDetails({ 
                                  amount: payment.amount, 
                                  planId: selectedPlan.id, 
                                  paymentId: payment.id 
                                });
                                setPaymentOpen(true);
                                setSelectedPlan(null);
                              }}
                              data-testid={`button-pay-schedule-${payment.id}`}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {paymentDetails && (
        <PaymentSheet
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          amount={paymentDetails.amount}
          planId={paymentDetails.planId}
          paymentId={paymentDetails.paymentId}
          onSuccess={() => setPaymentDetails(null)}
        />
      )}
    </div>
  );
}
