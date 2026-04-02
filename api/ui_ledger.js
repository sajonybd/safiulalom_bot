const { createUiLedgerApp } = require("../lib/http_apps");
const { vercelExpress } = require("../lib/vercel_express");

module.exports = vercelExpress(createUiLedgerApp(), "/api/ui_ledger");
