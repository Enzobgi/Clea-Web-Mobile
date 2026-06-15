import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, BookOpen, Heart, AlertCircle, BarChart2, MoreHorizontal, Settings, ShieldAlert, Users, Target, PenTool, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings } = useAppStore();
  const { currentUser, users, switchUser } = useUser();
  const title = settings.discreteMode ? "Journal" : "CleanPath";
  const otherUsers = users.filter(u => u !== currentUser);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="hidden md:flex h-16 border-b border-border items-center px-6 justify-between">
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <UserMenu currentUser={currentUser} otherUsers={otherUsers} switchUser={switchUser} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 gap-2">
          <NavItem href="/" icon={Home} label="Accueil" active={location === "/"} />
          <NavItem href="/calendrier" icon={Calendar} label="Calendrier" active={location === "/calendrier"} />
          <NavItem href="/journal-consommation" icon={BookOpen} label="Journal de consommation" active={location === "/journal-consommation"} />
          <NavItem href="/journal-emotionnel" icon={Heart} label="Journal émotionnel" active={location === "/journal-emotionnel"} />
          <NavItem href="/urgence" icon={AlertCircle} label="Urgence" active={location === "/urgence"} variant="destructive" />
          <NavItem href="/statistiques" icon={BarChart2} label="Statistiques" active={location === "/statistiques"} />

          <div className="mt-8 mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plus</div>
          <NavItem href="/plan-securite" icon={ShieldAlert} label="Plan de sécurité" active={location === "/plan-securite"} />
          <NavItem href="/contacts" icon={Users} label="Contacts" active={location === "/contacts"} />
          <NavItem href="/objectifs" icon={Target} label="Objectifs" active={location === "/objectifs"} />
          <NavItem href="/boite-a-outils" icon={PenTool} label="Boîte à outils" active={location === "/boite-a-outils"} />
          <NavItem href="/parametres" icon={Settings} label="Paramètres" active={location === "/parametres"} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      <nav className="md:hidden flex h-16 border-t border-border bg-card justify-around items-center px-2 shrink-0 pb-safe">
        <MobileNavItem href="/" icon={Home} label="Accueil" active={location === "/"} />
        <MobileNavItem href="/calendrier" icon={Calendar} label="Calendrier" active={location === "/calendrier"} />
        <MobileNavItem href="/journal-consommation" icon={BookOpen} label="Conso." active={location === "/journal-consommation"} />
        <MobileNavItem href="/journal-emotionnel" icon={Heart} label="Émotions" active={location === "/journal-emotionnel"} />
        <MobileNavItem href="/urgence" icon={AlertCircle} label="Urgence" active={location === "/urgence"} variant="destructive" />
        <MobileNavItem href="/statistiques" icon={BarChart2} label="Stats" active={location === "/statistiques"} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground">
              <MoreHorizontal size={20} />
              <span className="text-[10px]">Plus</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <Link href="/plan-securite"><DropdownMenuItem><ShieldAlert className="mr-2 h-4 w-4" /> Plan de sécurité</DropdownMenuItem></Link>
            <Link href="/contacts"><DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Contacts</DropdownMenuItem></Link>
            <Link href="/objectifs"><DropdownMenuItem><Target className="mr-2 h-4 w-4" /> Objectifs</DropdownMenuItem></Link>
            <Link href="/boite-a-outils"><DropdownMenuItem><PenTool className="mr-2 h-4 w-4" /> Boîte à outils</DropdownMenuItem></Link>
            <Link href="/parametres"><DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Paramètres</DropdownMenuItem></Link>
            {otherUsers.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {otherUsers.map(u => (
                  <DropdownMenuItem key={u} onClick={() => switchUser(u)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Passer à {u}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}

function UserMenu({ currentUser, otherUsers, switchUser }: { currentUser: string | null; otherUsers: string[]; switchUser: (name: string) => void }) {
  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-accent transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">{currentUser.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-foreground">{currentUser}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {otherUsers.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">Changer de profil</div>
            {otherUsers.map(u => (
              <DropdownMenuItem key={u} onClick={() => switchUser(u)}>
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center mr-2">
                  <span className="text-xs font-medium">{u.charAt(0).toUpperCase()}</span>
                </div>
                {u}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <Link href="/parametres">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItem({ href, icon: Icon, label, active, variant = "ghost" }: any) {
  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className={`w-full justify-start ${variant === "destructive" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}`}
      >
        <Icon className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
}

function MobileNavItem({ href, icon: Icon, label, active, variant = "default" }: any) {
  const colorClass = active
    ? (variant === "destructive" ? "text-destructive" : "text-primary")
    : "text-muted-foreground";

  return (
    <Link href={href} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${colorClass}`}>
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
