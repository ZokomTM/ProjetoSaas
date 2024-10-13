const pool = require("../db");

const tenantLevels = require("../helpers/subscriptionTenantLevels");

const checkRolesAccess = (rolesPermissions, roleMaster) => {
  return async (req, res, next) => {
    const { tenantId, roleId, roles } = req.user;
    const result = await pool.query(
      "select permissions.*" +
        " from roles" +
        " inner join roles_permissions on roles_permissions.roles_id = roles.id" +
        " inner join permissions on permissions.id = roles_permissions.permissions_id and permissions.name in ($1, $2)" +
        " where roles.name = $3 and roles.tenant_id = $4 and roles.id = $5;",
      [rolesPermissions, roleMaster, roles, tenantId, roleId]
    );

    if (result.rows.length > 0) {
      next();
    } else {
      res.status(403).json({ error: "Access denied user not access" });
    }
  };
};

module.exports = checkRolesAccess;
