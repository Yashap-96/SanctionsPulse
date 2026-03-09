export const config = { runtime: 'edge' };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a sanctions intelligence analyst assistant for SanctionsPulse, a real-time OFAC sanctions monitoring platform. Your role is to:

- Analyze and explain OFAC sanctions list changes, additions, and removals
- Provide context on sanctioned entities, including their significance and connections
- Explain sanctions programs, legal authorities, and compliance implications
- Help users understand the impact of sanctions changes on their compliance workflows
- Summarize weekly and historical sanctions data trends
- Answer questions about SDN (Specially Designated Nationals) entries, their identifiers, and associated programs

Always be precise with entity names, ID numbers, and dates. When discussing sanctions, reference the specific OFAC program (e.g., SDGT, IRAN, CYBER2) when applicable. If you are unsure about specific details, say so clearly rather than speculating.`;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  context?: {
    currentData?: string;
    selectedEntity?: string;
    weeklyDiff?: string;
  };
}

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'AI service not configured',
        message: 'GROQ_API_KEY environment variable is not set',
      }),
      {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body: RequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build the system message with optional context
    let systemContent = SYSTEM_PROMPT;
    if (body.context) {
      const contextParts: string[] = [];
      if (body.context.currentData) {
        contextParts.push(
          `Current sanctions data context:\n${body.context.currentData}`
        );
      }
      if (body.context.selectedEntity) {
        contextParts.push(
          `Currently selected entity:\n${body.context.selectedEntity}`
        );
      }
      if (body.context.weeklyDiff) {
        contextParts.push(
          `Recent weekly changes:\n${body.context.weeklyDiff}`
        );
      }
      if (contextParts.length > 0) {
        systemContent += '\n\n--- Context ---\n' + contextParts.join('\n\n');
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...body.messages,
    ];

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return new Response(
        JSON.stringify({
          error: 'Groq API request failed',
          status: groqResponse.status,
          message: errorText,
        }),
        {
          status: groqResponse.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
