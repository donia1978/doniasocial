import { supabase } from "@/lib/supabaseClient";

export async function saveCalculatorRun(args: {
  user_id: string;
  calculator_id: string;
  calculator_version: string;
  specialty: string;
  input: Record<string, any>;
  output: Record<string, any>;
}) {
  const { error } = await supabase.from("medical_calculator_runs").insert({
    user_id: args.user_id,
    calculator_id: args.calculator_id,
    calculator_version: args.calculator_version,
    specialty: args.specialty,
    input: args.input,
    output: args.output
  });
  if (error) throw error;
}

export async function listCalculatorRuns(user_id: string, limit = 50) {
  const { data, error } = await supabase
    .from("medical_calculator_runs")
    .select("id,calculator_id,calculator_version,specialty,input,output,created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
