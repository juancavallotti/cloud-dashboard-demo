import type { RetentionPersistence } from "@repo/types";

export class RetentionService {
  constructor(private readonly persistence: RetentionPersistence) {}

  async run(retentionDays: number): Promise<{ deleted: number; retentionDays: number }> {
    const deleted = await this.persistence.deleteHttpRequestRecordsOlderThanDays(retentionDays);
    return { deleted, retentionDays };
  }
}
