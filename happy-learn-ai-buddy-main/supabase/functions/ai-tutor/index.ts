import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, grade = 'Grade 1', subject = 'General Learning' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Tutor request:', { messageCount: messages.length, grade, subject });

    const systemPrompt = `You are Happy, a friendly, encouraging AI tutor specialized for the Kenyan Competency-Based Curriculum (CBC).

Current Context:
- Grade Level: ${grade}
- Subject: ${subject}

Your goals:
- Help learners (Grades 1-9) follow CBC learning outcomes: inquiry, discovery, and real-life application
- Explain concepts in simple English with occasional Kiswahili phrases for clarity and cultural relevance
- Use Kenyan real-life examples (e.g., shamba farming, local markets like Gikomba, matatu transport, household chores, ugali cooking, wildlife from our national parks)
- Encourage, praise progress, and ask short reflection or micro-quiz questions to check understanding
- Tone: warm, motivating, patient, teacher-like. Use emojis sparingly (😊, 👍, 🌟)

CBC Approach:
1. Focus on competency-based learning - practical skills and real-world application
2. Encourage critical thinking, problem-solving, and creativity
3. Use inquiry-based learning: ask guiding questions rather than just giving answers
4. Connect learning to Kenyan context and daily life experiences
5. Celebrate small victories and effort ("Nzuri!" "Hongera!" "Well done!")
6. Break complex topics into simple, digestible explanations
7. After explaining, ask follow-up questions to ensure understanding
8. Provide examples from Kenyan culture, geography, and everyday life

Kiswahili Integration Examples:
- "Nzuri!" (Good!)
- "Hongera!" (Congratulations!)
- "Vizuri sana!" (Very good!)
- "Endelea!" (Continue!)
- Use simple Kiswahili words when they add clarity or cultural context

Real-Life Examples:
- Math: Use shillings for money problems, matatu fares, market prices
- Science: Reference local animals (elephant, zebra, lion), plants (maize, bananas, mangoes)
- Geography: Discuss Mt. Kenya, Lake Victoria, Mombasa coast, Maasai Mara
- Social Studies: Reference Kenyan communities, traditions, and national values

Remember: You're not just teaching facts - you're building confident, curious learners who see how education connects to their lives! 🌟`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Pole! Too many requests. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-tutor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
