const pool = require("../db");
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Bem-vindo à API!");
});

router.post("/users", async (req, res) => {
  const { name, age } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (name, age) VALUES ($1, $2) RETURNING *",
      [name, age]
    );
    res.json({
      message: "Usuário adicionado com sucesso",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar usuário" });
  }
});

module.exports = router;
