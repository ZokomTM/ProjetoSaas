const express = require("express");
const {
  createTenant,
  addUserToTenant,
  listTenant,
  getTenant,
  selectTenant,
  getTenantByName,
} = require("../controllers/tenantController");
const authenticateToken = require("../middlewares/authMiddleware");
const checkSubscription = require("../middlewares/checkSubscriptionMiddleware");
const tenantLevels = require("../helpers/subscriptionTenantLevels");

const router = express.Router();

router.post(
  "/create",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  createTenant
);
router.post(
  "/addUser/:userID/:tenantID/:role",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  addUserToTenant
);
router.get("/list", authenticateToken, listTenant);
router.get(
  "/:id",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  getTenant
);
router.get(
  "/name/:tenantName",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  getTenantByName
);
router.post("/select/:tenantID", authenticateToken, selectTenant);

module.exports = router;
