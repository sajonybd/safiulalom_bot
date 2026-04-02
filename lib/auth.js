function parseAdminUserIds() {
  const raw = (process.env.ADMIN_USER_IDS || "").trim();
  if (!raw) return null;

  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isSafeInteger(n) && n > 0);

  return ids.length ? new Set(ids) : null;
}

const cached = { adminUserIds: undefined };

function isAuthorized(ctx) {
  if (cached.adminUserIds === undefined) {
    cached.adminUserIds = parseAdminUserIds();
  }

  // If ADMIN_USER_IDS is not set, allow all (but recommend setting it).
  const allowlist = cached.adminUserIds;
  if (!allowlist) return true;

  const userId = ctx && ctx.from && ctx.from.id;
  return typeof userId === "number" && allowlist.has(userId);
}

module.exports = { isAuthorized };

