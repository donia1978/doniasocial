import type { CalculatorSpec } from "./types";

// CKD-EPI 2021 creatinine equation (adults). Returns eGFR mL/min/1.73m².
// Implementation uses published constants (kappa, alpha, sex factor).
function egfrCkdEpi2021Compute(scr_mg_dl: number, age: number, sex: "female" | "male") {
  const scr = Math.max(0.01, scr_mg_dl);
  const a = Math.max(18, age);
  const isFemale = sex === "female";

  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;

  const minPart = Math.pow(Math.min(scr / kappa, 1), alpha);
  const maxPart = Math.pow(Math.max(scr / kappa, 1), -1.200);
  const sexFactor = isFemale ? 1.012 : 1.0;

  // 142 * min(...)^alpha * max(...)^-1.200 * 0.9938^age * sexFactor
  const egfr = 142 * minPart * maxPart * Math.pow(0.9938, a) * sexFactor;
  return egfr;
}

export const egfrCkdEpi2021: CalculatorSpec = {
  id: "nephro_egfr_ckdepi2021_v1",
  name: "eGFR CKD-EPI 2021 (créatinine)",
  specialty: "nephro",
  version: "1.0.0",
  disclaimer:
    "Aide au calcul. Interprétation clinique à valider. Utiliser unités correctes (mg/dL).",
  inputs: [
    {
      key: "scr_mg_dl",
      label: "Créatinine sérique",
      type: "number",
      unit: "mg/dL",
      min: 0.01,
      step: 0.01,
      required: true
    },
    {
      key: "age_years",
      label: "Âge",
      type: "number",
      unit: "années",
      min: 18,
      max: 120,
      step: 1,
      required: true
    },
    {
      key: "sex",
      label: "Sexe",
      type: "select",
      options: [
        { label: "Femme", value: "female" },
        { label: "Homme", value: "male" }
      ],
      required: true
    }
  ],
  compute: (input) => {
    const scr = Number(input.scr_mg_dl);
    const age = Number(input.age_years);
    const sex = (String(input.sex) === "female" ? "female" : "male") as "female" | "male";

    const egfr = egfrCkdEpi2021Compute(scr, age, sex);
    return {
      egfr_ml_min_1_73m2: Number(egfr.toFixed(1)),
      note: "Équation CKD-EPI 2021 (sans race)."
    };
  }
};
