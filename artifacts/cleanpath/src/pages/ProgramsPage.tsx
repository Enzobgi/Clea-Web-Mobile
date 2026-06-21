import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { GUIDED_PROGRAMS, type GuidedProgram } from "@/content/programs";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProgramsPage() {
  const { programProgress, setProgramProgress } = useAppStore();
  const [selected, setSelected] = useState<GuidedProgram | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const progressFor = (programId: string) => programProgress.find(item => item.programId === programId);
  const completeStep = () => {
    if (!selected) return;
    const step = selected.steps[stepIndex];
    const current = progressFor(selected.id);
    const completedSteps = Array.from(new Set([...(current?.completedSteps ?? []), step.id]));
    const done = completedSteps.length === selected.steps.length;
    setProgramProgress([
      ...programProgress.filter(item => item.programId !== selected.id),
      { programId: selected.id, completedSteps, completedAt: done ? new Date().toISOString() : null },
    ]);
    if (stepIndex < selected.steps.length - 1) setStepIndex(stepIndex + 1);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <header><h1 className="text-2xl font-medium">Parcours</h1><p className="text-muted-foreground">Des étapes courtes à suivre à ton rythme.</p></header>
      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDED_PROGRAMS.map(program => {
          const progress = progressFor(program.id);
          const percent = Math.round(((progress?.completedSteps.length ?? 0) / program.steps.length) * 100);
          return (
            <Card key={program.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{program.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{program.description}</p>
                <div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{percent}% · {program.duration}</p></div>
                <Button variant="outline" className="w-full" onClick={() => { setSelected(program); setStepIndex(0); }}>
                  {progress?.completedAt ? <Check className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  {progress?.completedAt ? "Revoir" : "Continuer"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent>
          {selected && <><DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">Étape {stepIndex + 1} sur {selected.steps.length}</p>
              <div><h3 className="text-lg font-medium">{selected.steps[stepIndex].title}</h3><p className="mt-2 text-muted-foreground">{selected.steps[stepIndex].body}</p></div>
              <div className="rounded-md bg-primary/10 p-4 text-sm"><strong>Petite action:</strong> {selected.steps[stepIndex].action}</div>
              <Button className="w-full" onClick={completeStep}>{stepIndex === selected.steps.length - 1 ? "Terminer le parcours" : "Étape terminée"}</Button>
            </div></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
