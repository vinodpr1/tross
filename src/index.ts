import "dotenv/config";
import express from "express";
import { startServer } from "./app.js";
import { env } from "./config/env.js";

const app = express();
app.use(startServer());

app.listen(env.port, env.host, () => {
  console.log(`API server running at http://${env.host}:${env.port}`);
});
