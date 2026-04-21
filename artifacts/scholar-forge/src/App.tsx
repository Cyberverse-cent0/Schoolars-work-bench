import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import CreateProject from "@/pages/CreateProject";
import ProjectDetail from "@/pages/project/ProjectDetail";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import ScholarDirectory from "@/pages/ScholarDirectory";
import UserManagement from "@/pages/admin/UserManagement";
import PublicProfile from "@/pages/PublicProfile";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/signin" />;
  }

  return (
    <AppLayout>
      <AnimatedPage>
        <Component />
      </AnimatedPage>
    </AppLayout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/signin" component={() => <PublicRoute component={SignIn} />} />
      <Route path="/signup" component={() => <PublicRoute component={SignUp} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/projects/create" component={() => <ProtectedRoute component={CreateProject} />} />
      <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectDetail} />} />
      <Route path="/profile/:userId" component={() => <ProtectedRoute component={PublicProfile} />} />
      <Route path="/account" component={() => <ProtectedRoute component={Account} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/scholars" component={() => <ProtectedRoute component={ScholarDirectory} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActivityProvider>
          <SocketProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </SocketProvider>
        </ActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
