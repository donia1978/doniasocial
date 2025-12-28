import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ClipboardCopy } from "lucide-react";

import type { CalculatorSpec, CalcField } from "@/modules/medical/calculators/types";
import { getCalculatorsBySpecialty, DONIA_MEDICAL_CALCULATORS } from "@/modules/medical/calculators";

function fieldDefaultValue(f: CalcField) {
  if (f.type === "number") return 0;
  if (f.type === "date") return new Date().toISOString().slice(0, 10);
  if (f.type === "select") return f.options?.[0]?.value ?? "";
  return "";
}

function labelForSpecialty(s: CalculatorSpec["specialty"]) {
  if (s === "anapathe") return "Anatopathologie";
  if (s === "nephro") return "Néphrologie";
  return "Gynécologie";
}

function renderField(
  f: CalcField,
  value: any,
  onChange: (v: any) => void
) {
  if (f.type === "number") {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">
          {f.label} {f.unit ? <span className="text-muted-foreground">({f.unit})</span> : null}
        </div>
        <Input
          type="number"
          min={f.min}
          max={f.max}
          step={f.step ?? 1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
    );
  }

  if (f.type === "date") {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{f.label}</div>
        <Input type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  // select
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{f.label}</div>
      <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir..." />
        </SelectTrigger>
        <SelectContent>
          {f.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MedicalCalculators() {
  const [specialty, setSpecialty] = useState<CalculatorSpec["specialty"]>("anapathe");

  const calcs = useMemo(() => getCalculatorsBySpecialty(specialty), [specialty]);
  const [calcId, setCalcId] = useState<string>(calcs[0]?.id ?? "");

  // Keep selected calculator stable when switching tabs
  const selectedCalc = useMemo(() => {
    const inSpec = DONIA_MEDICAL_CALCULATORS.find((c) => c.id === calcId);
    if (inSpec && inSpec.specialty === specialty) return inSpec;
    return calcs[0] ?? DONIA_MEDICAL_CALCULATORS[0];
  }, [calcId, calcs, specialty]);

  const [form, setForm] = useState<Record<string, any>>(() => {
    const c = selectedCalc;
    const init: Record<string, any> = {};
    c.inputs.forEach((f) => (init[f.key] = fieldDefaultValue(f)));
    return init;
  });

  // Re-init form when calculator changes
  useMemo(() => {
    const init: Record<string, any> = {};
    selectedCalc.inputs.forEach((f) => (init[f.key] = fieldDefaultValue(f)));
    setForm(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalc.id]);

  const result = useMemo(() => {
    try {
      return selectedCalc.compute(form);
    } catch (e: any) {
      return { error: e?.message ?? "Erreur de calcul" };
    }
  }, [form, selectedCalc]);

  function copyResult() {
    const txt = JSON.stringify(
      { calculator: selectedCalc.id, version: selectedCalc.version, result, input: form },
      null,
      2
    );
    navigator.clipboard?.writeText(txt);
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculateurs médicaux (pasion)
          </CardTitle>
          <CardDescription>
            Aide au calcul uniquement. Toute interprétation et décision clinique doit être validée par un professionnel de santé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={specialty} onValueChange={(v) => setSpecialty(v as any)}>
            <TabsList className="grid grid-cols-3 w-full max-w-2xl">
              <TabsTrigger value="anapathe">{labelForSpecialty("anapathe")}</TabsTrigger>
              <TabsTrigger value="nephro">{labelForSpecialty("nephro")}</TabsTrigger>
              <TabsTrigger value="gyneco">{labelForSpecialty("gyneco")}</TabsTrigger>
            </TabsList>

            <TabsContent value={specialty} className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Choisir un calculateur</div>
                <Select
                  value={selectedCalc.id}
                  onValueChange={(v) => setCalcId(v)}
                >
                  <SelectTrigger className="max-w-3xl">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {calcs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-sm font-semibold">{selectedCalc.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Version: {selectedCalc.version}</div>
                <div className="text-xs text-muted-foreground mt-2">{selectedCalc.disclaimer}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCalc.inputs.map((f) => (
                  <div key={f.key}>
                    {renderField(f, form[f.key], (v) => setForm((prev) => ({ ...prev, [f.key]: v })))}
                  </div>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Résultat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="text-xs rounded-lg border bg-background p-3 overflow-auto">
{JSON.stringify(result, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyResult}>
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copier JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default MedicalCalculators;
