const jwt = require("jsonwebtoken");
const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const createTenant = async (req, res) => {
  const { name, usuario_responsavel, subscription_level, email, servidor } =
    req.body;

  if (!name) {
    return res
      .status(400)
      .json({ error: "Name and usuario_responsavel are required" });
  }

  try {
    if (usuario_responsavel) {
      const userExists = await recordExists(
        "SELECT id FROM users WHERE username = $1",
        [usuario_responsavel]
      );
      if (!userExists) {
        return res.status(404).json({ error: "usuario_responsavel not found" });
      }
    }

    const result = await pool.query(
      "INSERT INTO tenants (name, usuario_responsavel, subscription_level, email, servidor) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, usuario_responsavel, subscription_level || "free", email, servidor]
    );

    permissionsDefault(result.rows[0].id); // cria roles padrões
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addUserToTenant = async (req, res) => {
  const tenantID = req.params.tenantID;
  const userID = req.params.userID;
  const role = req.params.role;

  try {
    const tenantExists = await recordExists(
      "SELECT id FROM tenants WHERE id = $1",
      [tenantID]
    );
    const userExists = await recordExists(
      "SELECT id FROM users WHERE id = $1",
      [userID]
    );
    const roleExists = await recordExists(
      "SELECT id FROM roles WHERE tenant_id = $1 and name = $2",
      [tenantID, role]
    );

    if (!tenantExists || !userExists || !roleExists) {
      return res
        .status(404)
        .json({ error: "Tenant or User or Role not found" });
    }

    const roleValues = await pool.query(
      "SELECT id FROM roles WHERE tenant_id = $1 and name = $2",
      [tenantID, role]
    );

    const result = await pool.query(
      "INSERT INTO user_tenants (user_id, tenant_id, roles_id) VALUES ($1, $2, $3) RETURNING *",
      [userID, tenantID, roleValues.rows[0].id]
    );

    await pool.query(
      "UPDATE tenants set numberOfUsers = numberOfUsers + 1 WHERE id = $1",
      [tenantID]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listTenant = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT tenants.* FROM tenants INNER JOIN user_tenants ON tenants.id = user_tenants.tenant_id WHERE user_tenants.user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTenant = async (req, res) => {
  const tenantId = req.params.id;

  if (!tenantId) {
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  try {
    const tenantExists = await recordExists(
      "SELECT * FROM tenants WHERE id = $1",
      [tenantId]
    );
    if (!tenantExists) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await pool.query("SELECT * FROM tenants WHERE id = $1", [
      tenantId,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTenantByName = async (req, res) => {
  const tenantName = req.params.tenantName;

  if (!tenantName) {
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  try {
    const tenantExists = await recordExists(
      "SELECT * FROM tenants WHERE name = $1",
      [tenantName]
    );
    if (!tenantExists) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await pool.query("SELECT * FROM tenants WHERE id = $1", [
      tenantId,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const selectTenant = async (req, res) => {
  const userId = req.user.id;
  const tenantId = req.params.tenantID;

  if (!userId || !tenantId) {
    return res
      .status(400)
      .json({ error: "User ID and Tenant ID are required" });
  }

  try {
    const result = await pool.query(
      "SELECT tenants.*, user_tenants.roles_id, roles.name as role  FROM tenants" +
        " INNER JOIN user_tenants ON tenants.id = user_tenants.tenant_id" +
        " INNER JOIN roles ON roles.id = user_tenants.roles_id" +
        " WHERE user_tenants.user_id = $1 AND tenants.id = $2",
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Tenant not found or not associated with the user" });
    }

    const tenant = result.rows[0];
    const token = jwt.sign(
      {
        id: userId,
        tenantId: tenant.id,
        roleId: tenant.roles_id,
        subscription_level: tenant.subscription_level,
        roles: tenant.role,
      },
      "your_jwt_secret",
      { expiresIn: "3h" }
    );

    await pool.query(
      "INSERT INTO logins_users_tenants (user_id, tenant_id, token) VALUES ($1, $2, $3)",
      [userId, tenantId, token]
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function permissionsDefault(tenantID) {
  const adminResult = await pool.query(
    "INSERT INTO roles (name, description, tenant_id) VALUES ('ADMIN','Cargo que terá funções administrativas liberada', $1) RETURNING *",
    [tenantID]
  );

  const userResult = await pool.query(
    "INSERT INTO roles (name, description, tenant_id) VALUES ('USER','Cargo que terá funções simples de usuário liberado', $1) RETURNING *",
    [tenantID]
  );

  const admin = adminResult.rows[0];
  if (admin) {
    // Adiciona todas as permissões de usuários
    await pool.query(
      "INSERT INTO roles_permissions (roles_id, permissions_id) VALUES ($1, $2)",
      [admin.id, 1]
    );

    // Permissão referente a consulta de cargos
    await pool.query(
      "INSERT INTO roles_permissions (roles_id, permissions_id) VALUES ($1, $2)",
      [admin.id, 10]
    );
  }

  const user = userResult.rows[0];
  if (user) {
    // Permissão referente a consulta de usuários
    await pool.query(
      "INSERT INTO roles_permissions (roles_id, permissions_id) VALUES ($1, $2)",
      [user.id, 5]
    );

    // Permissão referente a consulta de cargos
    await pool.query(
      "INSERT INTO roles_permissions (roles_id, permissions_id) VALUES ($1, $2)",
      [user.id, 10]
    );
  }
}

module.exports = {
  createTenant,
  addUserToTenant,
  listTenant,
  getTenant,
  getTenantByName,
  selectTenant,
};
