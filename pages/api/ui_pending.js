const { getSessionUserId } = require("../../lib/session");
const {
  listPendingEntries,
  deletePendingEntry,
  updatePendingEntry,
  confirmPendingEntry,
} = require("../../lib/pending_entries");

function parseId(id) {
  const s = String(id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(s)) return null;
  return s;
}

async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    const { getFamilyId, getUserRoleInFamily } = require("../../lib/users");
    const familyId = await getFamilyId(userId);

    // Permission check for mutations
    if (req.method !== "GET") {
      const role = await getUserRoleInFamily(userId, familyId);
      if (role === "VIEWER") {
        res.statusCode = 403;
        return res.end(JSON.stringify({ ok: false, error: "Forbidden: VIEWER role cannot perform this action." }));
      }
    }

    // GET: List all pending entries
    if (req.method === "GET") {
      const entries = await listPendingEntries({ userId, familyId });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, entries }));
      return;
    }

    // POST: Confirm a pending entry (can optionally include final updated data in body)
    if (req.method === "POST") {
      const { action } = req.query;
      
      if (action === "confirm") {
        const id = parseId(req.body && req.body.id);
        if (!id) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: false, error: "id is required" }));
          return;
        }

        const finalData = req.body && req.body.finalData ? req.body.finalData : null;
        
        const result = await confirmPendingEntry({ userId, id, finalData });
        if (!result.ok) {
          res.statusCode = 404;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: false, error: result.error || "Failed to confirm" }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: true, id: result.id }));
        return;
      }
      
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid action" }));
      return;
    }

    // PATCH: Update parsed data
    if (req.method === "PATCH") {
      const id = parseId(req.body && req.body.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "id is required" }));
        return;
      }

      const parsedData = req.body && req.body.parsedData;
      if (!parsedData) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "parsedData is required" }));
        return;
      }

      const result = await updatePendingEntry({ userId, id, parsedData });
      res.statusCode = result.ok ? 200 : 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: result.ok }));
      return;
    }

    // DELETE: Reject/cancel pending entry
    if (req.method === "DELETE") {
      const id = parseId(req.query && req.query.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "id query param is required" }));
        return;
      }

      const result = await deletePendingEntry({ userId, id });
      res.statusCode = result.deleted ? 200 : 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: result.deleted }));
      return;
    }

    res.statusCode = 405;
    res.end("Method Not Allowed");
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
