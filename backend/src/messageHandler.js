import supabase from './supabase.js';
import { handleMedia } from './mediaHandler.js';
import { forwardMessage } from './forwarder.js';

/**
 * Extract text content from a WhatsApp message
 */
function extractMessageText(msg) {
  const m = msg.message;
  if (!m) return '';

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  );
}

/**
 * Extract sender info from a message
 */
function extractSenderInfo(msg) {
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const pushName = msg.pushName || 'Unknown';
  return { senderJid, senderName: pushName };
}

/**
 * Check if a group is being monitored
 */
async function isGroupMonitored(groupJid) {
  const { data, error } = await supabase
    .from('monitored_groups')
    .select('id')
    .eq('group_jid', groupJid)
    .eq('is_active', true)
    .single();

  return !error && !!data;
}

/**
 * Get all active keywords
 */
async function getActiveKeywords() {
  const { data, error } = await supabase
    .from('keywords')
    .select('keyword')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching keywords:', error.message);
    return [];
  }

  return data.map((k) => k.keyword.toLowerCase());
}

/**
 * Check if message text matches any keyword
 * Returns the first matched keyword or null
 */
function matchKeyword(text, keywords) {
  if (!text || keywords.length === 0) return null;

  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Check if auto-forward is enabled
 */
async function isAutoForwardEnabled() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'auto_forward_enabled')
    .single();

  if (error || !data) return true; // Default to enabled
  return data.value === 'true';
}

/**
 * Get forwarding rules for a source group
 */
async function getForwardingRules(sourceGroupJid) {
  const { data, error } = await supabase
    .from('forwarding_rules')
    .select('*')
    .eq('source_group_jid', sourceGroupJid)
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching forwarding rules:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Save message to database
 */
async function saveMessage(messageData) {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving message:', error.message);
    return null;
  }

  return data;
}

/**
 * Get group name from Supabase or use JID as fallback
 */
async function getGroupName(groupJid) {
  const { data } = await supabase
    .from('monitored_groups')
    .select('group_name')
    .eq('group_jid', groupJid)
    .single();

  return data?.group_name || groupJid;
}

/**
 * Main message handler - called for every incoming group message
 */
export async function handleIncomingMessage(sock, msg) {
  const groupJid = msg.key.remoteJid;

  // 1. Check if this group is monitored
  const monitored = await isGroupMonitored(groupJid);
  if (!monitored) return;

  // 2. Extract message content
  const text = extractMessageText(msg);
  const { senderJid, senderName } = extractSenderInfo(msg);

  // 3. Check keyword match
  const keywords = await getActiveKeywords();
  const matchedKeyword = matchKeyword(text, keywords);

  if (!matchedKeyword) return; // No keyword match, skip

  console.log(`🔍 Keyword matched: "${matchedKeyword}" from ${senderName} in ${groupJid}`);

  // 4. Handle media (download & upload to Supabase Storage)
  const media = await handleMedia(sock, msg);

  // 5. Get group name
  const groupName = await getGroupName(groupJid);

  // 6. Save to database
  const messageData = {
    group_jid: groupJid,
    group_name: groupName,
    sender_jid: senderJid,
    sender_name: senderName,
    message_text: text,
    media_url: media?.url || null,
    media_type: media?.type || null,
    media_storage_path: media?.storagePath || null,
    is_forwarded: false,
    is_read: false,
    matched_keyword: matchedKeyword,
    raw_message_id: msg.key.id,
  };

  const savedMessage = await saveMessage(messageData);
  if (!savedMessage) return;

  console.log(`💾 Message saved to database (ID: ${savedMessage.id})`);

  // 7. Auto-forward if enabled
  const autoForward = await isAutoForwardEnabled();
  if (!autoForward) {
    console.log('⏸️ Auto-forward is disabled. Message saved but not forwarded.');
    return;
  }

  // 8. Get forwarding rules and forward
  const rules = await getForwardingRules(groupJid);
  if (rules.length === 0) {
    console.log('ℹ️ No forwarding rules for this group.');
    return;
  }

  for (const rule of rules) {
    try {
      await forwardMessage(sock, rule.target_jid, {
        text,
        mediaBuffer: media?.buffer || null,
        mediaType: media?.type || null,
        mediaMimetype: media?.mimetype || null,
        senderName,
        groupName,
        matchedKeyword,
      });

      console.log(`📨 Forwarded to ${rule.target_name} (${rule.target_jid})`);
    } catch (err) {
      console.error(`❌ Error forwarding to ${rule.target_jid}:`, err.message);
    }
  }

  // 9. Mark as forwarded in database
  await supabase
    .from('messages')
    .update({ is_forwarded: true })
    .eq('id', savedMessage.id);

  console.log(`✅ Message processed & forwarded successfully.`);
}
