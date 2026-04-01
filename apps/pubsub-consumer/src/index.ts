import { PubSub } from "@google-cloud/pubsub";
import { closePool, getPool, insertHttpRequestRecord } from "@repo/db";
import type { NewHttpRequestRecord } from "@repo/types";

const subscriptionEnv = process.env.PUBSUB_SUBSCRIPTION;
if (!subscriptionEnv) {
  console.error("Missing PUBSUB_SUBSCRIPTION");
  process.exit(1);
}
const subscriptionName = subscriptionEnv;

function parsePayload(data: Buffer): NewHttpRequestRecord {
  const raw = JSON.parse(data.toString("utf8")) as Record<string, unknown>;
  const tenantId = String(raw.tenantId ?? raw.tenant_id ?? "");
  const serviceId = String(raw.serviceId ?? raw.service_id ?? "");
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
    startedAt,
    httpMethod,
    endedAt,
    responseCode,
  };
}

async function main(): Promise<void> {
  const pubsub = new PubSub();
  const subscription = pubsub.subscription(subscriptionName);

  subscription.on("message", async (message) => {
    try {
      const row = parsePayload(message.data);
      const pool = getPool();
      const id = await insertHttpRequestRecord(pool, row);
      console.log("Inserted http_request_records row", id);
      message.ack();
    } catch (err) {
      console.error("Message failed", err);
      message.nack();
    }
  });

  subscription.on("error", (err) => {
    console.error("Subscription error", err);
  });

  console.log(`Listening on subscription: ${subscriptionName}`);
}

const shutdown = async () => {
  try {
    await closePool();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
