/**
 * Évaluation du risque d'Hémorragie du Post-Partum (HPP)
 * Postpartum Hemorrhage Risk Assessment
 */

export interface PPHRiskParams {
  // Facteurs obstétricaux
  parity: number;
  previousPPH?: boolean;
  previousCesarean?: boolean;
  multiplePregnancy?: boolean;
  polyhydramnios?: boolean;
  largeFetus?: boolean;
  
  // Facteurs maternels
  age?: number;
  bmi?: number;
  anemia?: boolean;
  coagulationDisorder?: boolean;
  hypertension?: boolean;
  
  // Facteurs du travail
  prolongedLabor?: boolean;
  oxytocinUse?: boolean;
  instrumentalDelivery?: boolean;
  cesareanDelivery?: boolean;
  retainedPlacenta?: boolean;
  
  // Mesures actuelles
  bloodLoss?: number;
  hemoglobin?: number;
  vitalSigns?: {
    systolicBP?: number;
    diastolicBP?: number;
    heartRate?: number;
  };
}

export interface PPHRiskResult {
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number;
  probability: number;
  recommendations: string[];
  warningSigns: string[];
  immediateActions: string[];
  componentScores: {
    obstetric: number;
    maternal: number;
    labor: number;
    current: number;
  };
}

export function pphRisk(params: PPHRiskParams): PPHRiskResult {
  let score = 0;
  const componentScores = { obstetric: 0, maternal: 0, labor: 0, current: 0 };
  
  // Facteurs obstétricaux
  if (params.parity >= 5) {
    score += 2;
    componentScores.obstetric += 2;
  } else if (params.parity >= 3) {
    score += 1;
    componentScores.obstetric += 1;
  }
  
  if (params.previousPPH) {
    score += 3;
    componentScores.obstetric += 3;
  }
  
  if (params.previousCesarean) {
    score += 2;
    componentScores.obstetric += 2;
  }
  
  if (params.multiplePregnancy) {
    score += 2;
    componentScores.obstetric += 2;
  }
  
  if (params.polyhydramnios) {
    score += 1;
    componentScores.obstetric += 1;
  }
  
  if (params.largeFetus) {
    score += 1;
    componentScores.obstetric += 1;
  }
  
  // Facteurs maternels
  if (params.age && params.age > 35) {
    score += 1;
    componentScores.maternal += 1;
  }
  
  if (params.bmi && params.bmi > 30) {
    score += 1;
    componentScores.maternal += 1;
  }
  
  if (params.anemia) {
    score += 2;
    componentScores.maternal += 2;
  }
  
  if (params.coagulationDisorder) {
    score += 3;
    componentScores.maternal += 3;
  }
  
  if (params.hypertension) {
    score += 1;
    componentScores.maternal += 1;
  }
  
  // Facteurs du travail
  if (params.prolongedLabor) {
    score += 2;
    componentScores.labor += 2;
  }
  
  if (params.oxytocinUse) {
    score += 1;
    componentScores.labor += 1;
  }
  
  if (params.instrumentalDelivery) {
    score += 2;
    componentScores.labor += 2;
  }
  
  if (params.cesareanDelivery) {
    score += 3;
    componentScores.labor += 3;
  }
  
  if (params.retainedPlacenta) {
    score += 3;
    componentScores.labor += 3;
  }
  
  // État actuel
  if (params.bloodLoss && params.bloodLoss > 500) {
    score += 3;
    componentScores.current += 3;
  }
  
  if (params.bloodLoss && params.bloodLoss > 1000) {
    score += 2;
    componentScores.current += 2;
  }
  
  if (params.hemoglobin && params.hemoglobin < 8) {
    score += 2;
    componentScores.current += 2;
  }
  
  if (params.vitalSigns) {
    if (params.vitalSigns.systolicBP && params.vitalSigns.systolicBP < 90) {
      score += 2;
      componentScores.current += 2;
    }
    if (params.vitalSigns.heartRate && params.vitalSigns.heartRate > 120) {
      score += 2;
      componentScores.current += 2;
    }
  }
  
  // Détermination du niveau de risque
  let riskLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low';
  let probability = 0;
  
  if (score >= 15) {
    riskLevel = 'very_high';
    probability = 40;
  } else if (score >= 10) {
    riskLevel = 'high';
    probability = 25;
  } else if (score >= 5) {
    riskLevel = 'medium';
    probability = 10;
  } else {
    riskLevel = 'low';
    probability = 2;
  }
  
  // Recommandations
  const recommendations: string[] = [];
  const warningSigns: string[] = [];
  const immediateActions: string[] = [];
  
  if (riskLevel === 'low') {
    recommendations.push("Surveillance standard du post-partum");
    recommendations.push("Monitoring des saignements pendant 2 heures");
  } else if (riskLevel === 'medium') {
    recommendations.push("Surveillance rapprochée (toutes les 15 minutes)");
    recommendations.push("Voie veineuse périphérique");
    recommendations.push("Bilan sanguin: NFS, coagulation");
    warningSigns.push("Saignement > 500 mL");
    warningSigns.push("Pâleur, tachycardie");
  } else if (riskLevel === 'high') {
    recommendations.push("Préparation pour transfusion");
    recommendations.push("Oxytocine IV systématique");
    recommendations.push("Bilan complet: NFS, coagulation, GDS");
    recommendations.push("Pré-alerte banque du sang");
    warningSigns.push("Saignement > 1000 mL");
    warningSigns.push("Hypotension, tachycardie > 120");
    warningSigns.push("Altération de l'état de conscience");
    immediateActions.push("Appeler l'équipe d'urgence obstétricale");
    immediateActions.push("Poser 2 voies veineuses de gros calibre");
    immediateActions.push("Débuter la réanimation liquidienne");
  } else if (riskLevel === 'very_high') {
    recommendations.push("Transfert immédiat en salle de réveil/USI");
    recommendations.push("Transfusion en attente des résultats");
    recommendations.push("Évaluation pour geste chirurgical (embolisation, hysterectomy)");
    warningSigns.push("Saignement > 1500 mL");
    warningSigns.push("Choc hémodynamique");
    warningSigns.push("Coagulopathie");
    immediateActions.push("Activation du protocole HPP majeure");
    immediateActions.push("Transfusion O- en attendant la groupage");
    immediateActions.push("Préparation au bloc opératoire");
  }
  
  if (params.retainedPlacenta) {
    immediateActions.push("Décollement placentaire manuel immédiat");
  }
  
  if (params.coagulationDisorder) {
    recommendations.push("Consultation hématologique urgente");
    immediateActions.push("Préparer les facteurs de coagulation");
  }
  
  return {
    riskLevel,
    riskScore: score,
    probability,
    recommendations,
    warningSigns,
    immediateActions,
    componentScores
  };
}

export function estimateBloodLoss(
  method: 'visual' | 'gravimetric' | 'volumetric',
  measurements: any
): number {
  switch (method) {
    case 'visual':
      const visualEstimate = measurements.estimate || 0;
      return Math.round(visualEstimate * 1.5);
    case 'gravimetric':
      const dryWeight = measurements.dryWeight || 0;
      const wetWeight = measurements.wetWeight || 0;
      const bloodWeight = wetWeight - dryWeight;
      return Math.round(bloodWeight);
    case 'volumetric':
      return measurements.volume || 0;
    default:
      return 0;
  }
}

export function calculateTransfusionNeeds(
  bloodLoss: number,
  hemoglobin: number,
  weight: number
): {
  packedCells: number;
  freshFrozenPlasma: number;
  platelets: number;
  cryoprecipitate: number;
} {
  const bloodVolume = weight * 70;
  const lossPercentage = (bloodLoss / bloodVolume) * 100;
  
  let packedCells = 0;
  let freshFrozenPlasma = 0;
  let platelets = 0;
  let cryoprecipitate = 0;
  
  if (lossPercentage > 40 || hemoglobin < 7) {
    packedCells = Math.ceil(bloodLoss / 300);
    freshFrozenPlasma = Math.ceil(packedCells * 0.7);
    platelets = Math.ceil(packedCells * 0.5);
    cryoprecipitate = Math.ceil(packedCells * 0.2);
  } else if (lossPercentage > 30 || hemoglobin < 8) {
    packedCells = Math.ceil(bloodLoss / 350);
    freshFrozenPlasma = Math.ceil(packedCells * 0.5);
  } else if (lossPercentage > 20 || hemoglobin < 10) {
    packedCells = Math.ceil(bloodLoss / 400);
  }
  
  return {
    packedCells,
    freshFrozenPlasma,
    platelets,
    cryoprecipitate
  };
}

export function calculateShockIndex(
  heartRate: number,
  systolicBP: number
): { index: number; severity: 'normal' | 'mild' | 'moderate' | 'severe' } {
  if (systolicBP === 0) {
    return { index: Infinity, severity: 'severe' };
  }
  
  const shockIndex = heartRate / systolicBP;
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  
  if (shockIndex > 1.2) {
    severity = 'severe';
  } else if (shockIndex > 1.0) {
    severity = 'moderate';
  } else if (shockIndex > 0.9) {
    severity = 'mild';
  }
  
  return { index: Math.round(shockIndex * 100) / 100, severity };
}
