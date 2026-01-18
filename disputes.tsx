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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit } from "lucide-react";
import type { Dispute } from "@shared/schema";
import { CREDIT_BUREAUS, DISPUTE_STATUSES } from "@shared/schema";

const createDisputeSchema = z.object({
  creditorName: z.string().min(1, "Creditor name is required"),
  accountNumber: z.string().optional(),
  bureau: z.enum(CREDIT_BUREAUS, { required_error: "Please select a credit bureau" }),
  disputeReason: z.string().min(1, "Dispute reason is required"),
  amount: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

const updateDisputeSchema = createDisputeSchema.extend({
  status: z.enum(DISPUTE_STATUSES),
});

type CreateDisputeForm = z.infer<typeof createDisputeSchema>;
type UpdateDisputeForm = z.infer<typeof updateDisputeSchema>;

export default function Disputes() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState<Dispute | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBureau, setFilterBureau] = useState<string>("all");

  const createForm = useForm<CreateDisputeForm>({
    resolver: zodResolver(createDisputeSchema),
    defaultValues: {
      creditorName: "",
      accountNumber: "",
      bureau: undefined,
      disputeReason: "",
      amount: null,
      notes: "",
    },
  });

  const editForm = useForm<UpdateDisputeForm>({
    resolver: zodResolver(updateDisputeSchema),
    defaultValues: {
      creditorName: "",
      accountNumber: "",
      bureau: "Experian",
      disputeReason: "",
      status: "pending",
      amount: null,
      notes: "",
    },
  });

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateDisputeForm) => {
      return apiRequest("POST", "/api/disputes", {
        ...data,
        accountNumber: data.accountNumber || null,
        notes: data.notes || null,
        amount: data.amount || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast({ title: "Dispute created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create dispute", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDisputeForm }) => {
      return apiRequest("PUT", `/api/disputes/${id}`, {
        ...data,
        accountNumber: data.accountNumber || null,
        notes: data.notes || null,
        amount: data.amount || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditingDispute(null);
      toast({ title: "Dispute updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update dispute", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/disputes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Dispute deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete dispute", variant: "destructive" });
    },
  });

  const handleOpenEdit = (dispute: Dispute) => {
    editForm.reset({
      creditorName: dispute.creditorName,
      accountNumber: dispute.accountNumber || "",
      bureau: dispute.bureau as typeof CREDIT_BUREAUS[number],
      disputeReason: dispute.disputeReason,
      status: dispute.status as typeof DISPUTE_STATUSES[number],
      amount: dispute.amount || null,
      notes: dispute.notes || "",
    });
    setEditingDispute(dispute);
  };

  const filteredDisputes = disputes?.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterBureau !== "all" && d.bureau !== filterBureau) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-disputes-title">Disputes</h1>
          <p className="text-muted-foreground">Manage your credit report disputes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) createForm.reset();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-dispute">
              <Plus className="h-4 w-4 mr-2" />
              Add Dispute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dispute</DialogTitle>
              <DialogDescription>Add a new dispute to track</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="creditorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creditor Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-creditor-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="bureau"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Bureau *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bureau">
                            <SelectValue placeholder="Select bureau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CREDIT_BUREAUS.map((bureau) => (
                            <SelectItem key={bureau} value={bureau}>{bureau}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="disputeReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Dispute *</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-dispute-reason" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          data-testid="input-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-dispute">
                    {createMutation.isPending ? "Creating..." : "Create Dispute"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {DISPUTE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBureau} onValueChange={setFilterBureau}>
          <SelectTrigger className="w-40" data-testid="select-filter-bureau">
            <SelectValue placeholder="Filter by bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bureaus</SelectItem>
            {CREDIT_BUREAUS.map((bureau) => (
              <SelectItem key={bureau} value={bureau}>{bureau}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredDisputes?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No disputes found. Create your first dispute to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDisputes?.map((dispute) => (
            <Card key={dispute.id} data-testid={`card-dispute-${dispute.id}`}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{dispute.creditorName}</CardTitle>
                    <CardDescription>
                      {dispute.bureau} {dispute.accountNumber && `- ${dispute.accountNumber}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.replace("_", " ")}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(dispute)}
                      data-testid={`button-edit-dispute-${dispute.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(dispute.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-dispute-${dispute.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{dispute.disputeReason}</p>
                {dispute.amount && (
                  <p className="text-sm text-muted-foreground">Amount: ${dispute.amount.toLocaleString()}</p>
                )}
                {dispute.notes && (
                  <p className="text-sm text-muted-foreground mt-2">Notes: {dispute.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(dispute.createdAt!).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingDispute} onOpenChange={(open) => !open && setEditingDispute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dispute</DialogTitle>
            <DialogDescription>Update dispute details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => editingDispute && updateMutation.mutate({ id: editingDispute.id, data }))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="creditorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creditor Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="bureau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Bureau *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREDIT_BUREAUS.map((bureau) => (
                          <SelectItem key={bureau} value={bureau}>{bureau}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISPUTE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="disputeReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Dispute *</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
