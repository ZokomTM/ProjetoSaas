const pool = require("../db");

const listUsers = async (req, res) => {
  const tenantId = req.user.tenantId;

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
  listUsers,
};
