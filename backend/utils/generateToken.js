const Endpoint = require("../models/WebhookEndpoint")
const Request = require("../models/WebhookRequest")
const { v4: uuidv4 } = require("uuid")

const BASE_URL = "https://dagmar-clammy-nonphenomenally.ngrok-free.dev"

exports.createWebhook = async (req, res) => {

  const { userId, name } = req.body

  const token = uuidv4()

  const endpoint = await Endpoint.create({
    userId,
    name,
    token
  })

  res.json({
    webhook_url: `${BASE_URL}/hooks/${token}`,
    token
  })
}