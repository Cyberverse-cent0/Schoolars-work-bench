import { Link, useLocation } from "wouter";
import { Home, Users, FolderOpen, User, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and statistics"
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderOpen,
    description: "Browse and manage projects"
  },
  {
    label: "Scholars",
    href: "/scholars",
    icon: Users,
    description: "Find researchers"
  },
  {
    label: "Profile",
    href: "/account",
    icon: User,
    description: "Your profile settings"
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Settings,
    description: "System administration"
  }
];

interface SimpleNavigationProps {
  className?: string;
  variant?: "horizontal" | "vertical";
  showLabels?: boolean;
  showDescriptions?: boolean;
}

export function SimpleNavigation({ 
  className, 
  variant = "horizontal",
  showLabels = true,
  showDescriptions = false
}: SimpleNavigationProps) {
  const [location] = useLocation();

  const isCurrentPath = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  if (variant === "vertical") {
    return (
      <nav className={cn("space-y-2", className)}>
        {navItems.map((item) => {
          const isActive = isCurrentPath(item.href);
          const Icon = item.icon;
          
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-primary text-primary-foreground",
                  !isActive && "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {showLabels && <span>{item.label}</span>}
              </Button>
              {showDescriptions && item.description && (
                <p className="text-xs text-muted-foreground ml-7 -mt-1 mb-2">
                  {item.description}
                </p>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {navItems.map((item) => {
        const isActive = isCurrentPath(item.href);
        const Icon = item.icon;
        
        return (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-2",
                isActive && "bg-primary text-primary-foreground",
                !isActive && "hover:bg-accent hover:text-accent-foreground border-border"
              )}
            >
              <Icon className="w-4 h-4" />
              {showLabels && <span>{item.label}</span>}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

// Quick Navigation Bar Component
export function QuickNavigation() {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <SimpleNavigation 
          variant="horizontal" 
          showLabels={true}
          className="flex-wrap"
        />
      </div>
    </div>
  );
}

// Sidebar Navigation Component
export function SidebarNavigation() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Navigation</h3>
      <SimpleNavigation 
        variant="vertical" 
        showLabels={true}
        showDescriptions={true}
      />
    </div>
  );
}
