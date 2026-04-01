import { PubSub } from "@google-cloud/pubsub";
import { closePool, createPgHttpIngestPersistence, getPool } from "@repo/db";
import { PubSubIngestService } from "./services/pubsub-ingest.service.js";

const subscriptionEnv = process.env.PUBSUB_SUBSCRIPTION;
if (!subscriptionEnv) {
  console.error("Missing PUBSUB_SUBSCRIPTION");
  process.exit(1);
}
const subscriptionName = subscriptionEnv;

const pool = getPool();
const ingestService = new PubSubIngestService(createPgHttpIngestPersistence(pool));

async function main(): Promise<void> {
  const pubsub = new PubSub();
  const subscription = pubsub.subscription(subscriptionName);

  subscription.on("message", async (message) => {
    try {
      const id = await ingestService.ingestMessage(message.data);
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
