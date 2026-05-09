#!/usr/bin/env node

/**
 * TEST: Validación de query params para /api/sales/history
 * Ejecutar: node server/scripts/test_sales_history_query_validation.js
 */

const {
  validateQueryParams,
  sanitizeSearchParams,
  validators,
} = require("../middleware/queryValidator");

async function runTest() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  TEST - SALES HISTORY QUERY VALIDATION           ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  const tests = [
    {
      name: "Sanitize search parameters escapes wildcards",
      middleware: sanitizeSearchParams(),
      req: { query: { seller: "%admin%", customer: "_DROP_" } },
      expected: {
        seller: "\\%admin\\%",
        customer: "\\_DROP\\_",
      },
    },
    {
      name: "Reject invalid date format",
      middleware: validateQueryParams({ date: validators.date }),
      req: { query: { date: "2026-13-40" } },
      expectedError: true,
    },
    {
      name: "Reject suspicious seller parameter",
      middleware: validateQueryParams({ seller: validators.safe }),
      req: { query: { seller: "admin'; DROP TABLE sales;--" } },
      expectedError: true,
    },
    {
      name: "Accept valid history filters",
      middleware: validateQueryParams({
        date: validators.date,
        seller: (value) => validators.string(value, 80),
        customer: (value) => validators.string(value, 80),
        payment: (value) => validators.string(value, 50),
        status: (value) => validators.string(value, 50),
      }),
      req: { query: { date: "2026-05-09", seller: "ale", customer: "Juan" } },
      expectedNext: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const req = test.req;
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };
    let nextCalled = false;

    test.middleware(req, res, () => {
      nextCalled = true;
    });

    if (test.expected) {
      const sellerOk = req.query.seller === test.expected.seller;
      const customerOk = req.query.customer === test.expected.customer;
      const ok = sellerOk && customerOk;
      if (ok) {
        passed += 1;
        console.log(`✅ ${test.name}`);
      } else {
        failed += 1;
        console.error(`❌ ${test.name}`);
        console.error("   Expected:", test.expected);
        console.error("   Received:", req.query);
      }
    } else if (test.expectedError) {
      if (res.statusCode === 400 && res.payload && res.payload.code === "INVALID_QUERY_PARAMS") {
        passed += 1;
        console.log(`✅ ${test.name}`);
      } else {
        failed += 1;
        console.error(`❌ ${test.name}`);
        console.error("   Expected invalid query error");
        console.error("   Received status:", res.statusCode, "payload:", res.payload);
      }
    } else if (test.expectedNext) {
      if (nextCalled) {
        passed += 1;
        console.log(`✅ ${test.name}`);
      } else {
        failed += 1;
        console.error(`❌ ${test.name}`);
      }
    }
  }

  console.log("\n════════════════════════════════════════════════════");
  console.log(`RESULTADOS: ${passed} PASADOS, ${failed} FALLADOS`);
  console.log("════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTest();
