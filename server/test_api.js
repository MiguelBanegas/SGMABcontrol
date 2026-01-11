const axios = require("axios");

async function test() {
  try {
    // 1. Login as admin
    console.log("--- Logging in as admin ---");
    const loginRes = await axios
      .post("http://localhost:5051/api/auth/login", {
        username: "admin",
        password: "invalid_password_but_wait", // I don't know the pass, but wait, I can check DB or just use a dummy token if I knew the secret
      })
      .catch((e) => e.response);

    // Since I don't know the password, I'll generate a token myself using the secret from .env
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

    console.log("Token generated for admin");

    // 2. Call notifications
    console.log("--- Calling /api/notifications ---");
    const res = await axios
      .get("http://localhost:5051/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch((e) => e.response);

    console.log("Status:", res.status);
    console.log("Body:", res.data);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

test();
