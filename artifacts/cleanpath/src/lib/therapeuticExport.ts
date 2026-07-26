import { format, isWithinInterval, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  ConsumptionEntry,
  DayEntry,
  EmotionalEntry,
  SafetyPlan,
  SubstanceTracking,
} from "@/store/useAppStore";
import {
  getDayStatus,
  getMarkedDates,
  isConsumptionFreeStatus,
} from "@/lib/abstinence";

export type ExportPeriodPreset = "7" | "30" | "90" | "custom";

export interface TherapeuticExportSections {
  consumptions: boolean;
  abstinentDays: boolean;
  cravings: boolean;
  wellbeing: boolean;
  triggers: boolean;
  strategies: boolean;
  goals: boolean;
  personalSummary: boolean;
  appointmentNotes: boolean;
}

export interface TherapeuticExportInput {
  period: ExportPeriodPreset;
  customStart: string;
  customEnd: string;
  sections: TherapeuticExportSections;
  personalSummary: string;
  appointmentNotes: string;
  substances: SubstanceTracking[];
  consumptions: ConsumptionEntry[];
  dayEntries: DayEntry[];
  emotions: EmotionalEntry[];
  safetyPlan: SafetyPlan;
}

export const defaultTherapeuticSections: TherapeuticExportSections = {
  consumptions: true,
  abstinentDays: true,
  cravings: true,
  wellbeing: true,
  triggers: true,
  strategies: true,
  goals: true,
  personalSummary: true,
  appointmentNotes: true,
};

export function resolveExportPeriod(period: ExportPeriodPreset, customStart: string, customEnd: string, today = new Date()) {
  const end = period === "custom" && customEnd ? parseLocalDate(customEnd) : today;
  const start = period === "custom" && customStart
    ? parseLocalDate(customStart)
    : subDays(end, Number(period) - 1);
  return start <= end ? { start, end } : { start: end, end: start };
}

export function consumptionInPeriod(entry: ConsumptionEntry, start: Date, end: Date) {
  return dateInPeriod(entry.date, start, end);
}

function dateInPeriod(date: string, start: Date, end: Date) {
  return isWithinInterval(parseLocalDate(date), { start, end });
}

export function summarizeBySubstance(consumptions: ConsumptionEntry[], substances: SubstanceTracking[], start: Date, end: Date) {
  const activeConsumptions = consumptions.filter(entry => entry.type === "consommation" && consumptionInPeriod(entry, start, end));
  const labels = new Map(substances.map(substance => [substance.id, substance.name]));
  const units = new Map(substances.map(substance => [substance.id, substance.unit]));
  const byName = new Map<string, { name: string; count: number; quantity: number; unit: string }>();

  activeConsumptions.forEach(entry => {
    const name = entry.substanceId ? labels.get(entry.substanceId) ?? entry.substance : entry.substance;
    const key = name?.trim() || "Substance non précisée";
    const unit = entry.unit || (entry.substanceId ? units.get(entry.substanceId) : "") || "";
    const previous = byName.get(key) ?? { name: key, count: 0, quantity: 0, unit };
    const numericQuantity = Number.parseFloat(String(entry.quantity).replace(",", "."));
    byName.set(key, {
      ...previous,
      count: previous.count + 1,
      quantity: Number.isFinite(numericQuantity) ? previous.quantity + numericQuantity : previous.quantity,
      unit: previous.unit || unit,
    });
  });

  return [...byName.values()].sort((a, b) => b.count - a.count);
}

export function topCounts(entries: ConsumptionEntry[], field: "trigger" | "strategyTried", start: Date, end: Date) {
  const counts = new Map<string, number>();
  entries
    .filter(entry => consumptionInPeriod(entry, start, end))
    .forEach(entry => {
      const value = entry[field]?.trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
}

export function buildTherapeuticExportHtml(input: TherapeuticExportInput) {
  const { start, end } = resolveExportPeriod(input.period, input.customStart, input.customEnd);
  const periodConsumptions = input.consumptions.filter(entry => consumptionInPeriod(entry, start, end));
  const consumptionRows = summarizeBySubstance(input.consumptions, input.substances, start, end);
  const cravingOnly = periodConsumptions.filter(entry => entry.type === "envie_seulement");
  const periodEmotions = input.emotions.filter(entry => dateInPeriod(entry.date, start, end));
  const markedDates = getMarkedDates(input.dayEntries, input.consumptions)
    .filter(date => isWithinInterval(parseLocalDate(date), { start, end }));
  const abstinentDays = markedDates.filter(date => isConsumptionFreeStatus(getDayStatus(date, input.dayEntries, input.consumptions)));
  const triggers = topCounts(input.consumptions, "trigger", start, end);
  const strategies = topCounts(input.consumptions, "strategyTried", start, end);
  const moodAverage = average(periodEmotions.map(entry => entry.mood));
  const anxietyAverage = average(periodEmotions.map(entry => entry.anxiety));
  const sleepAverage = average(periodEmotions.map(entry => entry.sleepQuality));
  const energyAverage = average(periodEmotions.map(entry => entry.energy));

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Export thérapeutique CleanPath</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #203027; margin: 32px; line-height: 1.5; }
    h1 { font-size: 28px; font-weight: 500; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #d8ddd5; padding-bottom: 6px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #d8ddd5; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef3ec; }
    .notice { background: #f4f5f1; border: 1px solid #d8ddd5; padding: 12px; border-radius: 6px; margin: 18px 0; }
    .muted { color: #69756d; }
    .print { margin-bottom: 18px; }
    @media print { .print { display: none; } body { margin: 18mm; } }
  </style>
</head>
<body>
  <button class="print" onclick="window.print()">Enregistrer ou imprimer en PDF</button>
  <h1>Export thérapeutique CleanPath</h1>
  <p class="muted">Période du ${format(start, "d MMMM yyyy", { locale: fr })} au ${format(end, "d MMMM yyyy", { locale: fr })}</p>
  <div class="notice">Ce document contient des informations déclarées par l'utilisateur. Il ne constitue pas un diagnostic et ne remplace pas l'avis d'un professionnel de santé.</div>
  ${input.sections.consumptions ? section("Évolution des consommations par substance", table(["Substance", "Événements", "Quantité déclarée"], consumptionRows.map(row => [row.name, String(row.count), row.quantity > 0 ? `${formatNumber(row.quantity)} ${escapeHtml(row.unit)}` : "Non chiffrée"]))) : ""}
  ${input.sections.abstinentDays ? section("Jours sans consommation", `<p>${abstinentDays.length} jour${abstinentDays.length > 1 ? "s" : ""} sans consommation renseigné${abstinentDays.length > 1 ? "s" : ""} sur la période.</p>`) : ""}
  ${input.sections.cravings ? section("Envies surmontées", `<p>${cravingOnly.length} envie${cravingOnly.length > 1 ? "s" : ""} surmontée${cravingOnly.length > 1 ? "s" : ""} sans consommation.</p>`) : ""}
  ${input.sections.wellbeing ? section("Humeur, stress, sommeil et énergie", table(["Indicateur", "Moyenne"], [["Humeur", score(moodAverage)], ["Anxiété / stress", score(anxietyAverage)], ["Sommeil", score(sleepAverage)], ["Énergie", score(energyAverage)]])) : ""}
  ${input.sections.triggers ? section("Déclencheurs fréquents", listCounts(triggers)) : ""}
  ${input.sections.strategies ? section("Stratégies essayées", listCounts(strategies, "Aucune stratégie renseignée sur la période.")) : ""}
  ${input.sections.goals ? section("Objectifs et suivis", table(["Produit", "Objectif", "Plafond"], input.substances.filter(s => !s.archivedAt).map(s => [s.name, objectiveLabel(s.objective), [s.dailyLimit && `${s.dailyLimit}/${s.unit}/jour`, s.weeklyLimit && `${s.weeklyLimit}/${s.unit}/semaine`].filter(Boolean).join(" · ") || "Non défini"]))) : ""}
  ${input.sections.personalSummary ? section("Résumé personnel", paragraph(input.personalSummary || "Non renseigné.")) : ""}
  ${input.sections.appointmentNotes ? section("Notes préparatoires pour le rendez-vous", paragraph(input.appointmentNotes || "Non renseigné.")) : ""}
</body>
</html>`;
}

function parseLocalDate(date: string) {
  return parseISO(`${date.slice(0, 10)}T00:00:00`);
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function score(value: number | null) {
  return value === null ? "Non calculable" : `${value.toFixed(1).replace(".", ",")} / 10`;
}

function formatNumber(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(".", ",");
}

function objectiveLabel(value: SubstanceTracking["objective"]) {
  if (value === "abstinence") return "Abstinence";
  if (value === "reduction") return "Réduction";
  return "Stabilisation";
}

function section(title: string, content: string) {
  return `<h2>${escapeHtml(title)}</h2>${content}`;
}

function paragraph(text: string) {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
}

function listCounts(items: Array<{ label: string; count: number }>, empty = "Aucun déclencheur renseigné sur la période.") {
  if (items.length === 0) return `<p>${escapeHtml(empty)}</p>`;
  return `<ul>${items.map(item => `<li>${escapeHtml(item.label)} (${item.count})</li>`).join("")}</ul>`;
}

function table(headers: string[], rows: string[][]) {
  if (rows.length === 0) return "<p>Aucune donnée renseignée sur la période.</p>";
  return `<table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
