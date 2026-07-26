import { Link } from "wouter";
import { CalendarClock, Database, Settings, ShieldCheck, Target, Users } from "lucide-react";
import { useAppStore, type CareAppointment } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const emptyAppointment = (): CareAppointment => ({
  id: Date.now().toString(),
  date: new Date().toISOString().slice(0, 10),
  professionalType: "",
  notesToDiscuss: "",
  agreedObjectives: "",
  reminderEnabled: false,
  summaryAfter: "",
});

export default function ProfilePage() {
  const { profile, setProfile, careAppointments, setCareAppointments } = useAppStore();
  const nextAppointment = careAppointments.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
  const draft = nextAppointment ?? emptyAppointment();
  const updateAppointment = (patch: Partial<CareAppointment>) => {
    const next = { ...draft, ...patch };
    setCareAppointments(nextAppointment
      ? careAppointments.map(item => item.id === nextAppointment.id ? next : item)
      : [next, ...careAppointments]);
  };

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
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-medium">Rendez-vous et plan de soins</h2>
              <p className="text-sm text-muted-foreground">Espace facultatif de préparation. CleanPath ne devient pas un dossier médical.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prochain rendez-vous"><Input type="date" value={draft.date} onChange={event => updateAppointment({ date: event.target.value })} /></Field>
            <Field label="Type de professionnel"><Input value={draft.professionalType} onChange={event => updateAppointment({ professionalType: event.target.value })} placeholder="Psychologue, médecin, addictologue..." /></Field>
            <div className="sm:col-span-2"><Field label="Notes à aborder"><Textarea value={draft.notesToDiscuss} onChange={event => updateAppointment({ notesToDiscuss: event.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Objectifs convenus"><Textarea value={draft.agreedObjectives} onChange={event => updateAppointment({ agreedObjectives: event.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Résumé après rendez-vous"><Textarea value={draft.summaryAfter} onChange={event => updateAppointment({ summaryAfter: event.target.value })} /></Field></div>
          </div>
        </CardContent>
      </Card>
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
