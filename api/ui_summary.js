const { createUiSummaryApp } = require("../lib/http_apps");
const { vercelExpress } = require("../lib/vercel_express");

module.exports = vercelExpress(createUiSummaryApp(), "/api/ui_summary");
