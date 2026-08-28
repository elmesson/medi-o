export function log(event: string, data: any = {}) {
  const entry = { ts: new Date().toISOString(), event, ...data };
  console.log(JSON.stringify(entry));
  // Em prod: enviar para Sentry / OpenTelemetry / Datadog
  // Sentry.captureMessage(event, { extra: data });
}
export function track(metric: string, value: number, tags: Record<string,string> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), metric, value, tags }));
}
