export type CalcField =
  | { key: string; label: string; type: "number"; unit?: string; min?: number; max?: number; step?: number; required?: boolean }
  | { key: string; label: string; type: "select"; options: { label: string; value: string }[]; required?: boolean }
  | { key: string; label: string; type: "date"; required?: boolean };

export type CalculatorSpec = {
  id: string;
  name: string;
  specialty: "anapathe" | "nephro" | "gyneco";
  version: string;
  disclaimer: string;
  inputs: CalcField[];
  // returns a key/value map ready for UI
  compute: (input: Record<string, any>) => Record<string, any>;
};
