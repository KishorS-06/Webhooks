const express = require("express")
const router = express.Router()

const {
  createWebhook,
  getUserWebhooks,
  deleteWebhook,
  updateWebhookConfig,
  getWebhookConfig
} = require("../controllers/webhookController")

router.post("/create", createWebhook)

router.get("/user/:userId", getUserWebhooks)

router.delete("/:id", deleteWebhook)

router.get("/:id/config", getWebhookConfig)

router.put("/:id/config", updateWebhookConfig)

module.exports = router