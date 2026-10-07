// Fixed official hosts only; no credentials or user supplied destination.
declare const Deno: { serve(handler: (request: Request) => Promise<Response>): void };
Deno.serve(async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405 });
  const targets = [
    ['api-tls', 'https://openapi.its.go.kr:9443/'],
    ['api-http', 'http://openapi.its.go.kr/'],
    ['api-https', 'https://openapi.its.go.kr/'],
    ['official-site', 'https://www.its.go.kr/'],
  ];
  const results = await Promise.all(targets.map(async ([name, url]) => {
    const started = Date.now();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'manual' });
      await response.body?.cancel();
      return { name, connected: true, upstreamStatus: response.status, elapsedMs: Date.now() - started };
    } catch { return { name, connected: false, elapsedMs: Date.now() - started }; }
  }));
  return Response.json({ results });
});
export {};
