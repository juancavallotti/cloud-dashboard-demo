import type { NewHttpRequestRecord } from "@repo/types";
import type { Pool } from "pg";

export async function insertHttpRequestRecord(
  pool: Pool,
  row: NewHttpRequestRecord
): Promise<string> {
  const id = row.id;
  if (id) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO http_request_records (id, tenant_id, service_id, resource, started_at, http_method, ended_at, response_code)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id::text`,
      [
        id,
        row.tenantId,
        row.serviceId,
        row.resource,
        row.startedAt,
        row.httpMethod,
        row.endedAt,
        row.responseCode,
      ]
    );
    return result.rows[0].id;
  }
  const result = await pool.query<{ id: string }>(
    `INSERT INTO http_request_records (tenant_id, service_id, resource, started_at, http_method, ended_at, response_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id::text`,
    [
      row.tenantId,
      row.serviceId,
      row.resource,
      row.startedAt,
      row.httpMethod,
      row.endedAt,
      row.responseCode,
    ]
  );
  return result.rows[0].id;
}
