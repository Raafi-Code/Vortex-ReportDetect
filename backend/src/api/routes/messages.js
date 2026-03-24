import { Router } from "express";
import supabase from "../../supabase.js";
import config from "../../config.js";

const router = Router();

async function attachSignedUrl(message) {
  if (!message?.media_storage_path) return message;

  const { data, error } = await supabase.storage
    .from(config.storage.bucket)
    .createSignedUrl(
      message.media_storage_path,
      config.storage.signedUrlExpiresIn,
    );

  if (error) {
    return message;
  }

  return {
    ...message,
    media_url: data?.signedUrl || null,
  };
}

async function attachSignedUrls(messages = []) {
  return Promise.all(messages.map((msg) => attachSignedUrl(msg)));
}

/**
 * GET /api/messages
 * Get paginated messages with optional filters
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      group_jid,
      is_read,
      search,
      keyword,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (group_jid) query = query.eq("group_jid", group_jid);
    if (is_read !== undefined) query = query.eq("is_read", is_read === "true");
    if (keyword) query = query.eq("matched_keyword", keyword);
    if (search) query = query.ilike("message_text", `%${search}%`);

    const { data, error, count } = await query;

    if (error) throw error;

    const signedData = await attachSignedUrls(data || []);

    res.json({
      success: true,
      data: signedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/stats
 * Get message statistics
 */
router.get("/stats", async (req, res) => {
  try {
    // Total messages
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    // Unread messages
    const { count: unreadMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Forwarded messages
    const { count: forwardedMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("is_forwarded", true);

    // Messages with media
    const { count: mediaMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .not("media_storage_path", "is", null);

    // Active groups count
    const { count: activeGroups } = await supabase
      .from("monitored_groups")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Active keywords count
    const { count: activeKeywords } = await supabase
      .from("keywords")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    res.json({
      success: true,
      data: {
        totalMessages,
        unreadMessages,
        forwardedMessages,
        mediaMessages,
        activeGroups,
        activeKeywords,
        todayMessages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/charts/activity-over-time
 * Get message activity over time with optional date range and granularity
 */
router.get("/charts/activity-over-time", async (req, res) => {
  try {
    const { start_date, end_date, granularity = "daily" } = req.query;
    const data = [];

    let startDate, finalEndDate;

    if (start_date && end_date) {
      startDate = new Date(start_date);
      finalEndDate = new Date(end_date);
    } else {
      // Default to last 7 days
      finalEndDate = new Date();
      startDate = new Date(finalEndDate);
      startDate.setDate(startDate.getDate() - 6);
    }

    startDate.setHours(0, 0, 0, 0);
    finalEndDate.setHours(23, 59, 59, 999);

    if (granularity === "yearly") {
      // Yearly aggregation
      const startYear = startDate.getFullYear();
      const endYear = finalEndDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const yearStart = new Date(year, 0, 1);
        yearStart.setHours(0, 0, 0, 0);

        const yearEnd = new Date(year, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);

        const queryStart = yearStart < startDate ? startDate : yearStart;
        const queryEnd = yearEnd > finalEndDate ? finalEndDate : yearEnd;

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .gte("created_at", queryStart.toISOString())
          .lte("created_at", queryEnd.toISOString());

        data.push({
          time: year.toString(),
          count: count || 0,
        });
      }
    } else if (granularity === "monthly") {
      // Monthly aggregation
      const currentMonth = new Date(startDate);
      currentMonth.setDate(1);

      while (currentMonth <= finalEndDate) {
        const monthStart = new Date(currentMonth);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(currentMonth);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const queryEnd = monthEnd > finalEndDate ? finalEndDate : monthEnd;

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", queryEnd.toISOString());

        const monthStr = monthStart.toLocaleDateString("id-ID", {
          month: "short",
        });
        data.push({
          time: monthStr,
          count: count || 0,
        });

        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    } else {
      // Daily aggregation (default)
      const numDays =
        Math.ceil((finalEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      for (let i = 0; i < numDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);

        if (date > finalEndDate) break;

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDate.toISOString());

        const dateStr = date.toLocaleDateString("id-ID", {
          month: "short",
          day: "numeric",
        });
        data.push({
          time: dateStr,
          count: count || 0,
        });
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/charts/top-groups
 * Get top 10 groups by message count with optional date range
 */
router.get("/charts/top-groups", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = supabase
      .from("messages")
      .select("group_name")
      .not("group_name", "is", null);

    if (start_date) {
      query = query.gte("created_at", `${start_date}T00:00:00`);
    }
    if (end_date) {
      query = query.lte("created_at", `${end_date}T23:59:59`);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Count messages by group
    const groupCounts = {};
    messages.forEach((msg) => {
      groupCounts[msg.group_name] = (groupCounts[msg.group_name] || 0) + 1;
    });

    // Convert to array and sort
    const data = Object.entries(groupCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/charts/top-keywords
 * Get top 10 keywords by match count with optional date range
 */
router.get("/charts/top-keywords", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = supabase
      .from("messages")
      .select("matched_keyword")
      .not("matched_keyword", "is", null);

    if (start_date) {
      query = query.gte("created_at", `${start_date}T00:00:00`);
    }
    if (end_date) {
      query = query.lte("created_at", `${end_date}T23:59:59`);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Count matches by keyword
    const keywordCounts = {};
    messages.forEach((msg) => {
      keywordCounts[msg.matched_keyword] =
        (keywordCounts[msg.matched_keyword] || 0) + 1;
    });

    // Convert to array and sort
    const data = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/:id
 * Get single message detail
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const signedMessage = await attachSignedUrl(data);

    // Mark as read
    await supabase.from("messages").update({ is_read: true }).eq("id", id);

    res.json({ success: true, data: { ...signedMessage, is_read: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/messages/:id/read
 * Mark message as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/messages/read-all
 * Mark all messages as read
 */
router.patch("/read-all", async (req, res) => {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) throw error;
    res.json({ success: true, message: "All messages marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get message to check for media
    const { data: msg } = await supabase
      .from("messages")
      .select("media_storage_path")
      .eq("id", id)
      .single();

    // Delete media from storage if exists
    if (msg?.media_storage_path) {
      await supabase.storage
        .from(config.storage.bucket)
        .remove([msg.media_storage_path]);
    }

    // Delete message
    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
