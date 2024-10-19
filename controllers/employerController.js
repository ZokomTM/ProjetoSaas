// employerController.js
const pool = require("../db");
const tenantController = require("./tenantController"); // Import tenantController
const { recordExists } = require("../helpers/dbHelpers");

const createEmployer = async (req, res) => {
  const {
    nome,
    email,
    salario,
    comissao,
    webhook,
    discordID,
    contratacao,
    roles,
  } = req.body;
  const tenantID = req.user.tenantId;

  if (!nome) {
    return res.status(400).json({ error: "Nome deve ser informado!" });
  }
  if (!email) {
    return res.status(400).json({ error: "Email deve ser informado!" });
  }

  const rolesExists = await recordExists(
    "SELECT id FROM roles WHERE id > 0 AND tenant_id = $1 and name = $2",
    [tenantID, roles]
  );

  if (!rolesExists) {
    return res.status(404).json({ error: "Role not found" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO funcionarios (tenant_id, nome, email, roles, salarios, comissao, webhook, discordID, contratacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        tenantID,
        nome,
        email,
        roles,
        salario || 0,
        comissao || 0,
        webhook || "",
        discordID || "",
        contratacao || new Date(),
      ]
    );

    // verifica se usuario do email existe e já libera permissao para ele no tenant
    if (email) {
      const userByEmail = await pool.query(
        "select id from users where users.id > 0 and users.email = $1;",
        [email]
      );
      if (userByEmail.rows.length > 0) {
        try {
          await tenantController.addUserToTenantIntern({
            params: {
              tenantID: tenantID,
              userID: userByEmail.rows[0].id,
              role: roles,
            },
          });

          res.status(201).json("Funcionário criado e vinculado ao tenant");
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createEmployer,
};
