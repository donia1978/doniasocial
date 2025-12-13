import { CalculatorDefinition, CalculatorResult } from './types';

export const dermatologyCalculators: CalculatorDefinition[] = [
  {
    id: 'winrs',
    name: 'WI-NRS (Worst Itch NRS)',
    description: 'Échelle numérique du prurit',
    category: 'dermatology',
    fields: [
      {
        id: 'score', label: 'Intensité du prurit (pire des 24h)', type: 'select',
        options: [
          { value: '0', label: '0 - Pas de prurit' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
          { value: '7', label: '7' },
          { value: '8', label: '8' },
          { value: '9', label: '9' },
          { value: '10', label: '10 - Pire prurit imaginable' }
        ]
      }
    ],
    calculate: (inputs): CalculatorResult => {
      const score = parseInt(inputs.score || '0');
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (score === 0) {
        interpretation = 'Pas de prurit';
        severity = 'normal';
      } else if (score <= 3) {
        interpretation = 'Prurit léger';
        severity = 'low';
      } else if (score <= 6) {
        interpretation = 'Prurit modéré';
        severity = 'high';
      } else if (score <= 8) {
        interpretation = 'Prurit sévère';
        severity = 'critical';
      } else {
        interpretation = 'Prurit très sévère';
        severity = 'critical';
      }
      
      return {
        value: score,
        unit: '/10',
        interpretation,
        normalRange: '0',
        severity
      };
    }
  },
  {
    id: 'skindex10',
    name: 'SKINDEX-10',
    description: 'Impact des maladies cutanées sur la qualité de vie',
    category: 'dermatology',
    fields: [
      { id: 'q1', label: 'Affecte les émotions (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q2', label: 'Affecte les interactions sociales (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q3', label: 'Affecte le désir d\'être avec les gens (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q4', label: 'Tendance à rester à la maison (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q5', label: 'Peau irritée (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q6', label: 'Peau brûlante ou cuisante (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q7', label: 'Peau qui démange (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q8', label: 'Apparence gênante (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q9', label: 'Frustration avec la peau (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'q10', label: 'Honte de la peau (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 }
    ],
    calculate: (inputs): CalculatorResult => {
      let total = 0;
      for (let i = 1; i <= 10; i++) {
        total += parseInt(inputs[`q${i}`] || '0');
      }
      
      const percent = (total / 60) * 100;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (percent <= 20) {
        interpretation = 'Impact minimal sur la qualité de vie';
        severity = 'normal';
      } else if (percent <= 40) {
        interpretation = 'Impact léger sur la qualité de vie';
        severity = 'low';
      } else if (percent <= 60) {
        interpretation = 'Impact modéré sur la qualité de vie';
        severity = 'high';
      } else {
        interpretation = 'Impact sévère sur la qualité de vie';
        severity = 'critical';
      }
      
      return {
        value: total,
        unit: '/60',
        interpretation: `${interpretation} (${percent.toFixed(0)}%)`,
        normalRange: '0-12',
        severity
      };
    }
  },
  {
    id: 'fiveD',
    name: 'Échelle 5D-Itch',
    description: 'Évaluation multidimensionnelle du prurit',
    category: 'dermatology',
    fields: [
      {
        id: 'duration', label: 'Durée du prurit par jour', type: 'select',
        options: [
          { value: '1', label: '< 6 heures' },
          { value: '2', label: '6-12 heures' },
          { value: '3', label: '12-18 heures' },
          { value: '4', label: '18-23 heures' },
          { value: '5', label: 'Toute la journée' }
        ]
      },
      {
        id: 'degree', label: 'Intensité du prurit', type: 'select',
        options: [
          { value: '1', label: 'Pas de prurit' },
          { value: '2', label: 'Léger' },
          { value: '3', label: 'Modéré' },
          { value: '4', label: 'Sévère' },
          { value: '5', label: 'Intolérable' }
        ]
      },
      {
        id: 'direction', label: 'Évolution sur les 2 dernières semaines', type: 'select',
        options: [
          { value: '1', label: 'Résolu complètement' },
          { value: '3', label: 'Beaucoup amélioré' },
          { value: '5', label: 'Légèrement amélioré' },
          { value: '3b', label: 'Inchangé' },
          { value: '5b', label: 'Légèrement aggravé' },
          { value: '7', label: 'Beaucoup aggravé' }
        ]
      },
      {
        id: 'disability', label: 'Impact sur les activités quotidiennes', type: 'select',
        options: [
          { value: '1', label: 'Aucun impact' },
          { value: '2', label: 'Rarement gêné' },
          { value: '3', label: 'Parfois gêné' },
          { value: '4', label: 'Souvent gêné' },
          { value: '5', label: 'Toujours gêné/incapable' }
        ]
      },
      {
        id: 'distribution', label: 'Nombre de zones atteintes', type: 'select',
        options: [
          { value: '1', label: '0-2 zones' },
          { value: '2', label: '3-5 zones' },
          { value: '3', label: '6-10 zones' },
          { value: '4', label: '11-13 zones' },
          { value: '5', label: '14-16 zones (généralisé)' }
        ]
      }
    ],
    calculate: (inputs): CalculatorResult => {
      const parseScore = (v: string) => parseInt(v.replace(/[a-z]/g, '')) || 1;
      const total = parseScore(inputs.duration || '1') + parseScore(inputs.degree || '1') +
                   parseScore(inputs.direction || '3') + parseScore(inputs.disability || '1') +
                   parseScore(inputs.distribution || '1');
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (total <= 10) {
        interpretation = 'Prurit léger';
        severity = 'low';
      } else if (total <= 15) {
        interpretation = 'Prurit modéré';
        severity = 'high';
      } else if (total <= 20) {
        interpretation = 'Prurit sévère';
        severity = 'critical';
      } else {
        interpretation = 'Prurit très sévère';
        severity = 'critical';
      }
      
      return {
        value: total,
        unit: '/25',
        interpretation,
        normalRange: '5-10',
        severity
      };
    }
  },
  {
    id: 'pasi',
    name: 'PASI',
    description: 'Psoriasis Area and Severity Index',
    category: 'dermatology',
    fields: [
      { id: 'head_area', label: 'Surface tête (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'head_erythema', label: 'Érythème tête (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'head_induration', label: 'Induration tête (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'head_desquamation', label: 'Desquamation tête (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'trunk_area', label: 'Surface tronc (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'trunk_erythema', label: 'Érythème tronc (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'trunk_induration', label: 'Induration tronc (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'trunk_desquamation', label: 'Desquamation tronc (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'upper_area', label: 'Surface membres sup (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'upper_erythema', label: 'Érythème membres sup (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'upper_induration', label: 'Induration membres sup (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'upper_desquamation', label: 'Desquamation membres sup (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'lower_area', label: 'Surface membres inf (0-6)', type: 'number', placeholder: '0', min: 0, max: 6 },
      { id: 'lower_erythema', label: 'Érythème membres inf (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'lower_induration', label: 'Induration membres inf (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { id: 'lower_desquamation', label: 'Desquamation membres inf (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 }
    ],
    calculate: (inputs): CalculatorResult => {
      const head = parseInt(inputs.head_area || '0') * 
                  (parseInt(inputs.head_erythema || '0') + parseInt(inputs.head_induration || '0') + parseInt(inputs.head_desquamation || '0'));
      const trunk = parseInt(inputs.trunk_area || '0') * 
                   (parseInt(inputs.trunk_erythema || '0') + parseInt(inputs.trunk_induration || '0') + parseInt(inputs.trunk_desquamation || '0'));
      const upper = parseInt(inputs.upper_area || '0') * 
                   (parseInt(inputs.upper_erythema || '0') + parseInt(inputs.upper_induration || '0') + parseInt(inputs.upper_desquamation || '0'));
      const lower = parseInt(inputs.lower_area || '0') * 
                   (parseInt(inputs.lower_erythema || '0') + parseInt(inputs.lower_induration || '0') + parseInt(inputs.lower_desquamation || '0'));
      
      const pasi = (head * 0.1) + (trunk * 0.3) + (upper * 0.2) + (lower * 0.4);
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (pasi === 0) {
        interpretation = 'Aucune atteinte';
        severity = 'normal';
      } else if (pasi <= 5) {
        interpretation = 'Psoriasis léger';
        severity = 'low';
      } else if (pasi <= 10) {
        interpretation = 'Psoriasis modéré';
        severity = 'high';
      } else {
        interpretation = 'Psoriasis sévère - Traitement systémique à considérer';
        severity = 'critical';
      }
      
      return {
        value: pasi.toFixed(1),
        unit: '/72',
        interpretation,
        normalRange: '0',
        severity
      };
    }
  },
  {
    id: 'scorad',
    name: 'SCORAD',
    description: 'SCORing Atopic Dermatitis',
    category: 'dermatology',
    fields: [
      { id: 'extent', label: 'Surface corporelle atteinte (%)', type: 'number', placeholder: '10', min: 0, max: 100 },
      { id: 'erythema', label: 'Érythème (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'edema', label: 'Œdème/papules (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'oozing', label: 'Suintement/croûtes (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'excoriation', label: 'Excoriations (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'lichenification', label: 'Lichénification (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'dryness', label: 'Sécheresse (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'pruritus', label: 'Prurit VAS (0-10)', type: 'number', placeholder: '0', min: 0, max: 10 },
      { id: 'sleep_loss', label: 'Insomnie VAS (0-10)', type: 'number', placeholder: '0', min: 0, max: 10 }
    ],
    calculate: (inputs): CalculatorResult => {
      const extent = parseFloat(inputs.extent || '0');
      const intensity = parseInt(inputs.erythema || '0') + parseInt(inputs.edema || '0') +
                       parseInt(inputs.oozing || '0') + parseInt(inputs.excoriation || '0') +
                       parseInt(inputs.lichenification || '0') + parseInt(inputs.dryness || '0');
      const subjective = parseInt(inputs.pruritus || '0') + parseInt(inputs.sleep_loss || '0');
      
      const scorad = (extent / 5) + (3.5 * intensity) + subjective;
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (scorad <= 15) {
        interpretation = 'Dermatite atopique légère';
        severity = 'low';
      } else if (scorad <= 40) {
        interpretation = 'Dermatite atopique modérée';
        severity = 'high';
      } else {
        interpretation = 'Dermatite atopique sévère';
        severity = 'critical';
      }
      
      return {
        value: scorad.toFixed(1),
        unit: '/103',
        interpretation,
        normalRange: '0-15',
        severity
      };
    }
  },
  {
    id: 'dlqi',
    name: 'DLQI',
    description: 'Dermatology Life Quality Index',
    category: 'dermatology',
    fields: [
      { id: 'q1', label: 'Démangeaisons, douleurs (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q2', label: 'Gêne, embarras (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q3', label: 'Courses, maison, jardin (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q4', label: 'Vêtements (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q5', label: 'Activités sociales, loisirs (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q6', label: 'Sport (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q7', label: 'Travail ou études (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q8', label: 'Relations (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q9', label: 'Vie sexuelle (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 },
      { id: 'q10', label: 'Traitement (0-3)', type: 'number', placeholder: '0', min: 0, max: 3 }
    ],
    calculate: (inputs): CalculatorResult => {
      let total = 0;
      for (let i = 1; i <= 10; i++) {
        total += parseInt(inputs[`q${i}`] || '0');
      }
      
      let interpretation = '';
      let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      
      if (total <= 1) {
        interpretation = 'Pas d\'impact sur la qualité de vie';
        severity = 'normal';
      } else if (total <= 5) {
        interpretation = 'Impact léger';
        severity = 'low';
      } else if (total <= 10) {
        interpretation = 'Impact modéré';
        severity = 'high';
      } else if (total <= 20) {
        interpretation = 'Impact important';
        severity = 'critical';
      } else {
        interpretation = 'Impact extrême sur la qualité de vie';
        severity = 'critical';
      }
      
      return {
        value: total,
        unit: '/30',
        interpretation,
        normalRange: '0-1',
        severity
      };
    }
  }
];
