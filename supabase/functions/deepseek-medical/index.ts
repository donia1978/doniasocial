import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ACTIONS = new Set([
  "medical_calculator",
  "medical_summary",
  "draft_prescription" // draft only, must require human validation
]);

function assertAllowedAction(action: string) {
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error("Action not allowed by DONIA policy: " + action);
  }
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


const ALLOWED_ACTIONS = new Set([
  "medical_calculator",
  "medical_summary",
  "draft_prescription" // draft only, must require human validation
]);

function assertAllowedAction(action: string) {
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error("Action not allowed by DONIA policy: " + action);
  }
}
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[DeepSeek Medical] Missing authorization header');
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[DeepSeek Medical] Invalid token:', authError?.message);
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has medical_staff or admin role
    const { data: hasRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'medical_staff'
    });
    
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasRole && !isAdmin) {
      console.error('[DeepSeek Medical] User lacks required role:', user.id);
      return new Response(JSON.stringify({ success: false, error: 'Insufficient permissions. Medical staff or admin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not configured');
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const { action, data } = await req.json();
    console.log(`[DeepSeek Medical] Action: ${action}, User: ${user.id}`, JSON.stringify(data));

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_prescription':
        systemPrompt = `Tu es un assistant mÃ©dical expert. Tu dois gÃ©nÃ©rer des suggestions de prescription basÃ©es sur les symptÃ´mes et le diagnostic fournis. 
        IMPORTANT: Ceci est une SUGGESTION qui doit Ãªtre validÃ©e par un mÃ©decin humain. 
        Tu dois toujours inclure des avertissements appropriÃ©s et ne jamais remplacer l'avis mÃ©dical professionnel.
        RÃ©ponds en franÃ§ais.`;

const ALLOWED_ACTIONS = new Set([
  "medical_calculator",
  "medical_summary",
  "draft_prescription" // draft only, must require human validation
]);

function assertAllowedAction(action: string) {
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error("Action not allowed by DONIA policy: " + action);
  }
}
        userPrompt = `Patient: ${data.patientName}
SymptÃ´mes: ${data.symptoms?.join(', ') || 'Non spÃ©cifiÃ©s'}
Diagnostic: ${data.diagnosis || 'Non spÃ©cifiÃ©'}
Pays: ${data.country || 'France'}
Allergies connues: ${data.allergies?.join(', ') || 'Aucune connue'}

GÃ©nÃ¨re une suggestion de prescription adaptÃ©e, en tenant compte de la disponibilitÃ© des mÃ©dicaments dans le pays du patient.`;
        break;

      case 'calculate_medical_indicator':
        systemPrompt = `Tu es un calculateur mÃ©dical expert. Tu dois calculer les indicateurs mÃ©dicaux demandÃ©s avec prÃ©cision.
        Fournis toujours les formules utilisÃ©es, les valeurs normales de rÃ©fÃ©rence, et l'interprÃ©tation du rÃ©sultat.
        RÃ©ponds en franÃ§ais avec un format structurÃ©.`;
        userPrompt = `Calcul demandÃ©: ${data.calculationType}
DonnÃ©es patient: ${JSON.stringify(data.patientData)}

Effectue le calcul et fournis:
1. La formule utilisÃ©e
2. Le rÃ©sultat avec unitÃ©s
3. Les valeurs normales de rÃ©fÃ©rence
4. L'interprÃ©tation du rÃ©sultat`;
        break;

      case 'analyze_symptoms':
        systemPrompt = `Tu es un assistant mÃ©dical pour l'analyse prÃ©liminaire des symptÃ´mes.
        Tu dois fournir des pistes de diagnostic diffÃ©rentiel basÃ©es sur les symptÃ´mes dÃ©crits.
        AVERTISSEMENT: Ceci n'est pas un diagnostic mÃ©dical. Le patient doit consulter un professionnel de santÃ©.
        RÃ©ponds en franÃ§ais.`;
        userPrompt = `SymptÃ´mes rapportÃ©s: ${data.symptoms?.join(', ')}
DurÃ©e: ${data.duration || 'Non spÃ©cifiÃ©e'}
AntÃ©cÃ©dents: ${data.medicalHistory || 'Non spÃ©cifiÃ©s'}

Fournis une analyse prÃ©liminaire avec des pistes de diagnostic diffÃ©rentiel.`;
        break;

      case 'interpret_calculation':
        systemPrompt = `Tu es un expert mÃ©dical spÃ©cialisÃ© dans l'interprÃ©tation des scores et calculs mÃ©dicaux.
        Tu dois analyser le rÃ©sultat du calcul et fournir:
        1. Une interprÃ©tation clinique dÃ©taillÃ©e
        2. Les implications pour le patient
        3. Des recommandations thÃ©rapeutiques personnalisÃ©es
        4. Les points de vigilance et surveillances Ã  effectuer
        5. Les examens complÃ©mentaires Ã©ventuels Ã  envisager
        
        Adapte ton analyse au contexte du patient si fourni.
        IMPORTANT: Ceci est une aide Ã  la dÃ©cision et doit Ãªtre validÃ© par le mÃ©decin.
        RÃ©ponds en franÃ§ais de maniÃ¨re structurÃ©e et professionnelle.`;

const ALLOWED_ACTIONS = new Set([
  "medical_calculator",
  "medical_summary",
  "draft_prescription" // draft only, must require human validation
]);

function assertAllowedAction(action: string) {
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error("Action not allowed by DONIA policy: " + action);
  }
}
        userPrompt = `Calcul effectuÃ©: ${data.calculatorName}
Type de calculateur: ${data.calculatorCategory}
Description: ${data.calculatorDescription}

DonnÃ©es d'entrÃ©e: ${JSON.stringify(data.inputData, null, 2)}

RÃ©sultat: ${data.result.value} ${data.result.unit}
InterprÃ©tation de base: ${data.result.interpretation}
Valeurs normales: ${data.result.normalRange}
SÃ©vÃ©ritÃ©: ${data.result.severity || 'normale'}

${data.patientContext ? `Contexte patient: ${data.patientContext}` : ''}

Fournis une analyse clinique approfondie avec:
1. **Signification clinique** - Que signifie ce rÃ©sultat pour le patient?
2. **Implications** - Quelles sont les consÃ©quences possibles?
3. **Recommandations** - Quelles actions thÃ©rapeutiques envisager?
4. **Surveillance** - Quels paramÃ¨tres surveiller?
5. **Examens complÃ©mentaires** - Quels examens seraient utiles?`;
        break;

      case 'appointment_reminder':
        systemPrompt = `Tu es un assistant de rappel de rendez-vous mÃ©dical. GÃ©nÃ¨re des messages de rappel professionnels et bienveillants en franÃ§ais.`;
        userPrompt = `GÃ©nÃ©rer un rappel de rendez-vous:
Patient: ${data.patientName}
MÃ©decin: ${data.doctorName}
Date: ${data.appointmentDate}
Heure: ${data.appointmentTime}
Type: ${data.appointmentType}
Lieu: ${data.location || 'Cabinet mÃ©dical'}

Type de rappel: ${data.reminderType} (24h avant / 2h avant / 15 min avant)`;
        break;

      default:
        throw new Error(`Action non reconnue: ${action}`);
    }

    console.log('[DeepSeek Medical] Calling DeepSeek API...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek Medical] API Error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    console.log('[DeepSeek Medical] Response received successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      content,
      action,
      disclaimer: "Cette information est gÃ©nÃ©rÃ©e par IA et doit Ãªtre validÃ©e par un professionnel de santÃ© qualifiÃ©."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[DeepSeek Medical] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

