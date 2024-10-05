const tenantLevels = require("../helpers/subscriptionTenantLevels");

const checkSubscription = (requiredLevel) => {
  return (req, res, next) => {
    const { subscription_level } = req.user;

    const levels = [
      tenantLevels.BASICO,
      tenantLevels.INTERMEDIARIO,
      tenantLevels.AVANCADO,
    ];
    const userLevelIndex = levels.indexOf(subscription_level);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    if (userLevelIndex >= requiredLevelIndex) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
};

module.exports = checkSubscription;
