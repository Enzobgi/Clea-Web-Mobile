import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendarPage() {
  const { sessions, setSessions, dayEntries, setDayEntries } = useAppStore();
  
  const currentSession = sessions.find(s => !s.endDate);
  
  const handleReset = () => {
    if (currentSession) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id ? { ...s, endDate: new Date().toISOString() } : s
      );
      setSessions([
        ...updatedSessions,
        {
          id: Date.now().toString(),
          startDate: new Date().toISOString(),
          endDate: null,
          note: ""
        }
      ]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Calendrier d'abstinence</h1>
        <p className="text-muted-foreground">Suis ton parcours jour après jour.</p>
      </header>

      <Card>
        <CardContent className="p-0 flex justify-center py-4">
          <Calendar
            mode="single"
            locale={fr}
            className="rounded-md"
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div>
          <h3 className="font-medium">Réinitialiser le compteur</h3>
          <p className="text-sm text-muted-foreground">Une rechute est un apprentissage, pas une fin.</p>
        </div>
        <Button variant="outline" onClick={handleReset}>Réinitialiser</Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Historique</h3>
        {sessions.map(session => (
          <Card key={session.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {format(new Date(session.startDate), "d MMMM yyyy", { locale: fr })} - 
                  {session.endDate ? format(new Date(session.endDate), " d MMMM yyyy", { locale: fr }) : " Aujourd'hui"}
                </p>
                {session.endDate && (
                  <p className="text-sm text-muted-foreground">
                    {differenceInDays(new Date(session.endDate), new Date(session.startDate))} jours
                  </p>
                )}
              </div>
              {!session.endDate && <span className="text-primary text-sm font-medium">En cours</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
