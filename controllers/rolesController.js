const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const createRoles = async (req, res) => {
  const { name, description } = req.body;
  const tenantId = req.user.tenantId;

  if (!name) {
    return res.status(400).json({ error: "Nome precisa ser informado!" });
  }

  if (!description) {
    return res.status(400).json({ error: "Descrição precisa ser informado!" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO roles (name, description, tenant_id) VALUES ($1,$2,$3) RETURNING *",
      [name, description, tenantId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRole = async (req, res) => {
  const { description } = req.body;
  const id = req.params.id;
  const tenantId = req.user.tenantId;

  if (!description) {
    return res.status(400).json({ error: "Descrição precisa ser informado!" });
  }

  try {
    const roleExists = await recordExists(
      "SELECT id FROM roles WHERE id = $1 AND tenant_id = $2",
      [id, tenantId]
    );
    if (!roleExists) {
      return res.status(404).json({ error: "Role not found" });
    }

    const result = await pool.query(
      "UPDATE roles SET description = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *",
      [description, id, tenantId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRoleByName = async (req, res) => {
  const { name } = req.params;
  const tenantId = req.user.tenantId;

  try {
    const result = await pool.query(
      "SELECT roles.id, roles.name, roles.description FROM roles WHERE name = $1 AND tenant_id = $2",
      [name, tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRoleById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  console.log(id, tenantId);
  try {
    const result = await pool.query(
      "SELECT roles.id, roles.name, roles.description FROM roles WHERE id = $1 AND tenant_id = $2",
      [id, tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listAllRoles = async (req, res) => {
  const tenantId = req.user.tenantId;
  try {
    const result = await pool.query(
      "SELECT * FROM roles WHERE tenant_id = $1",
      [tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRoles,
  updateRole,
  getRoleByName,
  getRoleById,
  listAllRoles,
};
