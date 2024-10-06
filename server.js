const express = require("express");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/userRoutes");
const tenantRoutes = require("./routes/tenantsRoutes");
const authenticateToken = require("./middlewares/authMiddleware");
const checkSubscription = require("./middlewares/checkSubscriptionMiddleware");
const tenantLevels = require("./helpers/subscriptionTenantLevels");

const app = express();
const port = 3000;

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/tenant", tenantRoutes);

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.get(
  "/free",
  authenticateToken,
  checkSubscription(tenantLevels.BASICO),
  (req, res) => {
    res.json({ message: "Access granted to free level" });
  }
);

app.get(
  "/intermediaria",
  authenticateToken,
  checkSubscription(tenantLevels.INTERMEDIARIO),
  (req, res) => {
    res.json({ message: "Access granted to intermediaria level" });
  }
);

app.get(
  "/premium",
  authenticateToken,
  checkSubscription(tenantLevels.AVANCADO),
  (req, res) => {
    res.json({ message: "Access granted to premium level" });
  }
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
