const express = require("express")
const router = express.Router()

const {
  getUserRequests,
  getRequestsByToken,
  getRequestById,
  analyzeRequest,
  securityScan
} = require("../controllers/requestController")

router.get("/user/:userId", getUserRequests)
router.get("/:token", getRequestsByToken)
router.get("/detail/:id", getRequestById)
router.post("/analyze/:id", analyzeRequest)
router.post("/security-scan/:id", securityScan)

module.exports = router