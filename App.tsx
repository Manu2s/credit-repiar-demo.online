import { useState, useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GuidedTour } from "@/components/guided-tour";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@shared/schema";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Disputes from "@/pages/disputes";
import Tasks from "@/pages/tasks";
import Resources from "@/pages/resources";
import Settings from "@/pages/settings";
import CreditPlans from "@/pages/credit-plans";
import SupportChat from "@/pages/support-chat";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import UserLogin from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [showTour, setShowTour] = useState(false);
  
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user-profile"],
  });

  useEffect(() => {
    if (!profileLoading && (!userProfile || !userProfile.tourCompleted)) {
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [profileLoading, userProfile]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center gap-2 p-2 border-b bg-card h-12">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </header>
            <main className="flex-1 overflow-auto bg-background">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/credit-plans" component={CreditPlans} />
                <Route path="/disputes" component={Disputes} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/resources" component={Resources} />
                <Route path="/support" component={SupportChat} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      <GuidedTour 
        isOpen={showTour} 
        onComplete={() => setShowTour(false)} 
      />
      <FloatingChatButton />
    </>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Toaster />
          <Switch>
            <Route path="/login" component={UserLogin} />
            <Route path="/register" component={Register} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin" component={AdminDashboard} />
            <Route component={AppContent} />
          </Switch>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
