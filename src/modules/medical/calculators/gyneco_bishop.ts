/**
 * Score de Bishop pour la maturation cervicale
 * Utilisé pour prédire le succès d'un déclenchement du travail
 */

export interface BishopScoreParams {
  dilation: number;      // Dilatation cervicale (cm) 0-10
  effacement: number;    // Effacement cervical (%) 0-100
  station: number;       // Position de la présentation (-3 à +3)
  consistency: 'firm' | 'medium' | 'soft'; // Consistance du col
  position: 'posterior' | 'mid' | 'anterior'; // Position du col
}

export interface BishopScoreResult {
  totalScore: number;    // Score total de Bishop (0-13)
  interpretation: string;
  successProbability: number; // Probabilité de succès du déclenchement (%)
  recommendations: string[];
  componentScores: {
    dilation: number;
    effacement: number;
    station: number;
    consistency: number;
    position: number;
  };
}

/**
 * Calcule le score de Bishop
 */
export function bishopScore(params: BishopScoreParams): BishopScoreResult {
  // Points pour la dilatation
  let dilationPoints = 0;
  if (params.dilation >= 4) dilationPoints = 3;
  else if (params.dilation >= 2) dilationPoints = 2;
  else if (params.dilation > 0) dilationPoints = 1;
  
  // Points pour l'effacement
  let effacementPoints = 0;
  if (params.effacement >= 80) effacementPoints = 3;
  else if (params.effacement >= 60) effacementPoints = 2;
  else if (params.effacement >= 40) effacementPoints = 1;
  else if (params.effacement >= 20) effacementPoints = 0.5;
  
  // Points pour la station
  let stationPoints = 0;
  if (params.station >= 2) stationPoints = 3;
  else if (params.station >= 1) stationPoints = 2;
  else if (params.station >= 0) stationPoints = 1;
  else if (params.station >= -1) stationPoints = 0;
  else stationPoints = -1; // -2 ou -3
  
  // Points pour la consistance
  let consistencyPoints = 0;
  switch (params.consistency) {
    case 'soft':
      consistencyPoints = 2;
      break;
    case 'medium':
      consistencyPoints = 1;
      break;
    case 'firm':
      consistencyPoints = 0;
      break;
  }
  
  // Points pour la position
  let positionPoints = 0;
  switch (params.position) {
    case 'anterior':
      positionPoints = 2;
      break;
    case 'mid':
      positionPoints = 1;
      break;
    case 'posterior':
      positionPoints = 0;
      break;
  }
  
  // Calcul du score total
  const totalScore = Math.round(
    dilationPoints + effacementPoints + stationPoints + consistencyPoints + positionPoints
  );
  
  // Interprétation
  let interpretation = '';
  let successProbability = 0;
  
  if (totalScore >= 8) {
    interpretation = 'Col favorable - Forte probabilité de succès du déclenchement';
    successProbability = 85;
  } else if (totalScore >= 6) {
    interpretation = 'Col intermédiaire - Probabilité modérée de succès';
    successProbability = 65;
  } else if (totalScore >= 4) {
    interpretation = 'Col défavorable - Probabilité faible de succès';
    successProbability = 35;
  } else {
    interpretation = 'Col très défavorable - Maturation cervicale recommandée avant déclenchement';
    successProbability = 15;
  }
  
  // Recommandations
  const recommendations: string[] = [];
  
  if (totalScore < 6) {
    recommendations.push('Considérer une maturation cervicale (prostaglandines, ballonnet)');
    recommendations.push('Réévaluation après 24h de maturation');
  }
  
  if (totalScore >= 6) {
    recommendations.push('Déclenchement par oxytocine possible');
    recommendations.push('Surveillance du travail recommandée');
  }
  
  if (params.station < 0) {
    recommendations.push('Tête haute - surveillance particulière de la descente');
  }
  
  return {
    totalScore,
    interpretation,
    successProbability,
    recommendations,
    componentScores: {
      dilation: dilationPoints,
      effacement: effacementPoints,
      station: stationPoints,
      consistency: consistencyPoints,
      position: positionPoints
    }
  };
}

/**
 * Score de Bishop modifié pour les nullipares
 */
export function modifiedBishopScore(
  params: BishopScoreParams,
  isNulliparous: boolean
): BishopScoreResult {
  
  const standardScore = bishopScore(params);
  
  // Ajustement pour les nullipares
  if (isNulliparous) {
    if (standardScore.totalScore < 6) {
      standardScore.successProbability = Math.max(0, standardScore.successProbability - 10);
      standardScore.interpretation += ' (Nullipare - succès moins probable)';
    }
  } else {
    // Multipare
    if (standardScore.totalScore >= 4) {
      standardScore.successProbability = Math.min(100, standardScore.successProbability + 10);
    }
  }
  
  return standardScore;
}

/**
 * Prédit la durée du travail
 */
export function predictLaborDuration(bishopScore: number, isNulliparous: boolean): {
  firstStage: { min: number; max: number; average: number }; // minutes
  secondStage: { min: number; max: number; average: number }; // minutes
  total: { min: number; max: number; average: number }; // minutes
} {
  
  let firstStageAvg, secondStageAvg;
  
  if (isNulliparous) {
    // Nullipares
    if (bishopScore >= 8) {
      firstStageAvg = 360; // 6 heures
      secondStageAvg = 60; // 1 heure
    } else if (bishopScore >= 6) {
      firstStageAvg = 480; // 8 heures
      secondStageAvg = 90; // 1.5 heures
    } else if (bishopScore >= 4) {
      firstStageAvg = 600; // 10 heures
      secondStageAvg = 120; // 2 heures
    } else {
      firstStageAvg = 720; // 12 heures
      secondStageAvg = 180; // 3 heures
    }
  } else {
    // Multipares
    if (bishopScore >= 8) {
      firstStageAvg = 240; // 4 heures
      secondStageAvg = 30; // 0.5 heures
    } else if (bishopScore >= 6) {
      firstStageAvg = 360; // 6 heures
      secondStageAvg = 45; // 0.75 heures
    } else if (bishopScore >= 4) {
      firstStageAvg = 480; // 8 heures
      secondStageAvg = 60; // 1 heure
    } else {
      firstStageAvg = 600; // 10 heures
      secondStageAvg = 90; // 1.5 heures
    }
  }
  
  // Calcul des fourchettes
  const firstStage = {
    min: Math.round(firstStageAvg * 0.7),
    max: Math.round(firstStageAvg * 1.5),
    average: firstStageAvg
  };
  
  const secondStage = {
    min: Math.round(secondStageAvg * 0.5),
    max: Math.round(secondStageAvg * 2),
    average: secondStageAvg
  };
  
  const total = {
    min: firstStage.min + secondStage.min,
    max: firstStage.max + secondStage.max,
    average: firstStageAvg + secondStageAvg
  };
  
  return { firstStage, secondStage, total };
}
