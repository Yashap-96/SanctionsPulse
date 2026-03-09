export const config = { runtime: 'edge' };

const OFAC_BASE_URL =
  'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/';

const ALLOWED_FILES = new Set([
  'SDN.XML',
  'SDN_ADVANCED.XML',
  'SDN.CSV',
  'CONSOLIDATED.XML',
  'CONS_ADVANCED.XML',
  'CONSOLIDATED.CSV',
]);

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file || !ALLOWED_FILES.has(file)) {
    return new Response(
      JSON.stringify({
        error: 'Invalid file name',
        allowed: Array.from(ALLOWED_FILES),
      }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const response = await fetch(`${OFAC_BASE_URL}${file}`, {
      headers: {
        'User-Agent':
          'SanctionsPulse/1.0 (https://github.com/Yashap-96/SanctionsPulse)',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'OFAC API request failed',
          status: response.status,
        }),
        {
          status: response.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const contentType =
      response.headers.get('Content-Type') || 'application/octet-stream';

    return new Response(response.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch from OFAC',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
