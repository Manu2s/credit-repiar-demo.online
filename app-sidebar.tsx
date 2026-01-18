import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, CheckSquare, BookOpen, LogOut, Shield, CreditCard, Settings, MessageSquare } from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, tourId: "dashboard" },
  { title: "Credit Plans", url: "/credit-plans", icon: CreditCard, tourId: "credit-plans" },
  { title: "Disputes", url: "/disputes", icon: FileText, tourId: "disputes" },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, tourId: "tasks" },
  { title: "Resources", url: "/resources", icon: BookOpen, tourId: "resources" },
  { title: "Support Chat", url: "/support", icon: MessageSquare, tourId: "support" },
  { title: "Settings", url: "/settings", icon: Settings, tourId: "settings" },
];

export function AppSidebar() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const getInitials = (user: any) => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Credit Repair Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      data-testid={`link-${item.title.toLowerCase()}`}
                      data-tour={item.tourId}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-primary/50 to-primary/30 rounded-full" />
            <Avatar className="h-8 w-8 relative ring-2 ring-background">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
