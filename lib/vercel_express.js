function toExpressUrl(afterBase) {
  if (!afterBase) return "/";
  if (afterBase.startsWith("/")) return afterBase;
  if (afterBase.startsWith("?")) return `/${afterBase}`;
  return `/${afterBase}`;
}

// Vercel's Node runtime may pass req.url as the full URL path (e.g. "/api/ui").
// Our Express apps are written assuming they're mounted at "/" (e.g. GET "/").
// This wrapper strips the function's base path so Express routing works.
function vercelExpress(app, basePath) {
  const base = String(basePath || "");

  return function handler(req, res) {
    if (base && typeof req.url === "string" && req.url.startsWith(base)) {
      req.url = toExpressUrl(req.url.slice(base.length));
    }
    return app(req, res);
  };
}

module.exports = { vercelExpress };

