import type { NewHttpRequestRecord } from "@repo/types";

export function parseIngestPayload(data: Buffer): NewHttpRequestRecord {
  const raw = JSON.parse(data.toString("utf8")) as Record<string, unknown>;
  const tenantId = String(raw.tenantId ?? raw.tenant_id ?? "");
  const serviceId = String(raw.serviceId ?? raw.service_id ?? "");
  const resource = String(raw.resource ?? "");
  const httpMethod = String(raw.httpMethod ?? raw.http_method ?? "GET");
  const responseCode = Number(raw.responseCode ?? raw.response_code ?? 0);
  const startedAt = new Date(String(raw.startedAt ?? raw.started_at ?? Date.now()));
  const endedAt = new Date(String(raw.endedAt ?? raw.ended_at ?? Date.now()));
  const id = raw.id != null ? String(raw.id) : undefined;
  if (!tenantId || !serviceId) {
    throw new Error("tenantId and serviceId are required");
  }
  return {
    id,
    tenantId,
    serviceId,
    resource,
    startedAt,
    httpMethod,
    endedAt,
    responseCode,
  };
}
