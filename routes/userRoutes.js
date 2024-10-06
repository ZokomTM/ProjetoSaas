const express = require("express");
const { listUsers } = require("../controllers/usersController");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const authenticateToken = require("../middlewares/authMiddleware");
const checkSubscription = require("../middlewares/checkSubscriptionMiddleware");
const checkRolesAccess = require("../middlewares/rolesMiddleware");
const tenantLevels = require("../helpers/subscriptionTenantLevels");

const router = express.Router();

router.get(
  "/list",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  checkRolesAccess(rolesPermissions.LISTAR_USUARIOS),
  listUsers
);

module.exports = router;
