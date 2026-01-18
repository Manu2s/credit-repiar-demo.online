import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, FileText, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Edit2, UserCircle, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CreditProfile, Dispute, Task } from "@shared/schema";
import type { DashboardStats } from "@shared/routes";

const bureauLinks = {
  Experian: "https://www.experian.com/consumer-products/free-credit-report.html",
  Equifax: "https://www.equifax.com/personal/credit-report-services/",
  TransUnion: "https://www.transunion.com/credit-monitoring",
};

const bureauConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  Experian: { color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: "E" },
  Equifax: { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", icon: "Q" },
  TransUnion: { color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30", icon: "T" },
};

function ScoreCard({ 
  bureau, 
  score, 
  lastUpdated,
  onUpdate, 
  onConnect 
}: { 
  bureau: string; 
  score: number | null;
  lastUpdated?: Date | null;
  onUpdate: () => void;
  onConnect: () => void;
}) {
  const config = bureauConfig[bureau] || { color: "text-primary", bgColor: "bg-primary/10", icon: "?" };
  
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 750) return "text-green-600 dark:text-green-400";
    if (score >= 670) return "text-blue-600 dark:text-blue-400";
    if (score >= 580) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return "Not Set";
    if (score >= 750) return "Excellent";
    if (score >= 670) return "Good";
    if (score >= 580) return "Fair";
    return "Poor";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm ${config.bgColor} ${config.color}`}>
              {config.icon}
            </div>
            <CardDescription className="text-base font-medium">{bureau}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onUpdate}
            data-testid={`button-update-${bureau.toLowerCase()}`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className={`text-3xl ${getScoreColor(score)}`} data-testid={`text-score-${bureau.toLowerCase()}`}>
          {score || "---"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{getScoreLabel(score)}</Badge>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={onConnect}
          data-testid={`button-connect-${bureau.toLowerCase()}`}
        >
          <ExternalLink className="h-4 w-4" />
          View at {bureau}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon: Icon, description }: { title: string; value: number | string; icon: any; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [updateModal, setUpdateModal] = useState<{ open: boolean; bureau: string | null }>({ open: false, bureau: null });
  const [scoreInput, setScoreInput] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<CreditProfile | null>({
    queryKey: ["/api/credit-profile"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: disputes, isLoading: disputesLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ bureau, score }: { bureau: string; score: number }) => {
      const fieldMap: Record<string, string> = {
        Experian: "experianScore",
        Equifax: "equifaxScore",
        TransUnion: "transunionScore",
      };
      const field = fieldMap[bureau];
      if (!field) throw new Error("Invalid bureau");
      
      return apiRequest("PUT", "/api/credit-profile", { [field]: score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Score Updated",
        description: `Your ${updateModal.bureau} score has been updated.`,
      });
      setUpdateModal({ open: false, bureau: null });
      setScoreInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update score. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateScore = () => {
    const score = parseInt(scoreInput);
    if (isNaN(score) || score < 300 || score > 850) {
      toast({
        title: "Invalid Score",
        description: "Please enter a score between 300 and 850.",
        variant: "destructive",
      });
      return;
    }
    if (updateModal.bureau) {
      updateScoreMutation.mutate({ bureau: updateModal.bureau, score });
    }
  };

  const openUpdateModal = (bureau: string) => {
    const currentScore = bureau === "Experian" ? profile?.experianScore :
                         bureau === "Equifax" ? profile?.equifaxScore :
                         profile?.transunionScore;
    setScoreInput(currentScore?.toString() || "");
    setUpdateModal({ open: true, bureau });
  };

  const openBureauSite = (bureau: string) => {
    const url = bureauLinks[bureau as keyof typeof bureauLinks];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const isLoading = profileLoading || statsLoading || disputesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const recentDisputes = disputes?.slice(0, 3) || [];
  const pendingTasks = tasks?.filter(t => t.status === "pending").slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <Dialog open={updateModal.open} onOpenChange={(open) => setUpdateModal({ open, bureau: open ? updateModal.bureau : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {updateModal.bureau} Score</DialogTitle>
            <DialogDescription>
              Enter your current credit score from {updateModal.bureau}. You can find this on their website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="score">Credit Score (300-850)</Label>
              <Input
                id="score"
                type="number"
                min={300}
                max={850}
                placeholder="Enter your score"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                data-testid="input-score"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleUpdateScore}
                disabled={updateScoreMutation.isPending}
                data-testid="button-save-score"
              >
                {updateScoreMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Save Score
              </Button>
              <Button
                variant="outline"
                onClick={() => openBureauSite(updateModal.bureau || "")}
                className="gap-2"
                data-testid="button-view-bureau"
              >
                <ExternalLink className="h-4 w-4" />
                View at {updateModal.bureau}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Track your credit repair progress</p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold">Credit Scores</h2>
          <span className="text-sm text-muted-foreground">
            Click the edit icon to update your scores
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <ScoreCard 
            bureau="Experian" 
            score={profile?.experianScore ?? null} 
            lastUpdated={profile?.lastUpdated}
            onUpdate={() => openUpdateModal("Experian")}
            onConnect={() => openBureauSite("Experian")}
          />
          <ScoreCard 
            bureau="Equifax" 
            score={profile?.equifaxScore ?? null} 
            lastUpdated={profile?.lastUpdated}
            onUpdate={() => openUpdateModal("Equifax")}
            onConnect={() => openBureauSite("Equifax")}
          />
          <ScoreCard 
            bureau="TransUnion" 
            score={profile?.transunionScore ?? null} 
            lastUpdated={profile?.lastUpdated}
            onUpdate={() => openUpdateModal("TransUnion")}
            onConnect={() => openBureauSite("TransUnion")}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Disputes"
            value={stats?.totalDisputes || 0}
            icon={FileText}
          />
          <StatCard
            title="Pending Disputes"
            value={stats?.pendingDisputes || 0}
            icon={AlertCircle}
          />
          <StatCard
            title="Resolved"
            value={stats?.resolvedDisputes || 0}
            icon={CheckCircle}
          />
          <StatCard
            title="Average Score"
            value={stats?.averageScore || "---"}
            icon={TrendingUp}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDisputes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No disputes yet. Start by adding your first dispute.</p>
            ) : (
              <div className="space-y-3">
                {recentDisputes.map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md" data-testid={`card-dispute-${dispute.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{dispute.creditorName}</p>
                      <p className="text-sm text-muted-foreground">{dispute.bureau}</p>
                    </div>
                    <Badge
                      variant={
                        dispute.status === "resolved" ? "default" :
                        dispute.status === "rejected" ? "destructive" :
                        "secondary"
                      }
                    >
                      {dispute.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending tasks. Add tasks to stay organized.</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md" data-testid={`card-task-${task.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{task.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Need Help?</h3>
                <p className="text-muted-foreground">
                  Our support team is here to assist you with your credit repair journey
                </p>
              </div>
            </div>
            <Link href="/support">
              <Button className="gap-2" data-testid="button-chat-support">
                <MessageSquare className="h-4 w-4" />
                Chat with Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
