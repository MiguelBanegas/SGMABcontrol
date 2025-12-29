require("dotenv").config();

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "sgm_db",
      port: process.env.DB_PORT || 5432,
    },
    migrations: {
      directory: "./migrations",
    },
  },
};
