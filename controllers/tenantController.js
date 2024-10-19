const jwt = require("jsonwebtoken");
const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const createTenant = async (req, res) => {
  const { name, subscription_level, email, server } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const userByID = await pool.query(
      "SELECT id, nickname FROM users WHERE id = $1;",
      [userId]
    );
    if (!userByID.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const tenantResult = await pool.query(
      "INSERT INTO tenants (name, responsible_username, subscription_level, email, server, expiration_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        name,
        userByID.rows[0].nickname,
        subscription_level || "basic",
        email,
        server,
        expirationDate,
      ]
    );

    const tenantId = tenantResult.rows[0].id;

    await permissionsDefault(tenantId); // cria roles padrões
    await release(tenantId, userId, "owner"); // libera permissão para o usuário que criou tenant

    res.status(201).json(tenantResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addUserToTenant = async (req, res) => {
  const { tenantID, userID, role } = req.params;

  try {
    const [tenantExists, userExists] = await Promise.all([
      recordExists("SELECT id FROM tenants WHERE id = $1", [tenantID]),
      recordExists("SELECT id FROM users WHERE id = $1", [userID]),
    ]);

    if (!tenantExists || !userExists) {
      return res.status(404).json({ error: "Tenant or User not found" });
    }

    const roleValues = await pool.query(
      "SELECT id FROM roles WHERE tenant_id = $1 AND name = $2",
      [tenantID, role]
    );

    if (!roleValues.rows.length) {
      return res.status(404).json({ error: "Role not found" });
    }

    const result = await pool.query(
      "INSERT INTO user_tenants (user_id, tenant_id, roles_id) VALUES ($1, $2, $3) RETURNING *",
      [userID, tenantID, roleValues.rows[0].id]
    );

    await pool.query(
      "UPDATE tenants SET number_of_users = number_of_users + 1 WHERE id = $1",
      [tenantID]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addUserToTenantIntern = async (req, res) => {
  const { tenantID, userID, role } = req.params;

  try {
    const [tenantExists, userExists] = await Promise.all([
      recordExists("SELECT id FROM tenants WHERE id = $1", [tenantID]),
      recordExists("SELECT id FROM users WHERE id = $1", [userID]),
    ]);

    if (!tenantExists || !userExists) {
      throw new Error("Tenant or User not found");
    }

    const roleValues = await pool.query(
      "SELECT id FROM roles WHERE tenant_id = $1 AND name = $2",
      [tenantID, role]
    );

    if (!roleValues.rows.length) {
      throw new Error("Role not found");
    }

    const result = await pool.query(
      "INSERT INTO user_tenants (user_id, tenant_id, roles_id) VALUES ($1, $2, $3) RETURNING *",
      [userID, tenantID, roleValues.rows[0].id]
    );

    await pool.query(
      "UPDATE tenants SET number_of_users = number_of_users + 1 WHERE id = $1",
      [tenantID]
    );

    return result.rows[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const listTenant = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT tenants.id, tenants.name, tenants.responsible_username, tenants.server FROM tenants INNER JOIN user_tenants ON tenants.id = user_tenants.tenant_id WHERE user_tenants.user_id = $1",
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

    const result = await pool.query(
      "SELECT tenants.id, tenants.name, tenants.responsible_username, tenants.server FROM tenants WHERE id = $1",
      [tenantId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTenantByName = async (req, res) => {
  const tenantName = req.params.tenantName;

  if (!tenantName) {
    return res.status(400).json({ error: "Tenant name is required" });
  }

  try {
    const tenantExists = await recordExists(
      "SELECT * FROM tenants WHERE name = $1",
      [tenantName]
    );
    if (!tenantExists) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await pool.query("SELECT * FROM tenants WHERE name = $1", [
      tenantName,
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
      "SELECT tenants.*, user_tenants.roles_id, roles.name as role FROM tenants" +
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
      "INSERT INTO user_login_tenants (user_id, tenant_id, token) VALUES ($1, $2, $3)",
      [userId, tenantId, token]
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function createRoles(tenantID) {
  const adminResult = await pool.query(
    "INSERT INTO roles (name, description, tenant_id) VALUES ('ADMIN','Cargo que terá funções administrativas liberada', $1) RETURNING *",
    [tenantID]
  );

  const userResult = await pool.query(
    "INSERT INTO roles (name, description, tenant_id) VALUES ('USER','Cargo que terá funções simples de usuário liberado', $1) RETURNING *",
    [tenantID]
  );

  const ownerResult = await pool.query(
    "INSERT INTO roles (name, description, tenant_id) VALUES ('OWNER','Cargo referente ao dono do tenant, quem criou o mesmo', $1) RETURNING *",
    [tenantID]
  );

  return {
    admin: adminResult.rows[0],
    user: userResult.rows[0],
    owner: ownerResult.rows[0],
  };
}

async function assignDefaultPermissions(admin, user, owner) {
  const rolePermissions = {
    admin: [1, 10], // Permissions for admin
    user: [5, 10], // Permissions for user
    owner: [1, 10], // Permissions for owner
  };

  const roles = { admin, user, owner };

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = roles[roleName];
    if (role) {
      for (const permissionId of permissions) {
        await pool.query(
          "INSERT INTO roles_permissions (roles_id, permissions_id) VALUES ($1, $2)",
          [role.id, permissionId]
        );
      }
    }
  }
}

async function permissionsDefault(tenantID) {
  const { admin, user, owner } = await createRoles(tenantID);
  await assignDefaultPermissions(admin, user, owner);
}

async function release(tenantID, userID, role) {
  try {
    await addUserToTenantIntern({
      params: {
        tenantID: tenantID,
        userID: userID,
        role: role,
      },
    });
  } catch (err) {
    return err.message;
  }
}

module.exports = {
  createTenant,
  addUserToTenant,
  addUserToTenantIntern,
  listTenant,
  getTenant,
  getTenantByName,
  selectTenant,
};
