const { initSequelize } = require('../../../lib/database.js');
const { DataTypes } = require('sequelize');

const GeminiSessions = initSequelize.define('gemini_sessions', {
  jid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  sessionId: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'gemini_sessions'
});

GeminiSessions.sync({ alter: true });

async function getSessionId(jid) {
  if (!jid) return null;

  const data = await GeminiSessions.findOne({ where: { jid } });
  return data?.sessionId || null;
}

async function saveSessionId(jid, sessionId) {
  if (!jid || !sessionId) return;

  await GeminiSessions.upsert({ jid, sessionId });
}

module.exports = {
  GeminiSessions,
  getSessionId,
  saveSessionId
};
