const { getSessionUserId } = require("../../lib/session");
const { getDb } = require("../../lib/db");
const { getUserByTelegramId, updateUserRole } = require("../../lib/users");

async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    const db = await getDb();
    const currentUser = await getUserByTelegramId(userId);
    if (!currentUser) {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "User not found" }));
      return;
    }

    const activeFamilyId = String(currentUser.active_family_id || currentUser.family_id || userId);

    const getRole = (user, familyId) => {
      const membership = (user.joined_families || []).find(f => String(f.family_id) === familyId);
      if (membership) return membership.role;
      
      const isPrimaryOwner = String(user.family_id) === familyId || String(user.telegram_user_id) === familyId;
      return isPrimaryOwner ? "OWNER" : "VIEWER";
    };

    if (req.method === "GET") {
      // 1. Members of the active family
      let teamMembers = await db.collection("users").find({ 
        $or: [
          { joined_families: { $elemMatch: { family_id: activeFamilyId, status: "ACCEPTED" } } },
          { joined_families: { $elemMatch: { family_id: Number(activeFamilyId), status: "ACCEPTED" } } },
          { family_id: activeFamilyId },
          { family_id: Number(activeFamilyId) },
          { telegram_user_id: Number(activeFamilyId) },
          { telegram_user_id: activeFamilyId }
        ]
      }).toArray();
      
      // Failsafe: Always include current user if they match the active family context
      const isUserInActiveFamily = String(currentUser.family_id) === activeFamilyId || 
                                   String(currentUser.telegram_user_id) === activeFamilyId ||
                                   currentUser.joined_families?.some(f => String(f.family_id) === activeFamilyId && f.status === "ACCEPTED");
      
      if (isUserInActiveFamily && !teamMembers.some(m => m.telegram_user_id === currentUser.telegram_user_id)) {
        teamMembers.push(currentUser);
      }
      
      // 2. All families this user is part of (for switcher)
      const ownFamilyId = currentUser.family_id || String(userId);
      const ownFamily = { 
        family_id: ownFamilyId, 
        role: "OWNER", 
        status: "ACCEPTED", 
        name: "my_personal_ledger", 
        joined_at: currentUser.created_at || new Date() 
      };
      
      const otherFamilies = (currentUser.joined_families || []).filter(f => String(f.family_id) !== String(ownFamilyId));
      const myFamilies = [ownFamily, ...otherFamilies];

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ 
        ok: true, 
        activeFamilyId,
        team: teamMembers.map(u => ({
          telegramId: u.telegram_user_id,
          username: u.username,
          firstName: u.first_name,
          role: getRole(u, activeFamilyId),
        })),
        myFamilies
      }));
      return;
    }

    if (req.method === "POST") {
      // INVITE MEMBER
      const currentRole = getRole(currentUser, activeFamilyId);
      if (currentRole !== "OWNER") {
        res.statusCode = 403;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: `Forbidden: Only OWNER can invite members. Your role: ${currentRole}` }));
        return;
      }

      const targetTelegramId = Number(req.body && req.body.telegramId);
      if (!targetTelegramId) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "telegramId is required" }));
        return;
      }

      const targetUser = await getUserByTelegramId(targetTelegramId);
      if (!targetUser) {
        res.statusCode = 404;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "User not found. They must start the bot first." }));
        return;
      }

      // Check if already invited
      const alreadyIn = targetUser.joined_families?.find(f => f.family_id === activeFamilyId);
      if (alreadyIn) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "User already invited or joined." }));
        return;
      }

      const invitation = {
        family_id: activeFamilyId,
        name: currentUser.first_name + "'s Team",
        role: "EDITOR",
        status: "PENDING",
        joined_at: new Date(),
        invited_by: userId
      };

      await db.collection("users").updateOne(
        { telegram_user_id: targetTelegramId },
        { $push: { joined_families: invitation } }
      );

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "PATCH") {
      const action = req.body && req.body.action;

      if (action === "ACCEPT_INVITATION" || action === "REJECT_INVITATION") {
        const familyId = req.body.familyId;
        if (action === "ACCEPT_INVITATION") {
          await db.collection("users").updateOne(
            { telegram_user_id: userId, "joined_families.family_id": familyId },
            { 
              $set: { "joined_families.$.status": "ACCEPTED", active_family_id: familyId } 
            }
          );
        } else {
          await db.collection("users").updateOne(
            { telegram_user_id: userId },
            { $pull: { joined_families: { family_id: familyId } } }
          );
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (action === "SWITCH_TEAM") {
        const familyId = String(req.body.familyId);
        // Verify user is part of this family
        const hasAccess = (String(currentUser.family_id) === familyId) || 
                          (String(currentUser.telegram_user_id) === familyId) ||
                          currentUser.joined_families?.some(f => String(f.family_id) === familyId && f.status === "ACCEPTED");
                          
        if (!hasAccess) {
          res.statusCode = 403;
          res.end(JSON.stringify({ ok: false, error: "No access to this team" }));
          return;
        }

        await db.collection("users").updateOne(
          { telegram_user_id: userId },
          { $set: { active_family_id: familyId } }
        );
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (action === "UPDATE_ROLE") {
        const currentRole = getRole(currentUser, activeFamilyId);
        if (currentRole !== "OWNER") {
          res.statusCode = 403;
          res.end(JSON.stringify({ ok: false, error: "Forbidden" }));
          return;
        }

        const targetId = Number(req.body.telegramId);
        const newRole = req.body.role;

        await db.collection("users").updateOne(
          { telegram_user_id: targetId, "joined_families.family_id": activeFamilyId },
          { $set: { "joined_families.$.role": newRole } }
        );
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }
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
