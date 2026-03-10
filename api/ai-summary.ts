export const config = { runtime: 'edge' };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// --- Rate Limiting ---
// IP → { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per IP per hour
const MAX_MESSAGE_LENGTH = 500; // chars per user message
const MAX_CONVERSATION_LENGTH = 10; // max messages in a conversation

// Clean up stale entries periodically (every 100 requests)
let requestCounter = 0;
function cleanupRateLimits() {
  requestCounter++;
  if (requestCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupRateLimits();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetIn: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart),
  };
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are a sanctions intelligence analyst assistant for SanctionsPulse, a real-time OFAC sanctions monitoring platform. Your role is to:

- Analyze and explain OFAC sanctions list changes, additions, and removals
- Provide context on sanctioned entities, including their significance and connections
- Explain sanctions programs, legal authorities, and compliance implications
- Help users understand the impact of sanctions changes on their compliance workflows
- Summarize daily and historical sanctions data trends
- Answer questions about SDN (Specially Designated Nationals) entries, their identifiers, and associated programs

Always be precise with entity names, ID numbers, and dates. When discussing sanctions, reference the specific OFAC program (e.g., SDGT, IRAN, CYBER2) when applicable. If you are unsure about specific details, say so clearly rather than speculating.

IMPORTANT: Only answer questions related to OFAC sanctions, compliance, and this platform. Politely decline any off-topic questions.`;

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
    latestDiff?: string;
  };
}

function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
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

  // --- Rate Limit Check ---
  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP);

  const rateLimitHeaders: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetIn / 1000)),
  };

  if (!rateCheck.allowed) {
    const resetMinutes = Math.ceil(rateCheck.resetIn / 60000);
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `You've reached the maximum of ${RATE_LIMIT_MAX_REQUESTS} queries per hour. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`,
      }),
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body: RequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // --- Input Validation ---
    // Cap conversation length
    const userMessages = body.messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    if (userMessages.length > MAX_CONVERSATION_LENGTH) {
      return new Response(
        JSON.stringify({
          error: 'Conversation too long',
          message: `Conversations are limited to ${MAX_CONVERSATION_LENGTH} messages. Please start a new chat.`,
        }),
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // Truncate overly long user messages
    const sanitizedMessages: ChatMessage[] = body.messages.map((m) => ({
      role: m.role,
      content:
        m.role === 'user' && m.content.length > MAX_MESSAGE_LENGTH
          ? m.content.slice(0, MAX_MESSAGE_LENGTH) + '...'
          : m.content,
    }));

    // Build the system message with optional context
    let systemContent = SYSTEM_PROMPT;
    if (body.context) {
      const contextParts: string[] = [];
      if (body.context.currentData) {
        contextParts.push(
          `Current sanctions data context:\n${body.context.currentData.slice(0, 1000)}`
        );
      }
      if (body.context.selectedEntity) {
        contextParts.push(
          `Currently selected entity:\n${body.context.selectedEntity.slice(0, 500)}`
        );
      }
      if (body.context.latestDiff) {
        contextParts.push(
          `Recent daily changes:\n${body.context.latestDiff.slice(0, 1000)}`
        );
      }
      if (contextParts.length > 0) {
        systemContent += '\n\n--- Context ---\n' + contextParts.join('\n\n');
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...sanitizedMessages,
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
        max_tokens: 1024,
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
        { status: groqResponse.status, headers: rateLimitHeaders }
      );
    }

    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...rateLimitHeaders,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
