import Fastify from "fastify";
import { OP } from "@yap/protocol";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "chat" }));

app.get("/gateway/hello", async () => ({
  op: OP.HELLO,
  d: { heartbeat_interval: 41250 },
}));

app.listen({ port: 4002, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
