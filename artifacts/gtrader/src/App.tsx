import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import Journal from "@/pages/Journal";
import NewTrade from "@/pages/NewTrade";
import TradeDetail from "@/pages/TradeDetail";
import Analytics from "@/pages/Analytics";
import Psychology from "@/pages/Psychology";
import Risk from "@/pages/Risk";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/accounts/:id" component={AccountDetail} />
        <Route path="/journal" component={Journal} />
        <Route path="/journal/new" component={NewTrade} />
        <Route path="/journal/:id" component={TradeDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/psychology" component={Psychology} />
        <Route path="/risk" component={Risk} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
