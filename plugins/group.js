/**
 * WhatsApp-Bot
 * Copyright (c) 2026 KichuExe
 *
 * This project is licensed under the MIT License.
 * You are free to use, modify, and distribute this software
 * in accordance with the terms of the license.
 *
 * @author KichuExe
 * @license MIT
 */

const groupPlugins = require('../lib/plugins.js');
const { formatNumberToJid, formatDescription } = require('./_helpers/tools.js');
const { getPdm, setPdm, delPdm } = require('./_helpers/database/group_automation.js');
const { savePdmSession, getPdmSession } = require('./_helpers/sessions.js');

/**
 * Adds a user to the group via number, mention, or replied message.
 *
 * Usage:
 * .add 9179xxxxxxx
 * .add @user
 * (reply to a message) .add
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'add',
  desc: 'Add participants to a group.',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : false;
  if (!jid) return await message.sendMessage(message.jid, "```Reply to a message, or provide a number to add!```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  if (await message.isParticipant(jid)) return await message.sendMessage(message.jid, "```This participant is already in the group!```", {}, 'reply');
  await client.groupParticipantsUpdate(message.jid, [jid], 'add')
    .then(async (response) => {
      for (let i of response) {
        if (i.status === '200') {
          return await message.sendMessage(message.jid, "```@" + jid.split('@')[0] + " has been added to the group.```", { mentions: [jid], quoted: message });
        }
        if (i.status === 401) {
          return await message.sendMessage(message.jid, "```Oops! I’ve been blocked by that user. Can’t add them.```", {}, 'reply');
        }
        if (i.status === 403) {}
      }
    });
})

/**
 * Removes a user from the group via number, mention, or replied message.
 *
 * Usage:
 * .kick 9179xxxxxxx
 * .kick @user
 * (reply to a message) .kick
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'kick',
  desc: 'Remove participants from a group.',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : false;
  if (!jid) return await message.sendMessage(message.jid, "```Reply to a message, or provide a number to add!```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  if (!await message.isParticipant(jid)) return await message.sendMessage(message.jid, "```This participant is not in the group!```", {}, 'reply');
  await client.groupParticipantsUpdate(message.jid, [jid], 'remove')
  return await message.sendMessage(message.jid, "```@" + jid.split('@')[0] + " has been removed from the group.```", { mentions: [jid], quoted: message })
})

/**
 * Promotes a user to admin via number, mention, or replied message.
 *
 * Usage:
 * .promote 9179xxxxxxx
 * .promote @user
 * (reply to a message) .promote
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'promote',
  desc: 'Promote a participant to admin.',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : false;
  if (!jid) return await message.sendMessage(message.jid, "```Mention a user, reply to a message, or provide a number to promote!```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  if (!await message.isParticipant(jid)) return await message.sendMessage(message.jid, "```This participant is not in the group!```", {}, 'reply');
  if (await message.isAdmin(jid)) return await message.sendMessage(message.jid, "```The user is already an admin.```", {}, 'reply');
  await client.groupParticipantsUpdate(message.jid, [jid], 'promote');
  return await message.sendMessage(message.jid, "```@" + jid.split('@')[0] + " has been promoted to admin.```", { mentions: [jid], quoted: message });
})

/**
 * Demotes an admin to a participant via number, mention, or replied message.
 *
 * Usage:
 * .demote 9179xxxxxxx
 * .demote @user
 * (reply to a message) .demote
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'demote',
  desc: 'Demote an admin to participant.',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : false;
  if (!jid) return await message.sendMessage(message.jid, "```Mention a user, reply to a message, or provide a number to demote!```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  if (!await message.isParticipant(jid)) return await message.sendMessage(message.jid, "```This participant is not in the group!```", {}, 'reply');
  if (!await message.isAdmin(jid)) return await message.sendMessage(message.jid, "```The user is not an admin.```", {}, 'reply');
  await client.groupParticipantsUpdate(message.jid, [jid], 'demote');
  return await message.sendMessage(message.jid, "```@" + jid.split('@')[0] + " is no longer an admin.```", { mentions: [jid], quoted: message });
})

/**
 * Mutes the group so only admins can send messages.
 *
 * Usage:
 * .mute
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'mute',
  desc: 'Mute a group (Only admins can send messages).',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupSettingUpdate(message.jid, 'announcement');
  return await message.sendMessage(message.jid, "```Muted!```");
})

/**
 * Unmutes the group so all participants can send messages.
 *
 * Usage:
 * .unmute
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'unmute',
  desc: 'Unmute a group (All participants can send messages).',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupSettingUpdate(message.jid, 'not_announcement');
  return await message.sendMessage(message.jid, "```Unmuted!```");
})

/**
 * Locks group settings so only admins can edit group info.
 *
 * Usage:
 * .glock
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'glock',
  desc: 'Restrict group info editing to admins only.',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupSettingUpdate(message.jid, 'locked');
  return await message.sendMessage(message.jid, "```Group settings have been locked. Only admins can edit now.```");
})

/**
 * Unlocks group settings so all participants can edit group info.
 *
 * Usage:
 * .gunlock
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'gunlock',
  desc: 'Restrict group info editing to admins only.',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupSettingUpdate(message.jid, 'unlocked');
  return await message.sendMessage(message.jid, "```Group settings have been unlocked. All participants can now edit.```");
})

/**
 * Changes the group subject (name).
 *
 * Usage:
 * .gname <new name>
 *
 * @param {object} ctx
 * @param {string} ctx.match - New group name
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'gname',
  desc: 'Change group subject (name).',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!match) return await message.sendMessage(message.jid, "```Please provide a new group name.```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupUpdateSubject(message.jid, match);
  return await message.sendMessage(message.jid, "```Group name changed to: " + match + "```");
})

/**
 * Changes the group description.
 *
 * Usage:
 * .gdesc <new description>
 *
 * @param {object} ctx
 * @param {string} ctx.match - New group description
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'gdesc',
  desc: 'Change group description.',
  fromMe: false,
  category: 'group'
}, async ({
  match,
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!match) return await message.sendMessage(message.jid, "```Please provide a new group description.```", {}, 'reply');
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  await client.groupUpdateDescription(message.jid, `${match}`);
  return await message.sendMessage(message.jid, "```Group description changed to: " + match + "```");
})

/**
 * Tags all group participants in a single message.
 *
 * Usage:
 * .tagall
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'tagall',
  desc: 'Tag all the members in the group.',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  const data = await client.groupMetadata(message.jid);
  if (!data || !data.participants) return;
  return await message.sendMessage(message.jid, "```" + data.participants.map((e, i) => `${i + 1}. @${e.id.split('@')[0]}`)
    .join("\n") + "```", { mentions: data.participants.map(i => i.id) })
})

/**
 * Generates and sends the group invite link.
 *
 * Usage:
 * .invite
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'invite',
  desc: 'Generate group invite link.',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  return await message.sendMessage(message.jid, "```https://chat.whatsapp.com/" + (await client.groupInviteCode(message.jid)) + "```");
})

/**
 * Revokes the current group invite link.
 *
 * Usage:
 * .revoke
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'revoke',
  desc: 'Revoke group invite link.',
  fromMe: false,
  category: 'group'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
  if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
  return await client.groupRevokeInvite(message.jid);
})

/**
 * Manages Promote/Demote message settings for the group.
 *
 * Usage:
 * .pdm
 * (reply with option number to configure)
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  pattern: 'pdm',
  desc: 'Promote demote message.',
  fromMe: true,
  category: 'group'
}, async ({
  message
}) => {
  if (!message.isGroup) return;
  const status = await getPdm(message.jid);
  const sent = await message.sendMessage(message.jid, status ? "```" + `Promote Demote Message\n\n Status: ${status.status ? 'ON' : 'OFF'}` + "\n\n\nOptions:\n\n1. Enable\n2. Disable\n3. Delete\n\nReply with the number of the option you want.```" : "```Promote Demote Message is not enabled in this group.\n\n\nOptions:\n\n1. Enable\n\nReply with the number of the option you want.```");
  savePdmSession(sent.key.id, message.sender, [0, 1, 2]);
})

/**
 * Handles user replies for Promote/Demote message configuration.
 *
 * Processes numeric responses to enable, disable, or delete
 * Promote/Demote message settings based on active session state.
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object containing user reply
 * @returns {Promise<void>}
 */
groupPlugins.addPlugin({
  on: 'text',
  fromMe: true
}, async ({
  message
}) => {
  if (!message.reply_message?.text || !message.text) return;
  if (!message.reply_message.text.startsWith("```Promote Demote Message" || "```Promote Demote Message is not enabled in this group.")) return;
  const session = getPdmSession(message.reply_message.key.id);
  if (!session || message.sender !== session.user) return;
  const i = parseInt(message.text.trim());
  if (!i || i < 1 || i > session.data.length) return;
  const option = session.data[i - 1];
  const status = await getPdm(message.jid);
  switch (option) {
  case 0: {
    if (!status) {
      const data = await setPdm(message.jid, true);
      if (!data) return;
      return message.sendMessage(message.jid, "```Promote Demote Message has been enabled successfully.```");
    }
    if (status.status) {
      return message.sendMessage(message.jid, "```Promote Demote Message is already enabled.```");
    }
    const data = await setPdm(message.jid, true);
    if (!data) return;
    return message.sendMessage(message.jid, "```Promote Demote Message has been enabled successfully.```");
  }
  case 1: {
    if (!status) {
      const data = await setPdm(message.jid, false);
      if (!data) return;
      return message.sendMessage(message.jid, "```Promote Demote Message has been disabled successfully.```");
    }
    if (!status.status) {
      return message.sendMessage(message.jid, "```PDM is already disabled.```");
    }
    const data = await setPdm(message.jid, false);
    if (!data) return;
    return message.sendMessage(message.jid, "```Promote Demote Message has been disabled successfully.```");
  }
  case 2: {
    if (!status) return;
    const data = await delPdm(message.jid);
    if (!data) return;
    return message.sendMessage(message.jid, "```Promote Demote Message has been successfully deleted.```");
  }
  }
})
