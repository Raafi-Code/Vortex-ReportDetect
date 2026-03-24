import { downloadMediaMessage } from "@whiskeysockets/baileys";
import supabase from "./supabase.js";
import config from "./config.js";
import crypto from "crypto";

/**
 * Download media from a WhatsApp message and upload to Supabase Storage
 * @param {object} sock - Baileys socket
 * @param {object} msg - WhatsApp message object
 * @returns {object|null} { storagePath, signedUrl, type, mimetype } or null if no media
 */
export async function handleMedia(sock, msg) {
  const messageContent = msg.message;
  if (!messageContent) return null;

  // Determine media type
  let mediaType = null;
  let mimetype = null;

  if (messageContent.imageMessage) {
    mediaType = "image";
    mimetype = messageContent.imageMessage.mimetype || "image/jpeg";
  } else if (messageContent.videoMessage) {
    mediaType = "video";
    mimetype = messageContent.videoMessage.mimetype || "video/mp4";
  } else if (messageContent.documentMessage) {
    mediaType = "document";
    mimetype =
      messageContent.documentMessage.mimetype || "application/octet-stream";
  } else if (messageContent.audioMessage) {
    mediaType = "audio";
    mimetype = messageContent.audioMessage.mimetype || "audio/ogg";
  }

  if (!mediaType) return null;

  try {
    console.log(`📥 Downloading ${mediaType}...`);

    // Download the media buffer
    const buffer = await downloadMediaMessage(msg, "buffer", {});

    if (!buffer) {
      console.error("❌ Failed to download media: empty buffer");
      return null;
    }

    // Generate unique filename
    const ext = getExtFromMimetype(mimetype);
    const uniqueId = crypto.randomUUID();
    const datePrefix = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filePath = `${datePrefix}/${uniqueId}.${ext}`;

    console.log(`📤 Uploading ${mediaType} to Supabase Storage...`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(config.storage.bucket)
      .upload(filePath, buffer, {
        contentType: mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase Storage upload error:", error.message);
      return null;
    }

    // Get short-lived signed URL (private storage access)
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(config.storage.bucket)
        .createSignedUrl(filePath, config.storage.signedUrlExpiresIn);

    if (signedUrlError) {
      console.error("❌ Failed to create signed URL:", signedUrlError.message);
    }

    const signedUrl = signedUrlData?.signedUrl || null;

    console.log(`✅ Media uploaded to private storage: ${filePath}`);

    return {
      url: signedUrl,
      signedUrl,
      type: mediaType,
      mimetype,
      storagePath: filePath,
      buffer, // Keep buffer for forwarding
    };
  } catch (err) {
    console.error("❌ Media handling error:", err.message);
    return null;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtFromMimetype(mimetype) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return map[mimetype] || "bin";
}
