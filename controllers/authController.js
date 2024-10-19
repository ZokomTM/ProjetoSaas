const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const register = async (req, res) => {
  const { username, password, email, telefone, nickname } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (!username || username == "") {
      return res
        .status(409)
        .json({ error: "Nome de usuário deve ser informado!" });
    }

    if (!email || email == "") {
      return res.status(409).json({ error: "E-mail deve ser informado!" });
    }

    if (!password || password == "") {
      return res.status(409).json({ error: "Senha deve ser informado!" });
    }

    const userExists = await recordExists(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userExists) {
      return res.status(409).json({ error: "Nome de usuário já está em uso!" });
    }

    const emailExists = await recordExists(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (emailExists) {
      return res.status(409).json({ error: "E-mail já está em uso!" });
    }

    if (!password || password == "") {
      return res.status(400).json({ error: "Senha deve ser informada!" });
    }

    const result = await pool.query(
      "INSERT INTO users (username, password, subscription_level, email, telefone, nickname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [username, hashedPassword, "free", email, telefone, nickname || username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        subscription_level: user.subscription_level,
      },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const valid = async (req, res) => {
  res.status(200).json({ valid: true });
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
  valid,
  listUsers,
};
