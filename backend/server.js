const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

/* ========================= */
/* DATABASE */
/* ========================= */

require("./db");

/* ========================= */
/* ROUTES */
/* ========================= */

const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const requestRoutes = require("./routes/requestRoutes");
const aiMetricsRoutes = require("./routes/aiMetricsRoutes");

/* ========================= */
/* MODELS */
/* ========================= */

const Endpoint = require("./models/WebhookEndpoint");
const Request = require("./models/WebhookRequest");

/* ========================= */
/* CONTROLLERS */
/* ========================= */

const { receiveWebhook } = require("./controllers/webhookController");

/* ========================= */
/* APP INIT */
/* ========================= */

const app = express();
const server = http.createServer(app);

/* ========================= */
/* CORS CONFIG */
/* ========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:62405",
  "http://127.0.0.1:50293",
  "http://127.0.0.1:*",
  "http://localhost:*"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

/* ========================= */
/* BODY PARSER */
/* ========================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ========================= */
/* SOCKET.IO */
/* ========================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* ========================= */
/* API ROUTES */
/* ========================= */

app.use("/api/auth", authRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/ai-metrics", aiMetricsRoutes);

/* ========================= */
/* WEBHOOK ENDPOINT */
/* ========================= */

app.post("/hooks/:token", receiveWebhook);
app.put("/hooks/:token", receiveWebhook);
app.patch("/hooks/:token", receiveWebhook);
app.delete("/hooks/:token", receiveWebhook);

/* ========================= */
/* GET WEBHOOK */
/* ========================= */

app.get("/hooks/:token", async (req, res) => {

  try {

    const token = req.params.token;

    if (!token) {
      return res.status(400).json({
        error: "Token is required"
      });
    }

    const endpoint = await Endpoint.findOne({
      token,
      isActive: true
    });

    /* ========================= */
    /* ENDPOINT NOT FOUND */
    /* ========================= */

    if (!endpoint) {

      const request = await Request.create({
        token,
        method: req.method,
        statusCode: 404,
        headers: req.headers,
        body: {},
        query: req.query,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        contentType: req.get("Content-Type"),
        url: req.originalUrl,
        timestamp: new Date()
      });

      const io = req.app.get("io");
      if (io) io.emit("new_webhook", request);

      return res.status(404).json({
        error: "Webhook endpoint not found or inactive"
      });

    }

    /* ========================= */
    /* STORE REQUEST */
    /* ========================= */

    const request = await Request.create({
      token,
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: {},
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      contentType: req.get("Content-Type"),
      url: req.originalUrl,
      timestamp: new Date()
    });

    const io = req.app.get("io");
    if (io) io.emit("new_webhook", request);

    /* ========================= */
    /* AUTO RESPONSE */
    /* ========================= */

    if (endpoint.autoResponse) {

      const config = endpoint.responseConfig;

      if (config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }

      if (config.headers && config.headers.length > 0) {
        config.headers.forEach(header => {
          if (header.key && header.value) {
            res.set(header.key, header.value);
          }
        });
      }

      res.set("Content-Type", config.contentType);

      try {

        const parsedBody = JSON.parse(config.body);

        return res
          .status(config.statusCode)
          .json(parsedBody);

      } catch {

        return res
          .status(config.statusCode)
          .send(config.body);

      }

    }

    /* ========================= */
    /* DEFAULT RESPONSE */
    /* ========================= */

    return res.json({
      message: "Webhook endpoint active",
      token: req.params.token,
      instruction: "Send POST request with JSON body to this URL",
      request_id: request._id,
      timestamp: request.timestamp
    });

  } catch (error) {

    console.error("GET webhook error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });

  }

});

/* ========================= */
/* ROOT ROUTE */
/* ========================= */

app.get("/", (req, res) => {
  res.send("🚀 Webhook server running");
});

/* ========================= */
/* SERVER START */
/* ========================= */

const PORT = process.env.PORT || 5001;

server.listen(PORT, '127.0.0.1', () => {

  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/hooks/{token}`);

  const publicUrl =
    process.env.PUBLIC_WEBHOOK_URL ||
    `http://localhost:${PORT}`;

  console.log(`🌍 Public URL: ${publicUrl}/hooks/{token}`);

});