// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");



const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

const latestPayments = new Map();

for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  try {
    event = JSON.parse(line);
  } catch {
    continue; 
  }

  if (!event.txn_id) continue;

  const timestamp = Date.parse(event.ts);

  if (Number.isNaN(timestamp)) continue;

  const existing = latestPayments.get(event.txn_id);

  if (!existing || timestamp > existing.timestamp) {
    latestPayments.set(event.txn_id, {
      timestamp,
      status: event.status,
      amount: Number(String(event.amount).replace(/,/g, "")),
      currency: event.currency
    });
  }
}

let total = 0;
let count = 0;
for (const [txnId, payment] of latestPayments) {
  if (
    payment.status === "success" &&
    !Number.isFinite(payment.amount)
  ) {
    console.log("Invalid amount:", {
      txnId,
      amount: payment.amount,
      currency: payment.currency
    });
  }
}

for (const payment of latestPayments.values()) {
  if (payment.status === "success") {
    total += payment.amount;
    count++;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
