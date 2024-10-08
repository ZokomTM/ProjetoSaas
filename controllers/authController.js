const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const register = async (req, res) => {
  const { username, password, subscription_level, email, telefone, nickname } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const userExists = await recordExists(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userExists) {
      return res.status(409).json({ error: "Nome de usuário já está em uso!" });
    }

    if (!password || password == "") {
      return res.status(400).json({ error: "Senha deve ser informada!" });
    }

    const result = await pool.query(
      "INSERT INTO users (username, password, subscription_level, email, telefone, nickname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        username,
        hashedPassword,
        subscription_level || "free",
        email,
        telefone,
        nickname || username,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {
          id: user.id,
          subscription_level: user.subscription_level,
        },
        "your_jwt_secret",
        { expiresIn: "3h" }
      );
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listUsers = async (req, res) => {
  const tenantId = req.params.tenantID;

  try {
    const result = await pool.query(
      "select users.username, users.subscription_level, users.email, users.telefone, users.nickname  " +
        " from user_tenants" +
        " inner join users on users.id = user_tenants.user_id " +
        " where user_tenants.tenant_id = $1;",
      [tenantId]
    );
    const users = result.rows;

    if (users) {
      res.status(200).json({ users: users });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  listUsers,
};
