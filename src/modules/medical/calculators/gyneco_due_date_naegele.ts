/**
 * Calcul de la date d'accouchement selon la règle de Naegele
 * Règle: DPA = DDM + 7 jours - 3 mois + 1 année
 */

import { addDays, addMonths, addYears, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface PregnancyParams {
  lastMenstrualPeriod: Date | string; // Date des dernières règles
  cycleLength?: number;               // Longueur moyenne du cycle (jours)
  ultrasoundDate?: Date | string;     // Date de l'échographie
  ultrasoundGestationalAge?: number;  // Âge gestationnel à l'échographie (semaines)
}

export interface DueDateResult {
  dueDate: Date;                      // Date présumée d'accouchement
  currentGestationalAge: {           // Âge gestationnel actuel
    weeks: number;
    days: number;
    completedWeeks: number;
  };
  trimester: 1 | 2 | 3;              // Trimestre actuel
  nextAppointments: {                // Prochains rendez-vous
    type: string;
    date: Date;
    gestationalAge: number;
  }[];
  calculationMethod: 'naegele' | 'ultrasound' | 'combined';
}

/**
 * Calcule la date d'accouchement selon Naegele
 */
export function dueDateNaegele(params: PregnancyParams): DueDateResult {
  let lmp: Date;
  
  // Convertir LMP en Date
  if (typeof params.lastMenstrualPeriod === 'string') {
    lmp = parseISO(params.lastMenstrualPeriod);
  } else {
    lmp = params.lastMenstrualPeriod;
  }
  
  // Règle de Naegele standard: LMP + 7 jours - 3 mois + 1 an
  let dueDate = addDays(lmp, 7);
  dueDate = addMonths(dueDate, -3);
  dueDate = addYears(dueDate, 1);
  
  // Ajustement selon la longueur du cycle
  const cycleLength = params.cycleLength || 28;
  if (cycleLength !== 28) {
    const adjustment = cycleLength - 28;
    dueDate = addDays(dueDate, adjustment);
  }
  
  // Calculer l'âge gestationnel actuel
  const today = new Date();
  const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(daysSinceLMP / 7);
  const days = daysSinceLMP % 7;
  
  // Déterminer le trimestre
  let trimester: 1 | 2 | 3 = 1;
  if (weeks >= 28) trimester = 3;
  else if (weeks >= 14) trimester = 2;
  
  // Calculer les prochains rendez-vous
  const nextAppointments = calculateNextAppointments(dueDate, weeks);
  
  return {
    dueDate,
    currentGestationalAge: {
      weeks,
      days,
      completedWeeks: weeks
    },
    trimester,
    nextAppointments,
    calculationMethod: 'naegele'
  };
}

/**
 * Calcule les prochains rendez-vous prénatals
 */
function calculateNextAppointments(dueDate: Date, currentWeeks: number) {
  const appointments: { type: string; date: Date; gestationalAge: number }[] = [];
  const today = new Date();
  
  // Calendrier des rendez-vous standards
  const standardAppointments = [
    { weeks: 8, type: 'Première consultation' },
    { weeks: 12, type: 'Échographie du 1er trimestre' },
    { weeks: 22, type: 'Échographie du 2nd trimestre' },
    { weeks: 32, type: 'Échographie du 3ème trimestre' },
    { weeks: 36, type: 'Consultation pré-accouchement' },
    { weeks: 39, type: 'Dernière consultation' }
  ];
  
  // Filtrer les rendez-vous futurs
  for (const appt of standardAppointments) {
    if (appt.weeks > currentWeeks) {
      // Calculer la date du rendez-vous
      const daysFromLMP = appt.weeks * 7;
      const appointmentDate = addDays(dueDate, -280 + daysFromLMP);
      
      // Ne garder que les rendez-vous dans le futur
      if (appointmentDate > today) {
        appointments.push({
          type: appt.type,
          date: appointmentDate,
          gestationalAge: appt.weeks
        });
      }
    }
  }
  
  return appointments;
}

/**
 * Ajuste la DPA selon l'échographie
 */
export function adjustDueDateByUltrasound(
  naegeleDueDate: Date,
  ultrasoundDate: Date | string,
  ultrasoundGestationalAge: number
): Date {
  
  let usDate: Date;
  if (typeof ultrasoundDate === 'string') {
    usDate = parseISO(ultrasoundDate);
  } else {
    usDate = ultrasoundDate;
  }
  
  // Calculer la DPA basée sur l'échographie
  const daysFromUltrasoundToDueDate = (40 - ultrasoundGestationalAge) * 7;
  const ultrasoundBasedDueDate = addDays(usDate, daysFromUltrasoundToDueDate);
  
  // Si l'échographie est avant 14 semaines, elle prime sur Naegele
  if (ultrasoundGestationalAge < 14) {
    return ultrasoundBasedDueDate;
  }
  
  // Sinon, moyenne pondérée
  const daysDifference = Math.abs(naegeleDueDate.getTime() - ultrasoundBasedDueDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDifference > 7) {
    // Différence importante, préférer l'échographie
    return ultrasoundBasedDueDate;
  } else {
    // Différence mineure, garder Naegele
    return naegeleDueDate;
  }
}

/**
 * Formatte la date pour affichage
 */
export function formatDueDateDisplay(dueDate: Date): string {
  return format(dueDate, "EEEE d MMMM yyyy", { locale: fr });
}

/**
 * Calcule la période de fertilité
 */
export function calculateFertilityWindow(lmp: Date, cycleLength: number = 28): {
  ovulationDate: Date;
  fertileWindow: { start: Date; end: Date };
  nextPeriod: Date;
} {
  
  const ovulationDay = cycleLength - 14;
  const ovulationDate = addDays(lmp, ovulationDay);
  
  const fertileStart = addDays(ovulationDate, -3);
  const fertileEnd = addDays(ovulationDate, 1);
  
  const nextPeriod = addDays(lmp, cycleLength);
  
  return {
    ovulationDate,
    fertileWindow: { start: fertileStart, end: fertileEnd },
    nextPeriod
  };
}
