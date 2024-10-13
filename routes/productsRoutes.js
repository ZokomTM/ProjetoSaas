const express = require("express");
const {
  createProduct,
  updateProduct,
  getProductsByName,
  listProduct,
} = require("../controllers/productsController");
const checkRolesAccess = require("../middlewares/rolesMiddleware");
const authenticateToken = require("../middlewares/authMiddleware");
const rolesPermissions = require("../helpers/rolesPermissionsLevel");
const router = express.Router();

router.post(
  "/",
  authenticateToken,
  checkRolesAccess(rolesPermissions.CRIAR_PRODUTO, rolesPermissions.PRODUTOS),
  createProduct
);

router.put(
  "/:id",
  authenticateToken,
  checkRolesAccess(rolesPermissions.ALTERAR_PRODUTO, rolesPermissions.PRODUTOS),
  updateProduct
);

router.get(
  "/:name",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LISTAR_PRODUTO, rolesPermissions.PRODUTOS),
  getProductsByName
);

router.get(
  "/",
  authenticateToken,
  checkRolesAccess(rolesPermissions.LISTAR_PRODUTO, rolesPermissions.PRODUTOS),
  listProduct
);

module.exports = router;
