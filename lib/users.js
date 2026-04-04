const { getDb } = require("./db");
const { ensureDefaultEntities } = require("./entities");

async function upsertTelegramUser(ctx) {
  const from = ctx && ctx.from;
  if (!from || typeof from.id !== "number") return null;

  const user = {
    telegram_user_id: from.id,
    username: from.username || null,
    first_name: from.first_name || null,
    last_name: from.last_name || null,
    updated_at: new Date(),
  };

  const db = await getDb();
  
  // Find user by direct ID or linked ID
  const existingUser = await db.collection("users").findOne({
    $or: [
      { telegram_user_id: from.id },
      { linked_telegram_id: from.id }
    ]
  });

  const targetId = existingUser ? existingUser.telegram_user_id : from.id;
  const defaultFamilyId = String(targetId);
  
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim());
  const isAdmin = adminIds.includes(String(targetId));
  const role = isAdmin ? "ADMIN" : "OWNER";

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const isPendingDeletion = existingUser?.status === "PENDING_DELETION";
  const withinGracePeriod = isPendingDeletion && (new Date() - new Date(existingUser.deletion_requested_at) <= threeDaysMs);
  
  let newStatus = existingUser?.status || "ACTIVE";
  let deletionRequestedAt = existingUser?.deletion_requested_at || null;

  if (isPendingDeletion) {
    if (withinGracePeriod) {
      newStatus = "ACTIVE";
      deletionRequestedAt = null;
    } else {
      newStatus = "DELETED";
    }
  }

  await db.collection("users").updateOne(
    { telegram_user_id: targetId },
    {
      $set: { 
        ...user, 
        role, 
        status: newStatus, 
        deletion_requested_at: deletionRequestedAt 
      },
      $setOnInsert: { 
        created_at: new Date(),
        family_id: defaultFamilyId,
        active_family_id: defaultFamilyId,
        daily_credit_limit: 50,
        available_credits: 50,
        last_credit_reset: new Date(),
        joined_families: [
          { 
            family_id: defaultFamilyId, 
            role: "OWNER", 
            status: "ACCEPTED", 
            joined_at: new Date(),
            name: "My Personal Ledger"
          }
        ]
      },
    },
    { upsert: true }
  );
  
  // Ensure default entities
  await ensureDefaultEntities({ 
    userId: targetId, 
    familyId: existingUser?.active_family_id || existingUser?.family_id || defaultFamilyId 
  }).catch(err => console.error("Error creating default entities:", err));

  return user;
}

async function upsertWhatsAppUser(payload) {
  const { phone, firstName, lastName, chatId } = payload;
  if (!phone) return null;

  const whatsappId = phone.includes("@") ? phone : `${phone}@c.us`;
  const defaultFamilyId = `wa_${phone}`;

  const user = {
    whatsapp_user_id: whatsappId,
    phone: phone,
    first_name: firstName || null,
    last_name: lastName || null,
    updated_at: new Date(),
  };

  const db = await getDb();
  
  // Find user by WhatsApp ID
  const existingUser = await db.collection("users").findOne({ whatsapp_user_id: whatsappId });
  
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim());
  const isAdmin = adminIds.includes(phone); // WhatsApp admin by phone number string
  const role = isAdmin ? "ADMIN" : "OWNER";

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const isPendingDeletion = existingUser?.status === "PENDING_DELETION";
  const withinGracePeriod = isPendingDeletion && (new Date() - new Date(existingUser.deletion_requested_at) <= threeDaysMs);
  
  let newStatus = existingUser?.status || "ACTIVE";
  let deletionRequestedAt = existingUser?.deletion_requested_at || null;

  if (isPendingDeletion) {
    if (withinGracePeriod) {
      newStatus = "ACTIVE";
      deletionRequestedAt = null;
    } else {
      newStatus = "DELETED";
    }
  }

  await db.collection("users").updateOne(
    { whatsapp_user_id: whatsappId },
    {
      $set: { 
        ...user, 
        role, 
        status: newStatus, 
        deletion_requested_at: deletionRequestedAt 
      },
      $setOnInsert: { 
        created_at: new Date(),
        family_id: defaultFamilyId,
        active_family_id: defaultFamilyId,
        daily_credit_limit: 50,
        available_credits: 50,
        last_credit_reset: new Date(),
        joined_families: [
          { 
            family_id: defaultFamilyId, 
            role: "OWNER", 
            status: "ACCEPTED", 
            joined_at: new Date(),
            name: "My Personal Ledger (WA)"
          }
        ]
      },
    },
    { upsert: true }
  );

  await ensureDefaultEntities({ 
    userId: whatsappId, 
    familyId: existingUser?.active_family_id || existingUser?.family_id || defaultFamilyId 
  }).catch(err => console.error("Error creating default entities (WA):", err));

  return user;
}

async function getUserByWhatsAppId(whatsappId) {
  const db = await getDb();
  const user = await db.collection("users").findOne({ whatsapp_user_id: whatsappId });
  
  if (!user) return null;

  // Process user status (Delete logic)
  if (user.status === "PENDING_DELETION" && user.deletion_requested_at) {
    const requestedAt = new Date(user.deletion_requested_at);
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (new Date() - requestedAt > threeDaysMs) {
      await db.collection("users").updateOne({ _id: user._id }, { $set: { status: "DELETED", updated_at: new Date() } });
      user.status = "DELETED";
    }
  }

  if (user.status === "DELETED") {
    return null; // As requested, no account found
  }

  if (!user.preferences) {
    user.preferences = {};
  }
  return user;
}

/**
 * Get user by platform and ID
 */
async function getUserById(platform, platformId) {
  if (platform === "whatsapp") return getUserByWhatsAppId(platformId);
  return getUserByTelegramId(platformId);
}

async function getUserByTelegramId(telegramUserId) {
  const db = await getDb();
  
  // If it's a string containing @ or lid, it's actually a WhatsApp ID
  if (typeof telegramUserId === "string" && (telegramUserId.includes("@") || telegramUserId.includes("lid"))) {
    return getUserByWhatsAppId(telegramUserId);
  }

  const id = Number(telegramUserId);
  if (isNaN(id)) return null;

  const user = await db.collection("users").findOne({ 
    $or: [
      { telegram_user_id: id },
      { linked_telegram_id: id }
    ]
  });

  if (!user) return null;

  // Process user status (Delete logic)
  if (user.status === "PENDING_DELETION" && user.deletion_requested_at) {
    const requestedAt = new Date(user.deletion_requested_at);
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (new Date() - requestedAt > threeDaysMs) {
      await db.collection("users").updateOne({ _id: user._id }, { $set: { status: "DELETED", updated_at: new Date() } });
      user.status = "DELETED";
    }
  }

  if (user.status === "DELETED") {
    return null; // As requested, no account found
  }

  if (!user.preferences) {
    user.preferences = {};
  }
  return user;
}

async function updateUserPreferences(telegramUserId, preferences) {
  const db = await getDb();
  const query = typeof telegramUserId === "string" ? { whatsapp_user_id: telegramUserId } : { telegram_user_id: Number(telegramUserId) };
  
  const result = await db.collection("users").findOneAndUpdate(
    query,
    { 
      $set: { 
        preferences: preferences,
        updated_at: new Date() 
      } 
    },
    { returnDocument: "after" }
  );
  return result;
}

async function getFamilyId(platformId, platform = "telegram") {
  const user = await getUserById(platform, platformId);
  if (!user) return String(platformId);
  return user.active_family_id || user.family_id || String(platformId);
}

async function updateUserRole({ telegramUserId, role, familyId }) {
  const db = await getDb();
  const query = typeof telegramUserId === "string" ? { whatsapp_user_id: telegramUserId } : { telegram_user_id: Number(telegramUserId) };
  
  const payload = { updated_at: new Date() };
  if (role) payload.role = role.toUpperCase();
  if (familyId) payload.family_id = familyId;

  const result = await db.collection("users").findOneAndUpdate(
    query,
    { $set: payload },
    { returnDocument: "after" }
  );
  return result;
}

async function updateUserProfile(telegramUserId, updates) {
  const db = await getDb();
  const query = typeof telegramUserId === "string" ? { whatsapp_user_id: telegramUserId } : { telegram_user_id: Number(telegramUserId) };
  
  const allowed = ["first_name", "last_name", "email", "phone"];
  const payload = { updated_at: new Date() };
  
  for (const k of allowed) {
    if (updates[k] !== undefined) payload[k] = updates[k];
  }

  const result = await db.collection("users").findOneAndUpdate(
    query,
    { $set: payload },
    { returnDocument: "after" }
  );
  return result;
}

async function checkAndConsumeCredit(platformId, platform = "telegram") {
  const db = await getDb();
  const user = await getUserById(platform, platformId);
  if (!user) return { ok: false, error: "Account not found" };

  if (user.is_blocked) {
    return { ok: false, error: "Access denied. Your account has been suspended." };
  }

  const now = new Date();
  
  // Check if upgrade is expired
  let dailyLimit = user.daily_credit_limit ?? 50;
  if (user.limit_expiry && new Date(user.limit_expiry) < now) {
    dailyLimit = 50; // Reset to default
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { daily_credit_limit: 50, limit_expiry: null } }
    );
  }

  const lastReset = user.last_credit_reset ? new Date(user.last_credit_reset) : new Date(0);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  let available = user.available_credits ?? dailyLimit;

  if (isNewDay) {
    available = dailyLimit;
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { 
          available_credits: dailyLimit, 
          last_credit_reset: now 
        } 
      }
    );
  }

  if (available <= 0) {
    return { 
      ok: false, 
      error: `Daily limit reached (${dailyLimit} messages). Please try again tomorrow.` 
    };
  }

  const result = await db.collection("users").findOneAndUpdate(
    { 
      _id: user._id, 
      available_credits: { $gt: 0 } 
    },
    { $inc: { available_credits: -1 } },
    { returnDocument: "after" }
  );

  if (result) {
    return { ok: true, available: result.available_credits };
  }

  return { 
    ok: false, 
    error: `Daily limit reached (${dailyLimit} messages). Please try again tomorrow.` 
  };
}

async function updateUserLimit(telegramUserId, newLimit, months = 0) {
  const db = await getDb();
  let expiry = null;
  if (months > 0) {
    expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
  }

  const query = (typeof telegramUserId === "string" && (telegramUserId.includes("@") || telegramUserId.includes("wa_"))) 
    ? { whatsapp_user_id: telegramUserId } 
    : { telegram_user_id: Number(telegramUserId) };

  const result = await db.collection("users").findOneAndUpdate(
    query,
    { 
      $set: { 
        daily_credit_limit: Number(newLimit),
        available_credits: Number(newLimit), // Give them credits immediately
        limit_expiry: expiry 
      } 
    },
    { returnDocument: "after" }
  );
  return result;
}

function isAdmin(telegramUserId) {
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim());
  return adminIds.includes(String(telegramUserId));
}

async function toggleUserBlock(telegramUserId, blockedStatus) {
  const db = await getDb();
  const query = (typeof telegramUserId === "string" && (telegramUserId.includes("@") || telegramUserId.includes("wa_"))) 
    ? { whatsapp_user_id: telegramUserId } 
    : { telegram_user_id: Number(telegramUserId) };

  const result = await db.collection("users").findOneAndUpdate(
    query,
    { $set: { is_blocked: !!blockedStatus, updated_at: new Date() } },
    { returnDocument: "after" }
  );
  return result;
}

async function getUserRoleInFamily(userId, familyId) {
  const user = await getUserByTelegramId(userId);
  if (!user) return "VIEWER";
  
  const fId = String(familyId);
  
  // Check joined families first
  const membership = (user.joined_families || []).find(f => String(f.family_id) === fId);
  if (membership && membership.status === "ACCEPTED") return membership.role;
  
  // Check if they are the primary owner of this familyId
  const isPrimaryOwner = String(user.family_id) === fId || 
                         String(user.telegram_user_id) === fId || 
                         (user.whatsapp_user_id && String(user.whatsapp_user_id) === fId);
                         
  return isPrimaryOwner ? "OWNER" : "VIEWER";
}

async function requestAccountDeletion(platformId) {
  const db = await getDb();
  const query = (typeof platformId === "string" && (platformId.includes("@") || platformId.includes("wa_"))) 
    ? { whatsapp_user_id: platformId } 
    : { telegram_user_id: Number(platformId) };

  const result = await db.collection("users").findOneAndUpdate(
    query,
    { 
      $set: { 
        status: "PENDING_DELETION", 
        deletion_requested_at: new Date(),
        updated_at: new Date() 
      } 
    },
    { returnDocument: "after" }
  );
  return result;
}

module.exports = { 
  upsertTelegramUser,
  upsertWhatsAppUser,
  getUserByTelegramId,
  getUserByWhatsAppId,
  getUserById,
  updateUserRole,
  updateUserProfile,
  updateUserPreferences,
  getFamilyId,
  checkAndConsumeCredit,
  updateUserLimit,
  isAdmin,
  toggleUserBlock,
  getUserRoleInFamily,
  requestAccountDeletion
};
