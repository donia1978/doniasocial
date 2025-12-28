import type { CalculatorSpec } from "./types";

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

// Proportion score (0..5) + intensity (0..3) => total (0..8)
// We store proportion as % positive cells; intensity as 0..3
function proportionScore(percent: number): number {
  const p = clamp(percent, 0, 100);
  if (p === 0) return 0;
  if (p < 1) return 1;         // <1%
  if (p <= 10) return 2;       // 1-10%
  if (p <= 33) return 3;       // 11-33%
  if (p <= 66) return 4;       // 34-66%
  return 5;                    // 67-100%
}

export const allredErPr: CalculatorSpec = {
  id: "anapathe_allred_er_pr_v1",
  name: "Allred Score (ER/PR)",
  specialty: "anapathe",
  version: "1.0.0",
  disclaimer: "Aide au calcul uniquement. Toute interprétation clinique/pathologique doit être validée par un anatomo-pathologiste.",
  inputs: [
    { key: "percent_positive", label: "% cellules positives", type: "number", unit: "%", min: 0, max: 100, step: 0.1, required: true },
    { key: "intensity", label: "Intensité (0-3)", type: "number", min: 0, max: 3, step: 1, required: true }
  ],
  compute: (input) => {
    const percent = Number(input.percent_positive ?? 0);
    const intensity = clamp(Number(input.intensity ?? 0), 0, 3);
    const ps = proportionScore(percent);
    const is = intensity;
    const total = ps + is;
    return {
      proportion_score: ps,
      intensity_score: is,
      allred_total: total,
      note: "Score total = Proportion + Intensité (0-8). À valider selon protocole labo."
    };
  }
};
