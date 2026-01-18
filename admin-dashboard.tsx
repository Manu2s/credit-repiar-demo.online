import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Shield,
  LogOut,
  CheckCircle,
  Clock,
  AlertCircle,
  User
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDisputes: number;
  pendingDisputes: number;
  inProgressDisputes: number;
  resolvedDisputes: number;
  totalPlans: number;
  activePlans: number;
}

interface AdminUser {
  id: string;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  isActive: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  creditProfile?: {
    experianScore: number | null;
    equifaxScore: number | null;
    transunionScore: number | null;
  };
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const adminQuery = useQuery<{ id: number; username: string; fullName: string; role: string }>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  const statsQuery = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminQuery.data,
  });

  const usersQuery = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!adminQuery.data,
  });

  const disputesQuery = useQuery<any[]>({
    queryKey: ["/api/admin/disputes"],
    enabled: !!adminQuery.data,
  });

  const plansQuery = useQuery<any[]>({
    queryKey: ["/api/admin/plans"],
    enabled: !!adminQuery.data,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "User status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (adminQuery.error) {
      setLocation("/admin/login");
    }
  }, [adminQuery.error, setLocation]);

  if (adminQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!adminQuery.data) {
    return null;
  }

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {adminQuery.data.fullName}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeUsers || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-disputes">{stats?.totalDisputes || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingDisputes || 0} pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-in-progress">{stats?.inProgressDisputes || 0}</div>
                  <p className="text-xs text-muted-foreground">disputes in progress</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Credit Plans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-plans">{stats?.totalPlans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activePlans || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="disputes" data-testid="tab-disputes">
              <FileText className="h-4 w-4 mr-2" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <CreditCard className="h-4 w-4 mr-2" />
              Credit Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage consumer accounts and access</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {usersQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Credit Scores</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersQuery.data?.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {user.profile?.firstName && user.profile?.lastName
                                      ? `${user.profile.firstName} ${user.profile.lastName}`
                                      : user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.username || "Unknown"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.profile?.email || user.email || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.creditProfile ? (
                                  <>
                                    {user.creditProfile.experianScore && (
                                      <Badge variant="outline" className="text-xs">
                                        EX: {user.creditProfile.experianScore}
                                      </Badge>
                                    )}
                                    {user.creditProfile.equifaxScore && (
                                      <Badge variant="outline" className="text-xs">
                                        EQ: {user.creditProfile.equifaxScore}
                                      </Badge>
                                    )}
                                    {user.creditProfile.transunionScore && (
                                      <Badge variant="outline" className="text-xs">
                                        TU: {user.creditProfile.transunionScore}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No scores</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive !== false ? "default" : "secondary"}>
                                {user.isActive !== false ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.isActive !== false}
                                onCheckedChange={(checked) => 
                                  toggleUserStatusMutation.mutate({ userId: user.id, isActive: checked })
                                }
                                disabled={toggleUserStatusMutation.isPending}
                                data-testid={`switch-user-active-${user.id}`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {usersQuery.data?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>All Disputes</CardTitle>
                <CardDescription>View all user dispute submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {disputesQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bureau</TableHead>
                          <TableHead>Creditor</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputesQuery.data?.map((dispute) => (
                          <TableRow key={dispute.id} data-testid={`row-dispute-${dispute.id}`}>
                            <TableCell>
                              <Badge variant="outline">{dispute.bureau}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{dispute.creditorName}</TableCell>
                            <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  dispute.status === "resolved" 
                                    ? "default" 
                                    : dispute.status === "in_progress" 
                                      ? "secondary" 
                                      : "outline"
                                }
                              >
                                {dispute.status === "resolved" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {dispute.status === "in_progress" && <Clock className="h-3 w-3 mr-1" />}
                                {dispute.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                                {dispute.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(dispute.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {disputesQuery.data?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No disputes found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Credit Builder Plans</CardTitle>
                <CardDescription>View all credit builder payment plans</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {plansQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan Name</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plansQuery.data?.map((plan) => (
                          <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>${(plan.monthlyAmount / 100).toFixed(2)}/mo</TableCell>
                            <TableCell>{plan.durationMonths} months</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  plan.status === "active" 
                                    ? "default" 
                                    : plan.status === "completed" 
                                      ? "secondary" 
                                      : "outline"
                                }
                              >
                                {plan.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {plansQuery.data?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No plans found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
