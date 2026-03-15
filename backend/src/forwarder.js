/**
 * Forward a matched message to a target group/contact
 * @param {object} sock - Baileys socket
 * @param {string} targetJid - Target group/contact JID
 * @param {object} messageInfo - Message info (text, media buffer, sender, group)
 */
export async function forwardMessage(sock, targetJid, messageInfo) {
  const { text, senderName, groupName, matchedKeyword, mediaBuffer, mediaType, mediaMimetype } = messageInfo;

  // Build formatted header
  const header = [
    `📩 *Pesan Terdeteksi*`,
    `━━━━━━━━━━━━━━━━━`,
    `👤 *Pengirim:* ${senderName}`,
    `👥 *Grup:* ${groupName}`,
    `🔑 *Keyword:* ${matchedKeyword}`,
    `🕐 *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
    `━━━━━━━━━━━━━━━━━`,
    ``,
  ].join('\n');

  const fullText = `${header}${text}`;

  try {
    if (mediaBuffer && mediaType === 'image') {
      // Forward with image + caption
      await sock.sendMessage(targetJid, {
        image: mediaBuffer,
        caption: fullText,
        mimetype: mediaMimetype || 'image/jpeg',
      });
    } else if (mediaBuffer && mediaType === 'video') {
      // Forward with video + caption
      await sock.sendMessage(targetJid, {
        video: mediaBuffer,
        caption: fullText,
        mimetype: mediaMimetype || 'video/mp4',
      });
    } else if (mediaBuffer && mediaType === 'document') {
      // Forward document, then text separately
      await sock.sendMessage(targetJid, {
        document: mediaBuffer,
        mimetype: mediaMimetype || 'application/octet-stream',
        fileName: 'document',
      });
      await sock.sendMessage(targetJid, { text: fullText });
    } else if (mediaBuffer && mediaType === 'audio') {
      // Forward audio, then text separately
      await sock.sendMessage(targetJid, {
        audio: mediaBuffer,
        mimetype: mediaMimetype || 'audio/ogg',
      });
      await sock.sendMessage(targetJid, { text: fullText });
    } else {
      // Text only
      await sock.sendMessage(targetJid, { text: fullText });
    }
  } catch (err) {
    console.error(`❌ Forwarding error to ${targetJid}:`, err.message);
    throw err;
  }
}
