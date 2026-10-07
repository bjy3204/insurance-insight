// Never log request URLs, response bodies or Error.message: they may contain API keys.
export function logTrafficFailure(service: 'events' | 'flow' | 'cctv', failure: unknown) {
  const error = failure as { name?: unknown; code?: unknown; cause?: { code?: unknown } } | null;
  const safeToken = (value: unknown) => typeof value === 'string' && /^[A-Za-z0-9_]{1,64}$/.test(value) ? value : undefined;
  console.error('[ITS connection failed]', {
    service,
    region: safeToken(process.env.VERCEL_REGION),
    name: safeToken(error?.name),
    code: safeToken(error?.cause?.code) || safeToken(error?.code),
  });
}
