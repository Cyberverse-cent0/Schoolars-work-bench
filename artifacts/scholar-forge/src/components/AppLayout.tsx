import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { NotificationBell } from "./NotificationBell";
import { SimpleNavigation } from "./SimpleNavigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="relative flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 gap-2">
          <SimpleNavigation variant="horizontal" showLabels={true} className="flex-1 max-w-2xl" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="flex items-center justify-around py-2">
            <SimpleNavigation 
              variant="horizontal" 
              showLabels={true}
              className="flex-1 justify-around"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
