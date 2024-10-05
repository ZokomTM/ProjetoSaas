const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:dWIgnxrLwwylsFeleFOmnumGhyXPOcNE@autorack.proxy.rlwy.net:17000/railway",
});

module.exports = pool;
