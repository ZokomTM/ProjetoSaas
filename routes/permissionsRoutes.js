const express = require("express");
const { createPermissions } = require("../controllers/permissionsController");
const authenticateToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authenticateToken, createPermissions);

module.exports = router;
