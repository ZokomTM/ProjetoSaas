const express = require("express");
const {
  createRoles,
  updateRole,
  getRoleByName,
  listAllRoles,
} = require("../controllers/rolesController");
const authenticateToken = require("../middlewares/authMiddleware");
const checkRolesAccess = require("../middlewares/rolesMiddleware");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const router = express.Router();

router.post(
  "/",
  authenticateToken,
  checkRolesAccess(rolesPermissions.ADICIONAR_ROLES, rolesPermissions.ROLES),
  createRoles
);

router.put(
  "/:id",
  authenticateToken,
  checkRolesAccess(rolesPermissions.ALTERAR_ROLES, rolesPermissions.ROLES),
  updateRole
);

router.get(
  "/:name",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LISTAR_ROLES, rolesPermissions.ROLES),
  getRoleByName
);

router.get(
  "/",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LISTAR_ROLES, rolesPermissions.ROLES),
  listAllRoles
);

module.exports = router;
