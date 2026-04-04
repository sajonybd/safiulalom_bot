const { getSessionUserId } = require("../../lib/session");
const { getFamilyId } = require("../../lib/users");
const {
  addEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  ensureDefaultEntities,
} = require("../../lib/entities");
const { accountsBalances } = require("../../lib/ledger");

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

    const familyId = await getFamilyId(userId);

    if (req.method === "GET") {
      await ensureDefaultEntities({ userId, familyId });
      const type = String((req.query && req.query.type) || "").trim();
      const groupId = String((req.query && req.query.groupId) || "").trim();
      
      const entities = await listEntities({ 
        familyId, 
        type: type || undefined, 
        groupId: groupId || undefined 
      });

      const balances = await accountsBalances({ familyId });
      const balanceMap = Object.fromEntries(balances.map(b => [b.account, b.balance]));

      const entitiesWithBalances = entities.map(e => {
        if (e.type === "ACCOUNT") {
          return { ...e, currentBalance: balanceMap[e.name] || Number(e.metadata?.openingBalance || 0) };
        }
        return e;
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, entities: entitiesWithBalances }));
      return;
    }

    if (req.method === "POST") {
      const { name, type, subType, groupId, phone, email, metadata } = req.body || {};
      
      if (!name) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Name is required" }));
        return;
      }

      const { id } = await addEntity({
        userId,
        familyId,
        name,
        type,
        subType,
        groupId,
        phone,
        email,
        metadata,
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, id }));
      return;
    }

    if (req.method === "PATCH") {
      const id = parseId(req.body && req.body.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "ID is required" }));
        return;
      }

      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.type !== undefined) updates.type = req.body.type;
      if (req.body.subType !== undefined) updates.subType = req.body.subType;
      if (req.body.groupId !== undefined) updates.groupId = req.body.groupId;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      if (req.body.email !== undefined) updates.email = req.body.email;
      if (req.body.metadata !== undefined) updates.metadata = req.body.metadata;

      const result = await updateEntity({ familyId, id, updates });
      res.statusCode = result.ok ? 200 : 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: result.ok, entity: result.entity }));
      return;
    }

    if (req.method === "DELETE") {
      const id = parseId(req.query && req.query.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "id query param is required" }));
        return;
      }

      const result = await deleteEntity({ familyId, id });
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
