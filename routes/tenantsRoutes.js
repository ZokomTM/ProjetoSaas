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
const checkRolesAccess = require("../middlewares/rolesMiddleware");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const router = express.Router();

router.post("/", authenticateToken, createTenant);
router.post(
  "/addUser/:userID/:tenantID/:role",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LIBERAR_TENANT, rolesPermissions.TENANTS),
  addUserToTenant
);
router.get("/list", authenticateToken, listTenant);
router.get("/:id", authenticateToken, getTenant);
router.get("/:tenantName", authenticateToken, getTenantByName);
router.post("/select/:tenantID", authenticateToken, selectTenant);

module.exports = router;
