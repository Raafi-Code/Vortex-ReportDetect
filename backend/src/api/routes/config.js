import { Router } from "express";
import supabase from "../../supabase.js";
import config from "../../config.js";

const router = Router();

async function getAllMessageMediaPaths() {
  const pageSize = 1000;
  let from = 0;
  const paths = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("messages")
      .select("media_storage_path")
      .not("media_storage_path", "is", null)
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.media_storage_path) {
        paths.push(row.media_storage_path);
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return [...new Set(paths)];
}

async function removeMediaFiles(paths) {
  if (!paths || paths.length === 0) {
    return 0;
  }

  let removedCount = 0;
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await supabase.storage
      .from(config.storage.bucket)
      .remove(batch);

    if (!error) {
      removedCount += batch.length;
    } else {
      console.error("Failed removing storage batch:", error.message);
    }
  }

  return removedCount;
}

/**
 * GET /api/config
 * Get all app configuration
 */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("app_config").select("*");

    if (error) throw error;

    // Convert array to key-value object
    const configObj = {};
    for (const item of data || []) {
      configObj[item.key] = item.value;
    }

    res.json({ success: true, data: configObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/config/:key
 * Set a config value
 */
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res
        .status(400)
        .json({ success: false, error: "value is required" });
    }

    const { data, error } = await supabase
      .from("app_config")
      .upsert({ key, value: String(value) }, { onConflict: "key" })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/forwarding-rules
 * Get all forwarding rules
 */
router.get("/forwarding-rules", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("forwarding_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/forwarding-rules
 * Create a forwarding rule
 */
router.post("/forwarding-rules", async (req, res) => {
  try {
    const { source_group_jid, target_jid, target_name, target_type } = req.body;

    if (!source_group_jid || !target_jid || !target_name) {
      return res.status(400).json({
        success: false,
        error: "source_group_jid, target_jid, and target_name are required",
      });
    }

    const { data, error } = await supabase
      .from("forwarding_rules")
      .insert({
        source_group_jid,
        target_jid,
        target_name,
        target_type: target_type || "group",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/forwarding-rules/:id
 * Update a forwarding rule
 */
router.patch("/forwarding-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("forwarding_rules")
      .update(updates)
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
 * DELETE /api/forwarding-rules/:id
 * Delete a forwarding rule
 */
router.delete("/forwarding-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("forwarding_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Forwarding rule deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/config/reset-data
 * Reset operational data without touching auth/accounts
 */
router.post("/reset-data", async (req, res) => {
  try {
    const mediaPaths = await getAllMessageMediaPaths();
    const removedMediaCount = await removeMediaFiles(mediaPaths);

    // Clear operational tables (auth users are in Supabase Auth and are untouched)
    const { error: deleteMessagesError } = await supabase
      .from("messages")
      .delete()
      .not("id", "is", null);
    if (deleteMessagesError) throw deleteMessagesError;

    const { error: deleteRulesError } = await supabase
      .from("forwarding_rules")
      .delete()
      .not("id", "is", null);
    if (deleteRulesError) throw deleteRulesError;

    const { error: deleteGroupsError } = await supabase
      .from("monitored_groups")
      .delete()
      .not("id", "is", null);
    if (deleteGroupsError) throw deleteGroupsError;

    const { error: deleteKeywordsError } = await supabase
      .from("keywords")
      .delete()
      .not("id", "is", null);
    if (deleteKeywordsError) throw deleteKeywordsError;

    const { error: deleteConfigError } = await supabase
      .from("app_config")
      .delete()
      .not("id", "is", null);
    if (deleteConfigError) throw deleteConfigError;

    // Recreate default app config values after reset
    const { error: seedConfigError } = await supabase.from("app_config").upsert(
      [
        {
          key: "auto_forward_enabled",
          value: "true",
          description: "Enable/disable automatic message forwarding",
        },
        {
          key: "media_retention_days",
          value: "30",
          description: "Number of days to keep media files before cleanup",
        },
      ],
      { onConflict: "key" },
    );
    if (seedConfigError) throw seedConfigError;

    res.json({
      success: true,
      message: "Operational data reset completed",
      data: {
        removedMediaCount,
        authPreserved: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
