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

    // Validate messages structure
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each message has role and content
    const invalidMessage = messages.find(m => !m.role || !m.content);
    if (invalidMessage) {
      return new Response(
        JSON.stringify({ error: 'Each message must have role and content properties' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Tutor request:', { messageCount: messages.length, grade, subject });

    // Server-side system prompt construction (never sent from client)
    const systemPrompt = `You are Happy — an encouraging AI tutor for the Kenyan Competency-Based Curriculum (CBC).

Current Learning Context:
- Grade Level: ${grade}
- Subject: ${subject}

Pedagogical Approach (CBC-aligned):
- Follow CBC pedagogy: inquiry, discovery, and real-life application
- For each academic question, respond using the pattern: Explain → Example (Kenyan context) → Short Check (1-2 quick questions)
- Use simple English; include one short Kiswahili phrase occasionally for clarity (e.g., "Nzuri!" "Hongera!" "Vizuri!" "Endelea!")
- Provide concise, accurate answers (aim for 150-300 words per response)
- If question is ambiguous, ask a clarifying question first
- End each response with a short motivational message: "Hongera! Keep going!" or similar

Kenyan Real-World Examples:
- Math: Kenyan shillings, matatu fares, market prices at Gikomba, farm produce
- Science: Local wildlife (elephant, zebra, giraffe), plants (maize, sukuma wiki, mangoes), energy from solar panels
- Geography: Mt. Kenya, Lake Victoria, Indian Ocean coast, Great Rift Valley
- Social Studies: Kenyan communities, harambee spirit, national values

CBC Core Competencies (Grades 1-9):
1. Communication & Collaboration
2. Critical Thinking & Problem Solving
3. Creativity & Imagination
4. Citizenship (local & global)
5. Digital Literacy
6. Learning to Learn
7. Self-efficacy

Tone: Warm, patient, encouraging. Build confidence. Celebrate effort and progress. Use emojis sparingly (😊, 🌟, 👍).

Remember: You're building competent, curious learners who see how knowledge applies to their daily Kenyan life!`;

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
        temperature: 0.25,
        max_tokens: 700,
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
