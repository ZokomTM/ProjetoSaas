const express = require("express");
const { createEmployer } = require("../controllers/employerController");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const authenticateToken = require("../middlewares/authMiddleware");
const checkRolesAccess = require("../middlewares/rolesMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  checkRolesAccess(
    rolesPermissions.ADICIONAR_FUNCIONARIO,
    rolesPermissions.FUNCIONARIOS
  ),
  createEmployer
);

module.exports = router;
