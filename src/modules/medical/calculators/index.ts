import type { CalculatorSpec } from "./types";
import { allredErPr } from "./anapathe_allred";
import { her2Ihc } from "./anapathe_her2";
import { ki67Index } from "./anapathe_ki67";
import { egfrCkdEpi2021 } from "./nephro_egfr_ckdepi2021";

// Re-export the standalone calculator functions for direct use
export { crclCockcroftGault, calculateBSA, adjustDosageForRenalFunction } from "./nephro_cockcroft_gault";
export { akiKdigo2012, calculatePostOpAKIRisk } from "./nephro_aki_kdigo_2012";
export { dueDateNaegele, adjustDueDateByUltrasound, formatDueDateDisplay, calculateFertilityWindow } from "./gyneco_due_date_naegele";
export { bishopScore, modifiedBishopScore, predictLaborDuration } from "./gyneco_bishop";
export { pphRisk, estimateBloodLoss, calculateTransfusionNeeds, calculateShockIndex } from "./gyneco_pph_risk";

// Only include calculators that conform to CalculatorSpec interface
export const DONIA_MEDICAL_CALCULATORS: CalculatorSpec[] = [
  allredErPr,
  her2Ihc,
  ki67Index,
  egfrCkdEpi2021,
];

export function getCalculatorsBySpecialty(s: CalculatorSpec["specialty"]) {
  return DONIA_MEDICAL_CALCULATORS.filter(c => c.specialty === s);
}
