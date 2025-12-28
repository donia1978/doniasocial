import rules from "@/../pasion/cnam/tn_cnam_rules.json";

export type RenewalDecision = {
  dispenseDays: number;
  appointmentOffsetDays: number;
  leadDays: number;
  reason: string;
};

export function computeRenewalFromItems(args: {
  isChronic: boolean;
  atcList?: string[];
  durationDaysList?: number[];
}) : RenewalDecision {
  const leadDays = rules.default.renewalLeadDays ?? 7;

  // 1) If specific ATC rule matches, use it
  const atcs = args.atcList ?? [];
  for (const r of rules.medicationRules ?? []) {
    if (!r.atcPrefix) continue;
    if (atcs.some(a => (a ?? "").startsWith(r.atcPrefix))) {
      return {
        dispenseDays: r.renewal?.dispenseDays ?? rules.default.maxDispenseDaysIfUnknown,
        appointmentOffsetDays: r.renewal?.appointmentOffsetDays ?? Math.max(1, (r.renewal?.dispenseDays ?? 30) - 7),
        leadDays,
        reason: "ATC match: " + r.atcPrefix
      };
    }
  }

  // 2) If chronic generic
  if (args.isChronic && (rules.conditions?.length ?? 0) > 0) {
    const c = rules.conditions[0];
    return {
      dispenseDays: c.renewal?.dispenseDays ?? rules.default.maxDispenseDaysIfUnknown,
      appointmentOffsetDays: c.renewal?.appointmentOffsetDays ?? Math.max(1, (c.renewal?.dispenseDays ?? 30) - 7),
      leadDays,
      reason: "Chronic default"
    };
  }

  // 3) Fallback: infer from durations if provided, else default
  const durations = (args.durationDaysList ?? []).filter(Boolean) as number[];
  const inferred = durations.length ? Math.max(...durations) : rules.default.maxDispenseDaysIfUnknown;

  return {
    dispenseDays: inferred,
    appointmentOffsetDays: Math.max(1, inferred - 7),
    leadDays,
    reason: durations.length ? "Infer from item durations" : "Fallback default"
  };
}

export function computeDates(now: Date, d: RenewalDecision) {
  const renewalDue = new Date(now.getTime() + d.dispenseDays * 86400000);
  const nextAppt = new Date(now.getTime() + d.appointmentOffsetDays * 86400000);
  const remindAt = new Date(renewalDue.getTime() - d.leadDays * 86400000);
  return { renewalDue, nextAppt, remindAt };
}
