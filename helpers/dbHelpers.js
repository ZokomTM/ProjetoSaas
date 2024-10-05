const pool = require("../db");

const recordExists = async (query, params) => {
  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

module.exports = {
  recordExists,
};
