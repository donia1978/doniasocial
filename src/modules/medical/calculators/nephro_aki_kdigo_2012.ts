/**
 * Classification AKI selon KDIGO 2012
 * Acute Kidney Injury - Kidney Disease Improving Global Outcomes 2012
 */

export interface AKIParams {
  baselineCreatinine?: number; // Créatinine de base (μmol/L)
  currentCreatinine: number;   // Créatinine actuelle (μmol/L)
  urineOutput?: number;        // Diurèse (mL/kg/h)
  timeWindow?: number;         // Fenêtre temporelle (heures)
  age?: number;               // Âge (années)
}

export interface AKIResult {
  stage: 0 | 1 | 2 | 3;
  criteria: string[];
  classification: 'Risk' | 'Injury' | 'Failure' | 'Loss' | 'ESKD';
  recommendations: string[];
}

/**
 * Détermine le stade AKI selon KDIGO 2012
 */
export function akiKdigo2012(params: AKIParams): AKIResult {
  const { baselineCreatinine, currentCreatinine, urineOutput, timeWindow = 48 } = params;
  
  const criteria: string[] = [];
  let stage: 0 | 1 | 2 | 3 = 0;
  let classification: 'Risk' | 'Injury' | 'Failure' | 'Loss' | 'ESKD' = 'Risk';
  
  // Critère 1: Augmentation de la créatinine sérique
  if (baselineCreatinine) {
    const increase = (currentCreatinine - baselineCreatinine) / baselineCreatinine;
    
    if (currentCreatinine >= 354 && increase >= 0.3) {
      criteria.push("Créatinine ≥ 354 μmol/L avec augmentation ≥ 0.3 mg/dL (≥ 26.5 μmol/L)");
      stage = (Math.max(stage, 1) as 0 | 1 | 2 | 3);
    }
    
    if (increase >= 2.0 && increase < 3.0) {
      criteria.push("Créatinine 2.0-2.9 × baseline");
      stage = (Math.max(stage, 2) as 0 | 1 | 2 | 3);
    }
    
    if (increase >= 3.0) {
      criteria.push("Créatinine ≥ 3.0 × baseline");
      stage = (Math.max(stage, 3) as 0 | 1 | 2 | 3);
    }
    
    if (currentCreatinine >= 354) {
      criteria.push("Créatinine ≥ 354 μmol/L");
      stage = (Math.max(stage, 3) as 0 | 1 | 2 | 3);
    }
  }
  
  // Critère 2: Diurèse
  if (urineOutput !== undefined) {
    if (urineOutput < 0.5 && timeWindow >= 6) {
      criteria.push("Diurèse < 0.5 mL/kg/h pendant ≥ 6h");
      stage = (Math.max(stage, 1) as 0 | 1 | 2 | 3);
    }
    
    if (urineOutput < 0.5 && timeWindow >= 12) {
      criteria.push("Diurèse < 0.5 mL/kg/h pendant ≥ 12h");
      stage = (Math.max(stage, 2) as 0 | 1 | 2 | 3);
    }
    
    if (urineOutput < 0.3 && timeWindow >= 24) {
      criteria.push("Diurèse < 0.3 mL/kg/h pendant ≥ 24h");
      stage = (Math.max(stage, 3) as 0 | 1 | 2 | 3);
    }
    
    if (urineOutput === 0 && timeWindow >= 12) {
      criteria.push("Anurie pendant ≥ 12h");
      stage = (Math.max(stage, 3) as 0 | 1 | 2 | 3);
    }
  }
  
  // Déterminer la classification RIFLE
  switch (stage) {
    case 1:
      classification = 'Risk';
      break;
    case 2:
      classification = 'Injury';
      break;
    case 3:
      classification = 'Failure';
      break;
  }
  
  // Recommandations selon le stade
  const recommendations: string[] = [];
  
  if (stage >= 1) {
    recommendations.push("Surveillance étroite de la fonction rénale");
    recommendations.push("Évaluer le volume et l'état d'hydratation");
    recommendations.push("Réviser la médication néphrotoxique");
  }
  
  if (stage >= 2) {
    recommendations.push("Consultation néphrologique");
    recommendations.push("Ajustement des doses selon fonction rénale");
    recommendations.push("Surveillance biologique rapprochée");
  }
  
  if (stage >= 3) {
    recommendations.push("Évaluation pour épuration extrarénale");
    recommendations.push("Prise en charge en unité spécialisée");
    recommendations.push("Correction des déséquilibres hydro-électrolytiques");
  }
  
  return {
    stage,
    criteria,
    classification,
    recommendations
  };
}

/**
 * Calcule le risque d'AKI post-opératoire
 */
export function calculatePostOpAKIRisk(
  surgeryType: 'cardiac' | 'major' | 'minor',
  comorbidities: string[],
  age: number,
  egfr: number
): { riskScore: number; riskLevel: 'low' | 'medium' | 'high' } {
  
  let score = 0;
  
  // Type de chirurgie
  switch (surgeryType) {
    case 'cardiac':
      score += 3;
      break;
    case 'major':
      score += 2;
      break;
    case 'minor':
      score += 1;
      break;
  }
  
  // Comorbidités
  if (comorbidities.includes('diabetes')) score += 2;
  if (comorbidities.includes('hypertension')) score += 1;
  if (comorbidities.includes('heart_failure')) score += 2;
  if (comorbidities.includes('liver_disease')) score += 1;
  
  // Âge
  if (age > 75) score += 2;
  else if (age > 65) score += 1;
  
  // Fonction rénale
  if (egfr < 30) score += 3;
  else if (egfr < 60) score += 2;
  else if (egfr < 90) score += 1;
  
  // Niveau de risque
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (score >= 6) riskLevel = 'high';
  else if (score >= 3) riskLevel = 'medium';
  
  return {
    riskScore: score,
    riskLevel
  };
}
