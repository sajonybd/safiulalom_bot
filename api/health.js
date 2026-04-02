const express = require("express");

const app = express();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "safiulalom_bot" });
});

module.exports = app;
