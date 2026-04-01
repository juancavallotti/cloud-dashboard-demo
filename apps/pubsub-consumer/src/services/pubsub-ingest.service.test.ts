import { describe, expect, it, vi } from "vitest";
import type { HttpIngestPersistence } from "@repo/types";
import { PubSubIngestService } from "./pubsub-ingest.service.js";

function mockPersistence(): HttpIngestPersistence {
  return {
    insertHttpRequestRecord: vi.fn().mockResolvedValue("new-id"),
  };
}

describe("PubSubIngestService", () => {
  it("parses camelCase payload and persists", async () => {
    const persistence = mockPersistence();
    const svc = new PubSubIngestService(persistence);
    const buf = Buffer.from(
      JSON.stringify({
        tenantId: "t1",
        serviceId: "s1",
        httpMethod: "POST",
        responseCode: 201,
        startedAt: "2026-04-01T10:00:00.000Z",
        endedAt: "2026-04-01T10:00:01.000Z",
      }),
      "utf8"
    );
    const id = await svc.ingestMessage(buf);
    expect(id).toBe("new-id");
    expect(persistence.insertHttpRequestRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        serviceId: "s1",
        httpMethod: "POST",
        responseCode: 201,
      })
    );
  });

  it("parses snake_case payload", async () => {
    const persistence = mockPersistence();
    const svc = new PubSubIngestService(persistence);
    const buf = Buffer.from(
      JSON.stringify({
        tenant_id: "ta",
        service_id: "sb",
        http_method: "GET",
        response_code: 200,
      }),
      "utf8"
    );
    await svc.ingestMessage(buf);
    expect(persistence.insertHttpRequestRecord).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "ta", serviceId: "sb" })
    );
  });

  it("throws when tenant is missing", () => {
    const svc = new PubSubIngestService(mockPersistence());
    const buf = Buffer.from(JSON.stringify({ serviceId: "s" }), "utf8");
    expect(() => svc.parsePayload(buf)).toThrow(/tenantId/);
  });
});
