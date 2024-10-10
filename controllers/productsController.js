const jwt = require("jsonwebtoken");
const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const createProduct = async (req, res) => {
  const { nome, peso, data_desativacao, tipo_produto } = req.body;

  const tipoProduto = ["Venda", "Compra", "Estoque", "Fabricação"];

  const tipoProdutoIndex = tipoProduto.indexOf(tipo_produto);

  if (!nome) {
    return res.status(400).json({ error: "Nome precisa ser informado!" });
  }
  if (!peso) {
    return res.status(400).json({ error: "Peso precisa ser informado!" });
  }
  if (!data_desativacao) {
    return res
      .status(400)
      .json({ error: "Data desativação precisa ser informado!" });
  }
  if (!tipo_produto) {
    return res.status(400).json({
      error: "Tipo do produto deve ser informado precisa ser informado!",
    });
  }
  if (tipoProdutoIndex == -1) {
    return res.status(400).json({
      error:
        "Tipo do produto deve ser um desses Venda, Compra, Estoque, Fabricação!",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO produtos (nome, peso, data_desativacao, tipo_produto) " +
        " VALUES ($1, $2, $3, $4) "[
          (nome, peso, data_desativacao, tipo_produto)
        ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createProduct,
};
