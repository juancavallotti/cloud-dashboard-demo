/** Row shape for `http_request_records` (see @repo/db migrations). */
export interface HttpRequestRecord {
  id: string;
  tenantId: string;
  serviceId: string;
  startedAt: Date;
  httpMethod: string;
  endedAt: Date;
  responseCode: number;
}

/** Insert payload (server-generated `id` optional if DB default). */
export type NewHttpRequestRecord = Omit<HttpRequestRecord, "id"> & {
  id?: string;
};
