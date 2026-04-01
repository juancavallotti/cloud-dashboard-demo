import type { HttpIngestPersistence, NewHttpRequestRecord } from "@repo/types";
import { parseIngestPayload } from "../lib/parse-ingest-payload.js";

export class PubSubIngestService {
  constructor(private readonly persistence: HttpIngestPersistence) {}

  parsePayload(data: Buffer): NewHttpRequestRecord {
    return parseIngestPayload(data);
  }

  async ingestMessage(data: Buffer): Promise<string> {
    const row = this.parsePayload(data);
    return this.persistence.insertHttpRequestRecord(row);
  }
}
