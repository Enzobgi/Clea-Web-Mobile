import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  Calendar,
  ChevronDown,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PenTool,
  Route,
  Settings,
  ShieldAlert,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings } = useAppStore();
  const { currentUser, logout } = useUser();
  const title = settings.discreteMode ? "Journal" : "CleanPath";

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="hidden h-16 items-center justify-between border-b border-border px-6 md:flex">
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <UserMenu currentUser={currentUser} logout={logout} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-col gap-2 border-r border-border bg-card p-4 md:flex">
          <NavItem href="/" icon={Home} label="Accueil" active={location === "/"} />
          <NavItem href="/calendrier" icon={Calendar} label="Calendrier" active={location === "/calendrier"} />
          <NavItem href="/journal-consommation" icon={BookOpen} label="Journal de consommation" active={location === "/journal-consommation"} />
          <NavItem href="/journal-emotionnel" icon={Heart} label="Journal émotionnel" active={location === "/journal-emotionnel"} />
          <NavItem href="/urgence" icon={AlertCircle} label="Urgence" active={location === "/urgence" || location === "/sos"} destructive />
          <NavItem href="/statistiques" icon={BarChart2} label="Statistiques" active={location === "/statistiques"} />

          <div className="mb-2 mt-8 px-2 text-xs font-medium uppercase text-muted-foreground">Plus</div>
          <NavItem href="/parcours" icon={Route} label="Parcours guidés" active={location === "/parcours"} />
          <NavItem href="/chat" icon={MessageCircle} label="Chat" active={location === "/chat"} />
          <NavItem href="/plan-securite" icon={ShieldAlert} label="Plan de protection" active={location === "/plan-securite"} />
          <NavItem href="/contacts" icon={Users} label="Contacts" active={location === "/contacts"} />
          <NavItem href="/objectifs" icon={Target} label="Objectifs" active={location === "/objectifs"} />
          <NavItem href="/boite-a-outils" icon={PenTool} label="Boîte à outils" active={location === "/boite-a-outils"} />
          <NavItem href="/profil" icon={UserRound} label="Profil" active={location === "/profil"} />
          <NavItem href="/parametres" icon={Settings} label="Paramètres" active={location === "/parametres"} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>

      <nav className="flex h-16 shrink-0 items-center justify-around border-t border-border bg-card px-2 pb-safe md:hidden">
        <MobileNavItem href="/" icon={Home} label="Accueil" active={location === "/"} />
        <MobileNavItem href="/calendrier" icon={Calendar} label="Calendrier" active={location === "/calendrier"} />
        <MobileNavItem href="/journal-consommation" icon={BookOpen} label="Conso." active={location === "/journal-consommation"} />
        <MobileNavItem href="/journal-emotionnel" icon={Heart} label="Émotions" active={location === "/journal-emotionnel"} />
        <MobileNavItem href="/urgence" icon={AlertCircle} label="Urgence" active={location === "/urgence" || location === "/sos"} destructive />
        <MobileNavItem href="/statistiques" icon={BarChart2} label="Stats" active={location === "/statistiques"} />
        <MoreMenu logout={logout} />
      </nav>
    </div>
  );
}

function UserMenu({ currentUser, logout }: { currentUser: string | null; logout: () => Promise<void> }) {
  if (!currentUser) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-accent">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">{currentUser.charAt(0).toUpperCase()}</span>
          <span className="text-sm font-medium">{currentUser}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <Link href="/profil"><DropdownMenuItem><UserRound className="mr-2 h-4 w-4" />Profil</DropdownMenuItem></Link>
        <Link href="/parametres"><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Paramètres</DropdownMenuItem></Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({ logout }: { logout: () => Promise<void> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-full w-16 flex-col items-center justify-center gap-1 text-muted-foreground">
          <MoreHorizontal size={20} /><span className="text-[10px]">Plus</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mb-2 w-56">
        <Link href="/parcours"><DropdownMenuItem><Route className="mr-2 h-4 w-4" />Parcours guidés</DropdownMenuItem></Link>
        <Link href="/chat"><DropdownMenuItem><MessageCircle className="mr-2 h-4 w-4" />Chat</DropdownMenuItem></Link>
        <Link href="/plan-securite"><DropdownMenuItem><ShieldAlert className="mr-2 h-4 w-4" />Plan de protection</DropdownMenuItem></Link>
        <Link href="/contacts"><DropdownMenuItem><Users className="mr-2 h-4 w-4" />Contacts</DropdownMenuItem></Link>
        <Link href="/objectifs"><DropdownMenuItem><Target className="mr-2 h-4 w-4" />Objectifs</DropdownMenuItem></Link>
        <Link href="/boite-a-outils"><DropdownMenuItem><PenTool className="mr-2 h-4 w-4" />Boîte à outils</DropdownMenuItem></Link>
        <Link href="/profil"><DropdownMenuItem><UserRound className="mr-2 h-4 w-4" />Profil</DropdownMenuItem></Link>
        <Link href="/parametres"><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Paramètres</DropdownMenuItem></Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItem({ href, icon: Icon, label, active, destructive = false }: { href: string; icon: typeof Home; label: string; active: boolean; destructive?: boolean }) {
  return (
    <Link href={href}>
      <Button variant={active ? "secondary" : "ghost"} className={`w-full justify-start ${destructive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""}`}>
        <Icon className="mr-2 h-5 w-5" />{label}
      </Button>
    </Link>
  );
}

function MobileNavItem({ href, icon: Icon, label, active, destructive = false }: { href: string; icon: typeof Home; label: string; active: boolean; destructive?: boolean }) {
  const color = active ? (destructive ? "text-destructive" : "text-primary") : "text-muted-foreground";
  return <Link href={href} className={`flex h-full w-16 flex-col items-center justify-center gap-1 ${color}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></Link>;
}
