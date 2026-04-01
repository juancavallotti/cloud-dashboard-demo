import { describe, expect, it, vi } from "vitest";
import type { RetentionPersistence } from "@repo/types";
import { RetentionService } from "./retention.service.js";

describe("RetentionService", () => {
  it("delegates to persistence and returns counts", async () => {
    const persistence: RetentionPersistence = {
      deleteHttpRequestRecordsOlderThanDays: vi.fn().mockResolvedValue(42),
    };
    const svc = new RetentionService(persistence);
    const result = await svc.run(90);
    expect(result).toEqual({ deleted: 42, retentionDays: 90 });
    expect(persistence.deleteHttpRequestRecordsOlderThanDays).toHaveBeenCalledWith(90);
  });
});
