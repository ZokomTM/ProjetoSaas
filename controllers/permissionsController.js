const pool = require("../db");

const createPermissions = async (req, res) => {
  const { nome, principal, module_name } = req.body;

  if (!nome) {
    return res.status(400).json({ error: "Nome precisa ser informado!" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO permissions (name, principal, module_name) VALUES ($1, $2, $3) RETURNING *",
      [nome, principal, module_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createPermissions,
};
