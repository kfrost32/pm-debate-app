// Vercel Edge Function for proxying Anthropic API requests
export const config = {
  runtime: 'edge',
};

// Rate limiting: 5 debates per hour per user
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function getRateLimitInfo(cookies: string): { count: number; resetTime: number } {
  const match = cookies.match(/rate_limit=([^;]+)/);
  if (!match) return { count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW };

  try {
    const data = JSON.parse(decodeURIComponent(match[1]));
    return data;
  } catch {
    return { count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW };
  }
}

function setRateLimitCookie(count: number, resetTime: number): string {
  const data = JSON.stringify({ count, resetTime });
  return `rate_limit=${encodeURIComponent(data)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${RATE_LIMIT_WINDOW / 1000}`;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check rate limit
  const cookies = req.headers.get('cookie') || '';
  const rateLimitInfo = getRateLimitInfo(cookies);
  const now = Date.now();

  // Reset if window has passed
  if (now > rateLimitInfo.resetTime) {
    rateLimitInfo.count = 0;
    rateLimitInfo.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Check if over limit
  if (rateLimitInfo.count >= RATE_LIMIT_REQUESTS) {
    const minutesLeft = Math.ceil((rateLimitInfo.resetTime - now) / 60000);
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. You can make ${RATE_LIMIT_REQUESTS} debates per hour. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': setRateLimitCookie(rateLimitInfo.count, rateLimitInfo.resetTime)
        },
      }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();

    // Forward the request to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    // Increment rate limit counter
    rateLimitInfo.count += 1;

    // Stream the response back with updated rate limit cookie
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/event-stream',
        'Set-Cookie': setRateLimitCookie(rateLimitInfo.count, rateLimitInfo.resetTime),
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
