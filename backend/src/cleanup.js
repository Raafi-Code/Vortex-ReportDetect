import cron from "node-cron";
import supabase from "./supabase.js";
import config from "./config.js";

/**
 * Cleanup media files older than retention period (default: 30 days)
 */
async function cleanupOldMedia() {
  const retentionDays = config.storage.mediaRetentionDays;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  console.log(
    `🧹 Running media cleanup for files older than ${retentionDays} days...`,
  );
  console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // 1. Fetch messages with media older than cutoff
    const { data: oldMessages, error: fetchError } = await supabase
      .from("messages")
      .select("id, media_storage_path, media_url")
      .not("media_storage_path", "is", null)
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) {
      console.error("❌ Error fetching old messages:", fetchError.message);
      return;
    }

    if (!oldMessages || oldMessages.length === 0) {
      console.log("✅ No old media to cleanup.");
      return;
    }

    console.log(`🗂️ Found ${oldMessages.length} media files to cleanup.`);

    // 2. Delete files from Supabase Storage in batches
    const storagePaths = oldMessages
      .map((m) => m.media_storage_path)
      .filter(Boolean);

    if (storagePaths.length > 0) {
      // Delete in batches of 100
      for (let i = 0; i < storagePaths.length; i += 100) {
        const batch = storagePaths.slice(i, i + 100);
        const { error: deleteError } = await supabase.storage
          .from(config.storage.bucket)
          .remove(batch);

        if (deleteError) {
          console.error(
            `❌ Error deleting storage batch ${i}:`,
            deleteError.message,
          );
        } else {
          console.log(`🗑️ Deleted storage batch ${i + 1}-${i + batch.length}`);
        }
      }
    }

    // 3. Update database records - remove media references
    const messageIds = oldMessages.map((m) => m.id);
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        media_url: null,
        media_type: null,
        media_storage_path: null,
      })
      .in("id", messageIds);

    if (updateError) {
      console.error("❌ Error updating messages:", updateError.message);
      return;
    }

    console.log(
      `✅ Cleanup complete. Removed ${storagePaths.length} media files.`,
    );
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
  }
}

/**
 * Cleanup messages strictly older than retention period (default: 365 days)
 */
async function cleanupOldMessages() {
  const retentionDays = parseInt(
    process.env.MESSAGE_RETENTION_DAYS || "365",
    10,
  );
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  console.log(
    `\n🧹 Running message cleanup for records older than ${retentionDays} days...`,
  );
  console.log(`📅 Message Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    let totalDeleted = 0;
    let keepRunning = true;

    while (keepRunning) {
      const { data: oldMessages, error: fetchError } = await supabase
        .from("messages")
        .select("id, media_storage_path")
        .lt("created_at", cutoffDate.toISOString())
        .limit(1000);

      if (fetchError) {
        console.error("❌ Error fetching old messages:", fetchError.message);
        break;
      }

      if (!oldMessages || oldMessages.length === 0) {
        keepRunning = false;
        break;
      }

      // First, remove associated media if it has any
      const storagePaths = oldMessages
        .map((m) => m.media_storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        for (let i = 0; i < storagePaths.length; i += 100) {
          const batch = storagePaths.slice(i, i + 100);
          await supabase.storage.from(config.storage.bucket).remove(batch);
        }
      }

      // Delete the messages themselves
      const messageIds = oldMessages.map((m) => m.id);
      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .in("id", messageIds);

      if (deleteError) {
        console.error("❌ Error batch deleting messages:", deleteError.message);
        break;
      }

      totalDeleted += messageIds.length;
      console.log(`🗑️ Deleted batch of ${messageIds.length} old messages...`);

      if (messageIds.length < 1000) {
        keepRunning = false;
      }
    }

    if (totalDeleted > 0) {
      console.log(
        `✅ Message cleanup complete. Total removed: ${totalDeleted} messages.`,
      );
    } else {
      console.log("✅ No old messages to cleanup.");
    }
  } catch (err) {
    console.error("❌ Message cleanup error:", err.message);
  }
}

/**
 * Start the cleanup cron job
 * Runs every day at midnight (00:00) Asia/Jakarta timezone
 */
export function startCleanupCron() {
  console.log(
    "⏰ Media and Message cleanup cron job scheduled (daily at 00:00 WIB)",
  );

  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log(
        `\n🕒 [${new Date().toISOString()}] Running scheduled cleanup...`,
      );
      await cleanupOldMedia();
      await cleanupOldMessages();
    },
    {
      timezone: "Asia/Jakarta",
    },
  );
}

/**
 * Run cleanup manually (for API endpoint)
 */
export { cleanupOldMedia, cleanupOldMessages };
