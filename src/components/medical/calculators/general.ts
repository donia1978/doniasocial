import { CalculatorDefinition, CalculatorResult } from './types';

export const generalCalculators: CalculatorDefinition[] = [
  {
    id: 'bmi',
    name: 'IMC (Indice de Masse Corporelle)',
    description: 'Évaluation du statut pondéral',
    category: 'general',
    fields: [
      { id: 'weight', label: 'Poids (kg)', type: 'number', placeholder: '70' },
      { id: 'height', label: 'Taille (cm)', type: 'number', placeholder: '175' }
    ],
    calculate: (inputs): CalculatorResult => {
      const weight = parseFloat(inputs.weight || '0');
      const height = parseFloat(inputs.height || '0') / 100;
      
      if (weight <= 0 || height <= 0) {
        return { value: 0, unit: 'kg/m²', interpretation: 'Données invalides', normalRange: '18.5-24.9', severity: 'normal' };
      }
      
      const bmi = weight / (height * height);
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (bmi < 16) { interpretation = 'Dénutrition sévère'; severity = 'critical'; }
      else if (bmi < 17) { interpretation = 'Dénutrition modérée'; severity = 'high'; }
      else if (bmi < 18.5) { interpretation = 'Dénutrition légère'; severity = 'low'; }
      else if (bmi < 25) { interpretation = 'Poids normal'; severity = 'normal'; }
      else if (bmi < 30) { interpretation = 'Surpoids'; severity = 'low'; }
      else if (bmi < 35) { interpretation = 'Obésité classe I'; severity = 'high'; }
      else if (bmi < 40) { interpretation = 'Obésité classe II'; severity = 'high'; }
      else { interpretation = 'Obésité classe III (morbide)'; severity = 'critical'; }
      
      return {
        value: bmi.toFixed(1),
        unit: 'kg/m²',
        interpretation,
        normalRange: '18.5-24.9 kg/m²',
        severity
      };
    }
  },
  {
    id: 'bsa',
    name: 'Surface Corporelle',
    description: 'Formule de Du Bois',
    category: 'general',
    fields: [
      { id: 'weight', label: 'Poids (kg)', type: 'number', placeholder: '70' },
      { id: 'height', label: 'Taille (cm)', type: 'number', placeholder: '175' }
    ],
    calculate: (inputs): CalculatorResult => {
      const weight = parseFloat(inputs.weight || '0');
      const height = parseFloat(inputs.height || '0');
      
      if (weight <= 0 || height <= 0) {
        return { value: 0, unit: 'm²', interpretation: 'Données invalides', normalRange: '1.7-2.0', severity: 'normal' };
      }
      
      // Du Bois formula
      const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
      
      return {
        value: bsa.toFixed(2),
        unit: 'm²',
        interpretation: `Surface corporelle pour dosage des chimiothérapies`,
        normalRange: '1.7-2.0 m² (adulte moyen)',
        severity: 'normal'
      };
    }
  },
  {
    id: 'pediatric_dose',
    name: 'Dosage Pédiatrique',
    description: 'Calcul de dose selon le poids',
    category: 'general',
    fields: [
      { id: 'weight', label: 'Poids de l\'enfant (kg)', type: 'number', placeholder: '15' },
      { id: 'adult_dose', label: 'Dose adulte (mg)', type: 'number', placeholder: '500' },
      { id: 'method', label: 'Méthode de calcul', type: 'select', options: [
        { value: 'clark', label: 'Règle de Clark (par poids)' },
        { value: 'young', label: 'Règle de Young (par âge)' },
        { value: 'bsa', label: 'Par surface corporelle' }
      ]},
      { id: 'age', label: 'Âge (ans) - pour Young', type: 'number', placeholder: '6' },
      { id: 'height', label: 'Taille (cm) - pour BSA', type: 'number', placeholder: '100' }
    ],
    calculate: (inputs): CalculatorResult => {
      const weight = parseFloat(inputs.weight || '0');
      const adultDose = parseFloat(inputs.adult_dose || '0');
      const age = parseFloat(inputs.age || '0');
      const height = parseFloat(inputs.height || '0');
      const method = inputs.method || 'clark';
      
      let dose = 0;
      let formula = '';
      
      switch (method) {
        case 'clark':
          dose = (weight / 70) * adultDose;
          formula = 'Clark: (Poids enfant / 70) × Dose adulte';
          break;
        case 'young':
          dose = (age / (age + 12)) * adultDose;
          formula = 'Young: (Âge / (Âge + 12)) × Dose adulte';
          break;
        case 'bsa':
          const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
          dose = (bsa / 1.73) * adultDose;
          formula = 'BSA: (SC enfant / 1.73) × Dose adulte';
          break;
      }
      
      return {
        value: dose.toFixed(1),
        unit: 'mg',
        interpretation: `Méthode: ${formula}`,
        normalRange: 'Vérifier avec les recommandations du médicament',
        severity: 'normal'
      };
    }
  },
  {
    id: 'homa_ir',
    name: 'HOMA-IR',
    description: 'Résistance à l\'insuline',
    category: 'general',
    fields: [
      { id: 'glucose', label: 'Glycémie à jeun (mmol/L)', type: 'number', placeholder: '5.0', step: '0.1' },
      { id: 'insulin', label: 'Insulinémie à jeun (µU/mL)', type: 'number', placeholder: '10', step: '0.1' }
    ],
    calculate: (inputs): CalculatorResult => {
      const glucose = parseFloat(inputs.glucose || '0');
      const insulin = parseFloat(inputs.insulin || '0');
      
      if (glucose <= 0 || insulin <= 0) {
        return { value: 0, unit: '', interpretation: 'Données invalides', normalRange: '<2.5', severity: 'normal' };
      }
      
      const homa = (glucose * insulin) / 22.5;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (homa < 1) {
        interpretation = 'Sensibilité normale à l\'insuline';
        severity = 'normal';
      } else if (homa < 2.5) {
        interpretation = 'Résistance à l\'insuline légère';
        severity = 'low';
      } else if (homa < 4) {
        interpretation = 'Résistance à l\'insuline modérée';
        severity = 'high';
      } else {
        interpretation = 'Résistance à l\'insuline sévère';
        severity = 'critical';
      }
      
      return {
        value: homa.toFixed(2),
        unit: '',
        interpretation,
        normalRange: '<2.5',
        severity
      };
    }
  },
  {
    id: 'quicki',
    name: 'QUICKI',
    description: 'Quantitative Insulin Sensitivity Check Index',
    category: 'general',
    fields: [
      { id: 'glucose', label: 'Glycémie à jeun (mg/dL)', type: 'number', placeholder: '90' },
      { id: 'insulin', label: 'Insulinémie à jeun (µU/mL)', type: 'number', placeholder: '10', step: '0.1' }
    ],
    calculate: (inputs): CalculatorResult => {
      const glucose = parseFloat(inputs.glucose || '0');
      const insulin = parseFloat(inputs.insulin || '0');
      
      if (glucose <= 0 || insulin <= 0) {
        return { value: 0, unit: '', interpretation: 'Données invalides', normalRange: '>0.357', severity: 'normal' };
      }
      
      const quicki = 1 / (Math.log10(glucose) + Math.log10(insulin));
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (quicki > 0.357) {
        interpretation = 'Sensibilité normale à l\'insuline';
        severity = 'normal';
      } else if (quicki > 0.339) {
        interpretation = 'Résistance à l\'insuline légère';
        severity = 'low';
      } else {
        interpretation = 'Résistance à l\'insuline significative';
        severity = 'high';
      }
      
      return {
        value: quicki.toFixed(3),
        unit: '',
        interpretation,
        normalRange: '>0.357',
        severity
      };
    }
  },
  {
    id: 'alvarado',
    name: 'Score d\'Alvarado',
    description: 'Probabilité d\'appendicite aiguë',
    category: 'general',
    fields: [
      { id: 'migration', label: 'Migration de la douleur vers FID', type: 'checkbox' },
      { id: 'anorexia', label: 'Anorexie', type: 'checkbox' },
      { id: 'nausea', label: 'Nausées/Vomissements', type: 'checkbox' },
      { id: 'tenderness', label: 'Douleur à la palpation FID', type: 'checkbox' },
      { id: 'rebound', label: 'Rebond (défense)', type: 'checkbox' },
      { id: 'fever', label: 'Fièvre > 37.3°C', type: 'checkbox' },
      { id: 'leukocytosis', label: 'Leucocytose > 10000', type: 'checkbox' },
      { id: 'shift', label: 'Polynucléose > 75%', type: 'checkbox' }
    ],
    calculate: (inputs): CalculatorResult => {
      let score = 0;
      if (inputs.migration) score += 1;
      if (inputs.anorexia) score += 1;
      if (inputs.nausea) score += 1;
      if (inputs.tenderness) score += 2;
      if (inputs.rebound) score += 1;
      if (inputs.fever) score += 1;
      if (inputs.leukocytosis) score += 2;
      if (inputs.shift) score += 1;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'low';
      
      if (score <= 4) {
        interpretation = 'Appendicite peu probable - Surveillance';
        severity = 'low';
      } else if (score <= 6) {
        interpretation = 'Appendicite possible - Imagerie recommandée';
        severity = 'high';
      } else {
        interpretation = 'Appendicite probable - Chirurgie à considérer';
        severity = 'critical';
      }
      
      return {
        value: score,
        unit: '/10',
        interpretation,
        normalRange: '0-4',
        severity
      };
    }
  },
  {
    id: 'wells_pregnancy_dvt',
    name: 'LEFt Score (TVP grossesse)',
    description: 'Probabilité de TVP pendant la grossesse',
    category: 'general',
    fields: [
      { id: 'calf_left', label: 'Symptômes jambe gauche (+1)', type: 'checkbox' },
      { id: 'calf_diff', label: 'Différence mollet ≥ 2cm (+1)', type: 'checkbox' },
      { id: 'first_trimester', label: 'Premier trimestre (+1)', type: 'checkbox' }
    ],
    calculate: (inputs): CalculatorResult => {
      let score = 0;
      if (inputs.calf_left) score += 1;
      if (inputs.calf_diff) score += 1;
      if (inputs.first_trimester) score += 1;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'low';
      
      if (score === 0) {
        interpretation = 'Risque faible - D-dimères ajustés à l\'âge gestationnel';
        severity = 'low';
      } else if (score === 1) {
        interpretation = 'Risque modéré - D-dimères puis écho si positifs';
        severity = 'high';
      } else {
        interpretation = 'Risque élevé - Écho-Doppler directe';
        severity = 'critical';
      }
      
      return {
        value: score,
        unit: '/3',
        interpretation,
        normalRange: '0',
        severity
      };
    }
  },
  {
    id: 'corrected_calcium',
    name: 'Calcémie corrigée',
    description: 'Correction par l\'albumine',
    category: 'general',
    fields: [
      { id: 'calcium', label: 'Calcium total (mg/dL)', type: 'number', placeholder: '9.5', step: '0.1' },
      { id: 'albumin', label: 'Albumine (g/dL)', type: 'number', placeholder: '4.0', step: '0.1' }
    ],
    calculate: (inputs): CalculatorResult => {
      const calcium = parseFloat(inputs.calcium || '0');
      const albumin = parseFloat(inputs.albumin || '4');
      
      const corrected = calcium + (0.8 * (4 - albumin));
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (corrected < 8.5) {
        interpretation = 'Hypocalcémie';
        severity = 'high';
      } else if (corrected <= 10.5) {
        interpretation = 'Calcémie normale';
        severity = 'normal';
      } else if (corrected <= 12) {
        interpretation = 'Hypercalcémie légère';
        severity = 'high';
      } else if (corrected <= 14) {
        interpretation = 'Hypercalcémie modérée';
        severity = 'critical';
      } else {
        interpretation = 'Hypercalcémie sévère - Urgence';
        severity = 'critical';
      }
      
      return {
        value: corrected.toFixed(1),
        unit: 'mg/dL',
        interpretation,
        normalRange: '8.5-10.5 mg/dL',
        severity
      };
    }
  },
  {
    id: 'anion_gap',
    name: 'Trou Anionique',
    description: 'Calcul du trou anionique',
    category: 'general',
    fields: [
      { id: 'sodium', label: 'Sodium (mEq/L)', type: 'number', placeholder: '140' },
      { id: 'chloride', label: 'Chlore (mEq/L)', type: 'number', placeholder: '100' },
      { id: 'bicarbonate', label: 'Bicarbonates (mEq/L)', type: 'number', placeholder: '24' },
      { id: 'albumin', label: 'Albumine (g/dL) - optionnel', type: 'number', placeholder: '4.0', step: '0.1' }
    ],
    calculate: (inputs): CalculatorResult => {
      const na = parseFloat(inputs.sodium || '0');
      const cl = parseFloat(inputs.chloride || '0');
      const hco3 = parseFloat(inputs.bicarbonate || '0');
      const albumin = parseFloat(inputs.albumin || '4');
      
      const ag = na - (cl + hco3);
      // Correction pour l'albumine
      const agCorrected = ag + (2.5 * (4 - albumin));
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (agCorrected < 8) {
        interpretation = 'Trou anionique bas - Hypoalbuminémie, myélome, lithium';
        severity = 'low';
      } else if (agCorrected <= 12) {
        interpretation = 'Trou anionique normal';
        severity = 'normal';
      } else if (agCorrected <= 20) {
        interpretation = 'Trou anionique augmenté - Acidose métabolique à TA élevé';
        severity = 'high';
      } else {
        interpretation = 'Trou anionique très élevé - MUDPILES (Méthanol, Urémie, DKA, etc.)';
        severity = 'critical';
      }
      
      return {
        value: agCorrected.toFixed(1),
        unit: 'mEq/L',
        interpretation: `TA brut: ${ag.toFixed(1)}, Corrigé: ${agCorrected.toFixed(1)} - ${interpretation}`,
        normalRange: '8-12 mEq/L',
        severity
      };
    }
  },
  {
    id: 'osmolality',
    name: 'Osmolalité plasmatique',
    description: 'Calcul et trou osmolaire',
    category: 'general',
    fields: [
      { id: 'sodium', label: 'Sodium (mEq/L)', type: 'number', placeholder: '140' },
      { id: 'glucose', label: 'Glycémie (mg/dL)', type: 'number', placeholder: '100' },
      { id: 'bun', label: 'Urée (mg/dL)', type: 'number', placeholder: '15' },
      { id: 'measured', label: 'Osmolalité mesurée (mOsm/kg) - optionnel', type: 'number', placeholder: '290' }
    ],
    calculate: (inputs): CalculatorResult => {
      const na = parseFloat(inputs.sodium || '0');
      const glucose = parseFloat(inputs.glucose || '0');
      const bun = parseFloat(inputs.bun || '0');
      const measured = parseFloat(inputs.measured || '0');
      
      // Formule: 2×Na + Glucose/18 + BUN/2.8
      const calculated = (2 * na) + (glucose / 18) + (bun / 2.8);
      const gap = measured > 0 ? measured - calculated : 0;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (calculated < 275) {
        interpretation = 'Hypo-osmolalité';
        severity = 'high';
      } else if (calculated <= 295) {
        interpretation = 'Osmolalité normale';
        severity = 'normal';
      } else {
        interpretation = 'Hyperosmolalité';
        severity = 'high';
      }
      
      if (measured > 0 && gap > 10) {
        interpretation += ` | Trou osmolaire: ${gap.toFixed(0)} mOsm/kg (élevé - intoxication possible)`;
        severity = 'critical';
      } else if (measured > 0) {
        interpretation += ` | Trou osmolaire: ${gap.toFixed(0)} mOsm/kg (normal)`;
      }
      
      return {
        value: calculated.toFixed(0),
        unit: 'mOsm/kg',
        interpretation,
        normalRange: '275-295 mOsm/kg',
        severity
      };
    }
  }
];
