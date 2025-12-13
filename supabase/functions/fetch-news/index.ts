import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, country = 'FR', action } = await req.json();
    
    console.log(`Fetching ${category} news for ${country}, action: ${action}`);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'get') {
      // Just fetch from database
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('category', category)
        .eq('country', country)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate news using AI
    const categoryPrompts: Record<string, string> = {
      politics: `Génère 5 articles d'actualité politique récents et réalistes pour ${country}. 
        Pour chaque article, fournis: title, summary (2-3 phrases), source_name (un média crédible), 
        et une date published_at récente (format ISO). Les sujets doivent être réalistes et actuels.`,
      culture: `Génère 5 articles d'actualité culturelle récents pour ${country}: théâtre, cinéma, 
        festivals, expositions. Pour chaque article: title, summary, source_name, published_at (ISO), 
        et event_type si applicable.`,
      sports: `Génère 5 articles d'actualité sportive récents pour ${country}: football, rugby, 
        tennis, JO, etc. Pour chaque article: title, summary, source_name, published_at (ISO).`
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Tu es un générateur d'actualités. Réponds uniquement en JSON valide, un tableau d'objets." 
          },
          { role: "user", content: categoryPrompts[category] || categoryPrompts.politics }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_news",
              description: "Generate news articles",
              parameters: {
                type: "object",
                properties: {
                  articles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        source_name: { type: "string" },
                        published_at: { type: "string" },
                        event_type: { type: "string" }
                      },
                      required: ["title", "summary", "source_name", "published_at"]
                    }
                  }
                },
                required: ["articles"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_news" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('AI response received');

    // Extract articles from tool call
    let articles: any[] = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      articles = parsed.articles || [];
    }

    // Insert into database
    const articlesToInsert = articles.map((article: any) => ({
      category,
      country,
      title: article.title,
      summary: article.summary,
      source_name: article.source_name,
      published_at: article.published_at || new Date().toISOString(),
      image_url: `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/800/400`
    }));

    if (articlesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('news_articles')
        .insert(articlesToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }

    // Fetch all articles
    const { data: allArticles, error: fetchError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('category', category)
      .eq('country', country)
      .order('published_at', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;

    return new Response(JSON.stringify({ success: true, data: allArticles, generated: articles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-news:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
