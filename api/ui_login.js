const { createUiLoginApp } = require("../lib/http_apps");
const { vercelExpress } = require("../lib/vercel_express");

module.exports = vercelExpress(createUiLoginApp(), "/api/ui_login");
