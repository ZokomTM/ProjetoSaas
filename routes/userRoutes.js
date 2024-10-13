const express = require("express");
const { listUsers } = require("../controllers/usersController");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const authenticateToken = require("../middlewares/authMiddleware");
const checkRolesAccess = require("../middlewares/rolesMiddleware");
const tenantLevels = require("../helpers/subscriptionTenantLevels");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LISTAR_USUARIOS, rolesPermissions.USUARIOS),
  listUsers
);

module.exports = router;
