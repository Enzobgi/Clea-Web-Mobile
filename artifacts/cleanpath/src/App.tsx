import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { PinLock } from "@/components/PinLock";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { UserProvider, useUser } from "@/store/UserContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import ConsumptionJournalPage from "@/pages/ConsumptionJournalPage";
import EmotionalJournalPage from "@/pages/EmotionalJournalPage";
import UrgencyPage from "@/pages/UrgencyPage";
import StatsPage from "@/pages/StatsPage";
import SafetyPlanPage from "@/pages/SafetyPlanPage";
import ContactsPage from "@/pages/ContactsPage";
import GoalsPage from "@/pages/GoalsPage";
import ToolboxPage from "@/pages/ToolboxPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calendrier" component={CalendarPage} />
        <Route path="/journal-consommation" component={ConsumptionJournalPage} />
        <Route path="/journal-emotionnel" component={EmotionalJournalPage} />
        <Route path="/urgence" component={UrgencyPage} />
        <Route path="/statistiques" component={StatsPage} />
        <Route path="/plan-securite" component={SafetyPlanPage} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/objectifs" component={GoalsPage} />
        <Route path="/boite-a-outils" component={ToolboxPage} />
        <Route path="/parametres" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AppContent() {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <WelcomeScreen />;
  }

  return (
    <PinLock key={currentUser}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </PinLock>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
