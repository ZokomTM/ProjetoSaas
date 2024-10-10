const express = require("express");
const {} = require("../controllers/tenantController");
const authenticateToken = require("../middlewares/authMiddleware");
const checkSubscription = require("../middlewares/checkSubscription");
const tenantLevels = require("../helpers/subscriptionTenantLevels");

const router = express.Router();

module.exports = router;
