const jwt = require("jsonwebtoken");
const secret = "supersecretkey"; // from .env
const token = jwt.sign(
  {
    id: 1,
    username: "admin",
    role: "admin",
    business_id: 1,
  },
  secret
);

console.log(token);
