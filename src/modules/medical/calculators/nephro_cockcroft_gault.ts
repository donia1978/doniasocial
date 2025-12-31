/**
 * Calcul de la Clairance de la Créatinine selon Cockcroft-Gault
 * Formule: CrCl (mL/min) = ((140 - âge) × poids × k) / créatinine sérique
 * où k = 1.23 pour homme, 1.04 pour femme
 */

export interface CockcroftGaultParams {
  age: number;        // âge en années
  weight: number;     // poids en kg
  creatinine: number; // créatinine sérique en μmol/L
  gender: 'male' | 'female';
  bsa?: number;       // surface corporelle en m² (optionnel pour ajustement)
}

export interface CockcroftGaultResult {
  crcl: number;       // Clairance créatinine (mL/min)
  adjustedCrcl?: number; // Clairance ajustée par surface corporelle
  interpretation: string;
  formula: string;
}

/**
 * Calcule la clairance de la créatinine selon Cockcroft-Gault
 */
export function crclCockcroftGault(params: CockcroftGaultParams): CockcroftGaultResult {
  const { age, weight, creatinine, gender, bsa } = params;
  
  // Conversion de la créatinine de μmol/L à mg/dL si nécessaire
  // 1 mg/dL = 88.4 μmol/L
  const creatinineMgDl = creatinine / 88.4;
  
  // Facteur k selon le sexe
  const k = gender === 'male' ? 1.23 : 1.04;
  
  // Calcul de base
  let crcl = ((140 - age) * weight * k) / creatinineMgDl;
  
  // Ajustement par surface corporelle si fourni
  let adjustedCrcl;
  if (bsa) {
    const standardBSA = 1.73; // surface corporelle standard en m²
    adjustedCrcl = crcl * (standardBSA / bsa);
  }
  
  // Interprétation
  let interpretation = '';
  const finalValue = adjustedCrcl || crcl;
  
  if (finalValue >= 90) {
    interpretation = 'Fonction rénale normale';
  } else if (finalValue >= 60) {
    interpretation = 'Insuffisance rénale légère';
  } else if (finalValue >= 30) {
    interpretation = 'Insuffisance rénale modérée';
  } else if (finalValue >= 15) {
    interpretation = 'Insuffisance rénale sévère';
  } else {
    interpretation = 'Insuffisance rénale terminale';
  }
  
  return {
    crcl: Math.round(crcl * 10) / 10,
    adjustedCrcl: adjustedCrcl ? Math.round(adjustedCrcl * 10) / 10 : undefined,
    interpretation,
    formula: 'CrCl = ((140 - âge) × poids × k) / créatinine'
  };
}

/**
 * Calcule la surface corporelle selon la formule de DuBois & DuBois
 */
export function calculateBSA(height: number, weight: number): number {
  // Formule de DuBois & DuBois: BSA (m²) = 0.007184 × taille^0.725 × poids^0.425
  // taille en cm, poids en kg
  return 0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425);
}

/**
 * Ajuste la posologie selon la fonction rénale
 */
export function adjustDosageForRenalFunction(
  normalDose: number,
  crcl: number,
  drugCategory: 'A' | 'B' | 'C' | 'D'
): { adjustedDose: number; frequency: string; comments: string } {
  
  let adjustmentFactor = 1;
  let frequency = 'Toutes les 24h';
  let comments = '';
  
  if (crcl >= 50) {
    adjustmentFactor = 1;
    frequency = 'Dose standard';
  } else if (crcl >= 30) {
    adjustmentFactor = 0.75;
    frequency = 'Toutes les 24h';
    comments = 'Réduction de 25%';
  } else if (crcl >= 10) {
    adjustmentFactor = 0.5;
    frequency = 'Toutes les 48h';
    comments = 'Réduction de 50%';
  } else {
    adjustmentFactor = 0.25;
    frequency = 'Toutes les 72h';
    comments = 'Réduction de 75% ou hémodialyse';
  }
  
  // Ajustements spécifiques selon la catégorie du médicament
  switch (drugCategory) {
    case 'A': // Pas d'ajustement nécessaire
      break;
    case 'B': // Ajustement modéré
      if (crcl < 30) adjustmentFactor *= 0.8;
      break;
    case 'C': // Ajustement important
      if (crcl < 50) adjustmentFactor *= 0.7;
      if (crcl < 30) adjustmentFactor *= 0.6;
      break;
    case 'D': // Contre-indiqué en cas d'insuffisance rénale
      if (crcl < 30) {
        adjustmentFactor = 0;
        comments = 'Contre-indiqué si CrCl < 30 mL/min';
      }
      break;
  }
  
  return {
    adjustedDose: Math.round(normalDose * adjustmentFactor * 10) / 10,
    frequency,
    comments
  };
}
