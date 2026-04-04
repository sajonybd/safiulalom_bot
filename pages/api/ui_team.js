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

    const activeFamilyId = String(
      currentUser.active_family_id || currentUser.family_id || userId,
    );

    const getRole = (user, familyId) => {
      // 1. Check explicit membership role
      const membership = (user.joined_families || []).find(
        (f) => String(f.family_id) === String(familyId),
      );
      if (membership) return membership.role;

      // 2. Check if primary owner (Personal team) or if they produced the imported team
      const isPrimaryOwner =
        String(user.family_id) === String(familyId) ||
        String(user.telegram_user_id) === String(familyId);

      return isPrimaryOwner ? "OWNER" : "VIEWER";
    };

    if (req.method === "GET") {
      // 1. Members of the active family
      let teamMembers = await db
        .collection("users")
        .find({
          $or: [
            {
              joined_families: {
                $elemMatch: { family_id: activeFamilyId, status: "ACCEPTED" },
              },
            },
            {
              joined_families: {
                $elemMatch: {
                  family_id: isNaN(Number(activeFamilyId))
                    ? null
                    : Number(activeFamilyId),
                  status: "ACCEPTED",
                },
              },
            },
            { family_id: activeFamilyId },
            {
              family_id: isNaN(Number(activeFamilyId))
                ? null
                : Number(activeFamilyId),
            },
            {
              telegram_user_id: isNaN(Number(activeFamilyId))
                ? null
                : Number(activeFamilyId),
            },
            { telegram_user_id: activeFamilyId },
          ],
        })
        .toArray();

      // Failsafe: Always include current user if they match the active family context
      const isUserInActiveFamily =
        String(currentUser.family_id) === activeFamilyId ||
        String(currentUser.telegram_user_id) === activeFamilyId ||
        currentUser.joined_families?.some(
          (f) =>
            String(f.family_id) === activeFamilyId && f.status === "ACCEPTED",
        );

      if (
        isUserInActiveFamily &&
        !teamMembers.some(
          (m) => m.telegram_user_id === currentUser.telegram_user_id,
        )
      ) {
        teamMembers.push(currentUser);
      }

      // 2. All families this user is part of (for switcher)
      const ownFamilyId = currentUser.family_id || String(userId);
      const ownFamily = {
        family_id: ownFamilyId,
        role: "OWNER",
        status: "ACCEPTED",
        name: currentUser.family_name || "my_personal_ledger",
        joined_at: currentUser.created_at || new Date(),
      };

      const otherFamilies = (currentUser.joined_families || []).filter(
        (f) => String(f.family_id) !== String(ownFamilyId),
      );
      const myFamilies = [ownFamily, ...otherFamilies];

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          activeFamilyId,
          team: teamMembers.map((u) => ({
            telegramId: u.telegram_user_id,
            username: u.username,
            firstName: u.first_name,
            role: getRole(u, activeFamilyId),
          })),
          myFamilies,
          myTelegramId: currentUser.telegram_user_id,
        }),
      );
      return;
    }

    if (req.method === "POST") {
      // INVITE MEMBER
      const currentRole = getRole(currentUser, activeFamilyId);
      if (currentRole !== "OWNER") {
        res.statusCode = 403;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            ok: false,
            error: `Forbidden: Only OWNER can invite members. Your role: ${currentRole}`,
          }),
        );
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
        res.end(
          JSON.stringify({
            ok: false,
            error: "User not found. They must start the bot first.",
          }),
        );
        return;
      }

      // Check if already invited
      const alreadyIn = targetUser.joined_families?.find(
        (f) => f.family_id === activeFamilyId,
      );
      if (alreadyIn) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            ok: false,
            error: "User already invited or joined.",
          }),
        );
        return;
      }

      const invitation = {
        family_id: activeFamilyId,
        name: currentUser.first_name + "'s Team",
        role: "EDITOR",
        status: "PENDING",
        joined_at: new Date(),
        invited_by: userId,
      };

      await db
        .collection("users")
        .updateOne(
          { telegram_user_id: targetTelegramId },
          { $push: { joined_families: invitation } },
        );

      // Audit Log
      await db.collection("action_logs").insertOne({
        userId,
        familyId: activeFamilyId,
        action: "INVITE_MEMBER",
        params: { targetId: targetTelegramId },
        timestamp: new Date(),
      });

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
              $set: {
                "joined_families.$.status": "ACCEPTED",
                active_family_id: familyId,
              },
            },
          );
        } else {
          await db
            .collection("users")
            .updateOne(
              { telegram_user_id: userId },
              { $pull: { joined_families: { family_id: familyId } } },
            );
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (action === "SWITCH_TEAM") {
        const familyId = String(req.body.familyId);
        // Verify user is part of this family
        const hasAccess =
          String(currentUser.family_id) === familyId ||
          String(currentUser.telegram_user_id) === familyId ||
          currentUser.joined_families?.some(
            (f) => String(f.family_id) === familyId && f.status === "ACCEPTED",
          );

        if (!hasAccess) {
          res.statusCode = 403;
          res.end(
            JSON.stringify({ ok: false, error: "No access to this team" }),
          );
          return;
        }

        await db
          .collection("users")
          .updateOne(
            { telegram_user_id: userId },
            { $set: { active_family_id: familyId } },
          );
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (action === "RENAME_TEAM") {
        const familyId = String(req.body.familyId || activeFamilyId);
        const newName = req.body.name;
        if (!newName)
          return res.status(400).json({ ok: false, error: "Name is required" });

        const currentRole = getRole(currentUser, familyId);
        if (currentRole !== "OWNER" && currentRole !== "EDITOR") {
          return res
            .status(403)
            .json({
              ok: false,
              error: "Forbidden: Only OWNER/EDITOR can rename",
            });
        }

        // 1. If it's the primary account for some user, update their profile setting
        // The familyId is usually the Telegram ID of the creator
        await db
          .collection("users")
          .updateOne(
            { telegram_user_id: Number(familyId) },
            { $set: { family_name: newName } },
          );

        // 2. Update joined_families entry for EVERY user who has joined this family
        await db
          .collection("users")
          .updateMany(
            { "joined_families.family_id": familyId },
            { $set: { "joined_families.$.name": newName } },
          );

        // 3. Update the owner's name if they are in the joined_families too (e.g. for sub-families) or just to be safe
        await db
          .collection("users")
          .updateMany(
            { "joined_families.family_id": Number(familyId) },
            { $set: { "joined_families.$.name": newName } },
          );

        // Audit Log
        await db.collection("action_logs").insertOne({
          userId,
          familyId: activeFamilyId,
          action: "RENAME_TEAM",
          params: { familyId, newName },
          timestamp: new Date(),
        });

        return res.status(200).json({ ok: true });
      }

      if (action === "DELETE_TEAM") {
        const familyId = String(req.body.familyId);

        // Cannot delete personal ledger
        const ownFamilyId = String(
          currentUser.family_id || currentUser.telegram_user_id,
        );
        if (familyId === ownFamilyId) {
          return res
            .status(400)
            .json({
              ok: false,
              error: "Cannot delete your personal ledger account.",
            });
        }

        const currentRole = getRole(currentUser, familyId);
        if (currentRole !== "OWNER") {
          return res
            .status(403)
            .json({
              ok: false,
              error: "Forbidden: Only OWNER can delete the team.",
            });
        }

        // Delete collections
        const deleteFilter = {
          $or: [
            { family_id: { $in: [String(familyId), Number(familyId)] } },
            { familyId: { $in: [String(familyId), Number(familyId)] } },
          ],
        };

        const deleteLogsFilter = {
          $or: [
            { familyId: { $in: [String(familyId), Number(familyId)] } },
            { family_id: { $in: [String(familyId), Number(familyId)] } },
          ],
        };

        await Promise.all([
          db.collection("entities").deleteMany(deleteFilter),
          db.collection("ledger").deleteMany(deleteFilter),
          db.collection("ledger_entries").deleteMany(deleteFilter),
          db.collection("chat_messages").deleteMany(deleteFilter),
          db.collection("pending_entries").deleteMany(deleteFilter),
          db.collection("action_logs").deleteMany(deleteLogsFilter),
        ]);

        // Remove from joined_families for everyone
        await db
          .collection("users")
          .updateMany(
            {
              "joined_families.family_id": {
                $in: [String(familyId), Number(familyId)],
              },
            },
            {
              $pull: {
                joined_families: {
                  family_id: { $in: [String(familyId), Number(familyId)] },
                },
              },
            },
          );

        // Reset active_family_id for users currently using it
        const affectedUsers = await db
          .collection("users")
          .find({
            active_family_id: { $in: [String(familyId), Number(familyId)] },
          })
          .toArray();
        for (const u of affectedUsers) {
          const revertId = u.family_id || String(u.telegram_user_id);
          await db
            .collection("users")
            .updateOne(
              { _id: u._id },
              { $set: { active_family_id: String(revertId) } },
            );
        }

        return res.status(200).json({ ok: true });
      }

      if (action === "UPDATE_ROLE" || action === "REMOVE_MEMBER") {
        const currentRole = getRole(currentUser, activeFamilyId);
        if (currentRole !== "OWNER") {
          res.statusCode = 403;
          res.end(
            JSON.stringify({
              ok: false,
              error: "Forbidden: Only OWNER can manage members.",
            }),
          );
          return;
        }

        const targetId = Number(req.body.telegramId);
        if (!targetId)
          return res
            .status(400)
            .json({ ok: false, error: "telegramId is required" });

        // PROTECT SELF: Owner should not update their own role or remove themselves
        if (targetId === currentUser.telegram_user_id) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              ok: false,
              error:
                "You cannot update your own role or remove yourself from the team.",
            }),
          );
          return;
        }

        if (action === "UPDATE_ROLE") {
          const newRole = req.body.role;
          // 2. Update Role
          await db
            .collection("users")
            .updateOne(
              {
                telegram_user_id: targetId,
                "joined_families.family_id": activeFamilyId,
              },
              { $set: { "joined_families.$.role": newRole } },
            );

          // Audit Log
          await db.collection("action_logs").insertOne({
            userId,
            familyId: activeFamilyId,
            action: "UPDATE_MEMBER_ROLE",
            params: { targetId, newRole },
            timestamp: new Date(),
          });
        } else {
          // REMOVE_MEMBER
          const updateResult = await db.collection("users").updateOne(
            { telegram_user_id: targetId },
            {
              $pull: {
                joined_families: {
                  family_id: { $in: [activeFamilyId, Number(activeFamilyId)] },
                },
              },
              $set: { updated_at: new Date() },
            },
          );

          if (updateResult.modifiedCount === 0) {
            console.log(
              `[RemoveMember] No modification for user ${targetId} in family ${activeFamilyId}`,
            );
          }

          // If the removed user had this as active, reset it to their own ID
          await db.collection("users").updateOne(
            {
              telegram_user_id: targetId,
              active_family_id: {
                $in: [activeFamilyId, Number(activeFamilyId)],
              },
            },
            { $set: { active_family_id: String(targetId) } },
          );

          // Audit Log
          await db.collection("action_logs").insertOne({
            userId,
            familyId: activeFamilyId,
            action: "REMOVE_MEMBER",
            params: { targetId },
            timestamp: new Date(),
          });
        }

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
    res.end(
      JSON.stringify({
        ok: false,
        error: String(err && err.message ? err.message : err),
      }),
    );
  }
}

module.exports = handler;
module.exports.default = handler;
