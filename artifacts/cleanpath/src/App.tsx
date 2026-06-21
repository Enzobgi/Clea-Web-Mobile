import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { PinLock } from "@/components/PinLock";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { UserProvider, useUser } from "@/store/UserContext";
import { VaultProvider } from "@/store/VaultContext";
import { AppStoreProvider } from "@/store/useAppStore";
import { useAppStore } from "@/store/useAppStore";
import { OnboardingFlow } from "@/components/OnboardingFlow";
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
import DemoPage from "@/pages/DemoPage";
import JournalPage from "@/pages/JournalPage";
import ProgramsPage from "@/pages/ProgramsPage";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/sos" component={UrgencyPage} />
        <Route path="/parcours" component={ProgramsPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/profil" component={ProfilePage} />
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

function AuthenticatedApp() {
  const { profile } = useAppStore();
  return (
    <PinLock>
      <>
        {!profile.onboardingCompleted && <OnboardingFlow />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </>
    </PinLock>
  );
}

function AppContent() {
  const { currentUser, user, isLoading } = useUser();

  if (window.location.pathname === "/demo") {
    return <DemoPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Ouverture de ton espace...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <WelcomeScreen />;
  }

  return (
    <VaultProvider key={user?.id}>
      <AppStoreProvider>
        <AuthenticatedApp />
      </AppStoreProvider>
    </VaultProvider>
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
