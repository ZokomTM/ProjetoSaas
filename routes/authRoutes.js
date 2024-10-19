const express = require("express");
const { register, login, valid } = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/valid", authenticateToken, valid);

module.exports = router;
