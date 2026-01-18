import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Shield, FileCheck, CreditCard } from "lucide-react";
import type { UserProfile, Consent, CreditProfile } from "@shared/schema";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const profileSchema = z.object({
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const creditScoreSchema = z.object({
  experianScore: z.coerce.number().min(300).max(850).optional().nullable(),
  equifaxScore: z.coerce.number().min(300).max(850).optional().nullable(),
  transunionScore: z.coerce.number().min(300).max(850).optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type CreditScoreForm = z.infer<typeof creditScoreSchema>;

const CONSENT_TYPES = {
  terms_of_service: "Terms of Service",
  privacy_policy: "Privacy Policy",
  credit_reporting: "Credit Reporting Authorization",
  esign: "E-Sign Consent",
  autopay: "Autopay Agreement",
};

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user-profile"],
  });

  const { data: creditProfile, isLoading: creditLoading } = useQuery<CreditProfile | null>({
    queryKey: ["/api/credit-profile"],
  });

  const { data: consents, isLoading: consentsLoading } = useQuery<Consent[]>({
    queryKey: ["/api/consents"],
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      dateOfBirth: "",
    },
    values: profile ? {
      phone: profile.phone || "",
      addressLine1: profile.addressLine1 || "",
      addressLine2: profile.addressLine2 || "",
      city: profile.city || "",
      state: profile.state || "",
      zipCode: profile.zipCode || "",
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
    } : undefined,
  });

  const creditForm = useForm<CreditScoreForm>({
    resolver: zodResolver(creditScoreSchema),
    defaultValues: {
      experianScore: null,
      equifaxScore: null,
      transunionScore: null,
    },
    values: creditProfile ? {
      experianScore: creditProfile.experianScore,
      equifaxScore: creditProfile.equifaxScore,
      transunionScore: creditProfile.transunionScore,
    } : undefined,
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest("PUT", "/api/user-profile", {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const creditMutation = useMutation({
    mutationFn: async (data: CreditScoreForm) => {
      return apiRequest("PUT", "/api/credit-profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Credit scores updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update credit scores", variant: "destructive" });
    },
  });

  const consentMutation = useMutation({
    mutationFn: async (consentType: string) => {
      return apiRequest("POST", "/api/consents", {
        consentType,
        consentVersion: "1.0",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consents"] });
      toast({ title: "Consent recorded" });
    },
    onError: () => {
      toast({ title: "Failed to record consent", variant: "destructive" });
    },
  });

  const isLoading = profileLoading || creditLoading || consentsLoading;

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const hasConsent = (type: string) => consents?.some((c) => c.consentType === type);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-primary via-primary/50 to-primary/30 rounded-full" />
                <Avatar className="h-16 w-16 relative ring-2 ring-background">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="font-medium" data-testid="text-user-fullname">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : "User"}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  KYC: {profile?.kycStatus || "Not Started"}
                </Badge>
              </div>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street address" data-testid="input-address1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Apt, suite, etc. (optional)" data-testid="input-address2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="ZIP" data-testid="input-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-profile">
                  {profileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Credit Scores</CardTitle>
                <CardDescription>Enter your scores from each bureau</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...creditForm}>
              <form onSubmit={creditForm.handleSubmit((data) => creditMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={creditForm.control}
                  name="experianScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">E</span>
                        Experian Score
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="300-850" 
                          min={300} 
                          max={850}
                          data-testid="input-experian-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={creditForm.control}
                  name="equifaxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Q</span>
                        Equifax Score
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="300-850" 
                          min={300} 
                          max={850}
                          data-testid="input-equifax-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={creditForm.control}
                  name="transunionScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">T</span>
                        TransUnion Score
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="300-850" 
                          min={300} 
                          max={850}
                          data-testid="input-transunion-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={creditMutation.isPending} data-testid="button-save-scores">
                  {creditMutation.isPending ? "Saving..." : "Update Scores"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Disclosures & Consents</CardTitle>
              <CardDescription>Required agreements for using our services</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(CONSENT_TYPES).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="font-medium">{label}</p>
                  {hasConsent(key) ? (
                    <p className="text-sm text-muted-foreground">
                      Accepted on {new Date(consents!.find((c) => c.consentType === key)!.acceptedAt!).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not yet accepted</p>
                  )}
                </div>
                {hasConsent(key) ? (
                  <Badge variant="secondary">Accepted</Badge>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => consentMutation.mutate(key)}
                    disabled={consentMutation.isPending}
                    data-testid={`button-accept-${key}`}
                  >
                    Accept
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
