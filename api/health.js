const { createHealthApp } = require("../lib/http_apps");
const { vercelExpress } = require("../lib/vercel_express");

module.exports = vercelExpress(createHealthApp(), "/api/health");
