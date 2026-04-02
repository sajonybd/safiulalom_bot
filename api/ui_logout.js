const { createUiLogoutApp } = require("../lib/http_apps");
const { vercelExpress } = require("../lib/vercel_express");

module.exports = vercelExpress(createUiLogoutApp(), "/api/ui_logout");
