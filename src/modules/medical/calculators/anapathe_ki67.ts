import type { CalculatorSpec } from "./types";

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

export const ki67Index: CalculatorSpec = {
  id: "anapathe_ki67_v1",
  name: "Ki-67 Index (%)",
  specialty: "anapathe",
  version: "1.0.0",
  disclaimer: "Aide au calcul. Les seuils d’interprétation dépendent du contexte tumoral et des guidelines.",
  inputs: [
    { key: "positive_cells", label: "Cellules positives", type: "number", min: 0, step: 1, required: true },
    { key: "total_cells", label: "Cellules totales", type: "number", min: 1, step: 1, required: true }
  ],
  compute: (input) => {
    const pos = clamp(Number(input.positive_cells ?? 0), 0, 1e12);
    const tot = clamp(Number(input.total_cells ?? 1), 1, 1e12);
    const pct = (pos / tot) * 100;
    return { ki67_percent: Number(pct.toFixed(2)) };
  }
};
