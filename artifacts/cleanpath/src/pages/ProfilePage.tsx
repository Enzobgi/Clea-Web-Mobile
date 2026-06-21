import { Link } from "wouter";
import { Database, Settings, ShieldCheck, Target, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const { profile, setProfile } = useAppStore();
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header><h1 className="text-2xl font-medium">Profil</h1><p className="text-muted-foreground">Tes repères personnels et tes réglages de confidentialité.</p></header>
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Prénom ou pseudonyme"><Input value={profile.nickname} onChange={event => setProfile({ ...profile, nickname: event.target.value })} /></Field>
        <Field label="Substance ou comportement"><Input value={profile.substance} onChange={event => setProfile({ ...profile, substance: event.target.value })} /></Field>
        <Field label="Date de départ"><Input type="date" value={profile.startDate} onChange={event => setProfile({ ...profile, startDate: event.target.value })} /></Field>
        <Field label="Pays ou région"><Input value={profile.region} onChange={event => setProfile({ ...profile, region: event.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Objectif personnel"><Textarea value={profile.personalGoal} onChange={event => setProfile({ ...profile, personalGoal: event.target.value })} /></Field></div>
      </CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileLink href="/objectifs" icon={Target} title="Objectifs" />
        <ProfileLink href="/contacts" icon={Users} title="Cercle de confiance" />
        <ProfileLink href="/plan-securite" icon={ShieldCheck} title="Plan de protection" />
        <ProfileLink href="/parametres" icon={Settings} title="Paramètres et verrouillage" />
        <ProfileLink href="/parametres" icon={Database} title="Mes données et export" />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ProfileLink({ href, icon: Icon, title }: { href: string; icon: typeof Target; title: string }) {
  return <Link href={href}><Button variant="outline" className="h-14 w-full justify-start"><Icon className="mr-3 h-5 w-5 text-primary" />{title}</Button></Link>;
}
