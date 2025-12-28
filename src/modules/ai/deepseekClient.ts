import policy from "@/modules/ai/policies/deepseek.policy.json";

type AllowedAction =
  | "medical_summary"
  | "medical_calculator_explain"
  | "draft_prescription";

function sha256Hex(input: string): Promise<string> {
  // Browser-safe digest
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", enc).then((buf) => {
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}

function getToon(): string {
  // Vite env
  const anyEnv = import.meta as any;
  const toon = anyEnv?.env?.DEEPSEEK_TOON || anyEnv?.env?.DEEPSEEK_API_KEY;
  if (!toon) throw new Error("DeepSeek key missing: set DEEPSEEK_TOON (preferred) or DEEPSEEK_API_KEY");
  return toon;
}

function assertAllowed(action: string): asserts action is AllowedAction {
  if (!policy.allowedActions.includes(action)) {
    throw new Error("Action not allowed by policy: " + action);
  }
  if ((policy as any).disallowed?.diagnosis && action === "diagnosis") {
    throw new Error("Diagnosis action forbidden");
  }
}

export async function deepseekChat(args: {
  action: AllowedAction;
  userId: string;
  prompt: string;
  system?: string;
}) {
  assertAllowed(args.action);

  const toon = getToon();

  // Minimal logging (hash only)
  const promptHash = await sha256Hex(args.prompt);

  // IMPORTANT: do not log PHI in console in production
  const payload = {
    model: "deepseek-chat",
    messages: [
      ...(args.system ? [{ role: "system", content: args.system }] : []),
      { role: "user", content: args.prompt }
    ],
    temperature: 0.2
  };

  const res = await fetch("/api/ai/deepseek", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-DONIA-ACTION": args.action,
      "X-DONIA-USER": args.userId,
      "X-DONIA-PROMPT-HASH": promptHash,
      "Authorization": "Bearer " + toon
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("DeepSeek proxy error: " + res.status + " " + t);
  }

  return res.json();
}
