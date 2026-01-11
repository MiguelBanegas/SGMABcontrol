const db = require("./db");

async function checkTransactions() {
  try {
    const types = await db("customer_account_transactions")
      .distinct("type")
      .select();
    console.log("Distinct transaction types:", types);

    const sample = await db("customer_account_transactions").limit(10).select();
    console.log("Sample transactions:", JSON.stringify(sample, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTransactions();
