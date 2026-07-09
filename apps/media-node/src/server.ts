import cors from "cors";
import express from "express";
import os from "node:os";
import path from "node:path";

const app = express();

const port = Number(process.env.PORT ?? 8080);
const nodeName = process.env.NODE_NAME ?? os.hostname();
const allowedOrigin =
  process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

const mediaDirectory = path.resolve(process.env.MEDIA_DIR ?? "media");

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Range", "Content-Type", "Authorization"],
    exposedHeaders: [
      "Content-Length",
      "Content-Range",
      "Accept-Ranges",
      "X-Served-By",
    ],
  }),
);

app.use((request, response, next) => {
  response.setHeader("X-Served-By", nodeName);

  console.log(
    JSON.stringify({
      node: nodeName,
      method: request.method,
      path: request.path,
      time: new Date().toISOString(),
    }),
  );

  next();
});

app.get("/health", (_request, response) => {
  response.json({
    status: "healthy",
    service: "media-node",
    node: nodeName,
    time: new Date().toISOString(),
  });
});

app.use(
  "/media",
  express.static(mediaDirectory, {
    acceptRanges: true,
    etag: true,
    maxAge: "5m",
  }),
);

app.listen(port, "0.0.0.0", () => {
  console.log(`media-node ${nodeName} listening on port ${port}`);
  console.log(`Serving media from ${mediaDirectory}`);
});