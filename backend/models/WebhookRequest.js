const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    default: 200
  },
  headers: {
    type: Object,
    default: {}
  },
  body: {
    type: Object,
    default: {}
  },
  query: {
    type: Object,
    default: {}
  },
  ip: {
    type: String,
    default: ''
  },
  location: {
    country: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    region: { type: String, default: 'Unknown' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    isp: { type: String, default: 'Unknown' },
    timezone: { type: String, default: 'Unknown' }
  },
  service: {
    name: { type: String, default: 'Unknown' },
    confidence: { type: Number, default: 0 },
    details: { type: Object, default: {} }
  },
  analysis: {
    anomalies: { type: Array, default: [] },
    riskLevel: { type: String, default: 'low' },
    pattern: { type: Object, default: {} }
  },
  userAgent: {
    type: String,
    default: ''
  },
  contentType: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
})

module.exports = mongoose.model("WebhookRequest", Schema)