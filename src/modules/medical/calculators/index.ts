import type { CalculatorSpec } from "./types";
import { allredErPr } from "./anapathe_allred";
import { her2Ihc } from "./anapathe_her2";
import { ki67Index } from "./anapathe_ki67";

import { egfrCkdEpi2021 } from "./nephro_egfr_ckdepi2021";
import { crclCockcroftGault } from "./nephro_cockcroft_gault";
import { akiKdigo2012 } from "./nephro_aki_kdigo_2012";

import { dueDateNaegele } from "./gyneco_due_date_naegele";
import { bishopScore } from "./gyneco_bishop";
import { pphRisk } from "./gyneco_pph_risk";

export const DONIA_MEDICAL_CALCULATORS: CalculatorSpec[] = [
  allredErPr,
  her2Ihc,
  ki67Index,
  egfrCkdEpi2021,
  crclCockcroftGault,
  akiKdigo2012,
  dueDateNaegele,
  bishopScore,
  pphRisk
];

export function getCalculatorsBySpecialty(s: CalculatorSpec["specialty"]) {
  return DONIA_MEDICAL_CALCULATORS.filter(c => c.specialty === s);
}
