import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@workspace/replit-auth-web";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import Journal from "@/pages/Journal";
import NewTrade from "@/pages/NewTrade";
import TradeDetail from "@/pages/TradeDetail";
import Analytics from "@/pages/Analytics";
import Psychology from "@/pages/Psychology";
import Risk from "@/pages/Risk";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { OutlierLogoMark } from "@/components/OutlierLogo";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <OutlierLogoMark size="lg" />
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;
  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/contas" component={Accounts} />
        <Route path="/contas/:id" component={AccountDetail} />
        <Route path="/diario" component={Journal} />
        <Route path="/diario/novo" component={NewTrade} />
        <Route path="/diario/:id" component={TradeDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/psicologia" component={Psychology} />
        <Route path="/risco" component={Risk} />
        <Route path="/perfil" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate>
              <Router />
            </AuthGate>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
