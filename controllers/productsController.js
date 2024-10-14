const pool = require("../db");
const { recordExists } = require("../helpers/dbHelpers");

const createProduct = async (req, res) => {
  const {
    nome,
    cor,
    peso,
    descricao,
    preco_custo,
    preco_venda,
    data_desativacao,
    baixa_estoque,
    baixa_caixa,
    tipo_produto,
  } = req.body;
  const tenant_id = req.user.tenantId;

  if (!nome) {
    return res.status(400).json({ error: "Nome precisa ser informado!" });
  }
  if (!preco_custo) {
    // TODO: Fazer consulta de custo na tabela de custos
  }
  if (!preco_venda) {
    return res
      .status(400)
      .json({ error: "Preço venda precisa ser informado!" });
  }
  if (!tipo_produto) {
    return res.status(400).json({
      error: "Tipo do produto deve ser informado precisa ser informado!",
    });
  }

  const categoriaExist = await recordExists(
    "select nome from categoria_produtos where tenant_id = $1 and nome = $2;",
    [tenant_id, tipo_produto]
  );
  if (!categoriaExist) {
    return res.status(400).json({
      error: "Tipo do produto informado não cadastrado!",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO produtos (tenant_id, nome, cor, descricao, peso, preco_custo, preco_venda, data_desativacao, baixa_estoque, baixa_caixa, tipo_produto) " +
        " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING produtos.id, produtos.nome, produtos.descricao, produtos.cor, produtos.peso, produtos.preco_custo, produtos.preco_venda, produtos.data_desativacao, produtos.tipo_produto, produtos.baixa_estoque, produtos.baixa_caixa",
      [
        tenant_id,
        nome,
        cor,
        descricao || "",
        peso || 0,
        preco_custo,
        preco_venda,
        data_desativacao || null,
        baixa_estoque || false,
        baixa_caixa || false,
        tipo_produto,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const {
    nome,
    cor,
    peso,
    descricao,
    preco_custo,
    preco_venda,
    data_desativacao,
    baixa_estoque,
    baixa_caixa,
    tipo_produto,
  } = req.body;
  const tenantId = req.user.tenantId;
  const { productID } = req.params;

  if (!nome) {
    return res.status(400).json({ error: "Nome precisa ser informado!" });
  }
  if (!preco_custo) {
    // TODO: Fazer consulta de custo na tabela de custos
    try {
      const result = await pool.query(
        "select sum(produtos.preco_custo*produtos_componentes.quantidade) as custo " +
          " from produtos_componentes" +
          " inner join produtos on produtos.id = produtos_componentes.produto_utilizado and produtos.tenant_id = produtos_componentes.tenant_id" +
          " where produtos_componentes.produto_base = 1 and produtos_componentes.tenant_id = 19;" +
          [productID, tenantId]
      );

      console.log(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  if (!preco_venda) {
    return res
      .status(400)
      .json({ error: "Preço venda precisa ser informado!" });
  }
  if (!tipo_produto) {
    return res.status(400).json({
      error: "Tipo do produto deve ser informado precisa ser informado!",
    });
  }

  const categoriaExist = await recordExists(
    "select nome from categoria_produtos where tenant_id = $1 and nome = $2;",
    [tenantId, tipo_produto]
  );
  if (!categoriaExist) {
    return res.status(400).json({
      error: "Tipo do produto informado não cadastrado!",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE produtos SET nome = $1, cor = $2, descricao = $3, peso = $4, preco_custo = $5, preco_venda = $6, data_desativacao = $7, baixa_estoque = $8, baixa_caixa = $9, tipo_produto = $10 " +
        "WHERE id = $11 AND tenant_id = $12 RETURNING produtos.id, produtos.nome, produtos.descricao, produtos.cor, produtos.peso, produtos.preco_custo, produtos.preco_venda, produtos.data_desativacao, produtos.tipo_produto, produtos.baixa_estoque, produtos.baixa_caixa",
      [
        nome,
        cor,
        descricao || "",
        peso || 0,
        preco_custo,
        preco_venda,
        data_desativacao || null,
        baixa_estoque || false,
        baixa_caixa || false,
        tipo_produto,
        productID,
        tenantId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductsByName = async (req, res) => {
  const { name } = req.params;
  const tenantId = req.user.tenantId;

  try {
    const result = await pool.query(
      "SELECT produtos.id, produtos.nome, produtos.descricao, produtos.cor, produtos.peso, produtos.preco_custo, produtos.preco_venda, produtos.data_desativacao, produtos.tipo_produto, produtos.baixa_estoque, produtos.baixa_caixa FROM produtos WHERE name = $1 AND tenant_id = $2",
      [name, tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listProduct = async (req, res) => {
  const tenantId = req.user.tenantId;

  try {
    const result = await pool.query(
      "SELECT produtos.id, produtos.nome, produtos.descricao, produtos.cor, produtos.peso, produtos.preco_custo, produtos.preco_venda, produtos.data_desativacao, produtos.tipo_produto, produtos.baixa_estoque, produtos.baixa_caixa FROM produtos WHERE tenant_id= $1",
      [tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  createProduct,
  updateProduct,
  getProductsByName,
  listProduct,
};
