import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.register(cors, { origin: "http://localhost:5173", credentials: true });
app.register(jwt, { secret: process.env.JWT_SECRET ?? "dev-jwt-secret" });

app.get("/health", async () => ({ ok: true, service: "auth" }));

app.listen({ port: 4001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
