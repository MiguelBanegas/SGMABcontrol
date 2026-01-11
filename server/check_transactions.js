require("dotenv").config();
const db = require("./db");

async function checkTransactions() {
  try {
    console.log("Checking customer_account_transactions table...\n");

    const transactions = await db("customer_account_transactions")
      .select("*")
      .orderBy("created_at", "desc")
      .limit(10);

    if (transactions.length === 0) {
      console.log("No transactions found in the table.");
    } else {
      console.log(`Found ${transactions.length} recent transactions:\n`);
      transactions.forEach((t, idx) => {
        console.log(`${idx + 1}. ID: ${t.id}`);
        console.log(`   Customer ID: ${t.customer_id}`);
        console.log(`   Sale ID: ${t.sale_id}`);
        console.log(`   Type: ${t.type}`);
        console.log(`   Amount: $${t.amount}`);
        console.log(`   Balance: $${t.balance}`);
        console.log(`   Description: ${t.description}`);
        console.log(`   Created: ${t.created_at}`);
        console.log("");
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkTransactions();
