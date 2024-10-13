const express = require("express");
const authRoutes = require("./routes/authRoutes");
const rolesRoutes = require("./routes/rolesRoutes");
const usersRoutes = require("./routes/userRoutes");
const tenantRoutes = require("./routes/tenantsRoutes");
const productsRoutes = require("./routes/productsRoutes");
const permissionsRoutes = require("./routes/permissionsRoutes");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/roles", rolesRoutes);
app.use("/users", usersRoutes);
app.use("/tenant", tenantRoutes);
app.use("/products", productsRoutes);
app.use("/permissions", permissionsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
