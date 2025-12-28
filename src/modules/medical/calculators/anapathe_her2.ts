import type { CalculatorSpec } from "./types";

export const her2Ihc: CalculatorSpec = {
  id: "anapathe_her2_ihc_v1",
  name: "HER2 IHC (0/1+/2+/3+)",
  specialty: "anapathe",
  version: "1.0.0",
  disclaimer: "Formulaire de scoring uniquement. 2+ nécessite confirmation (ISH) selon guidelines locales.",
  inputs: [
    {
      key: "score",
      label: "Score HER2",
      type: "select",
      options: [
        { label: "0", value: "0" },
        { label: "1+", value: "1+" },
        { label: "2+ (équivoque)", value: "2+" },
        { label: "3+", value: "3+" }
      ],
      required: true
    }
  ],
  compute: (input) => {
    const s = String(input.score ?? "0");
    const needIsh = s === "2+";
    return {
      her2_score: s,
      requires_ish: needIsh,
      note: needIsh ? "2+ : ISH recommandé/obligatoire selon protocole." : "Consigner selon protocole."
    };
  }
};
