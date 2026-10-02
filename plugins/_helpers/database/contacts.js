const { initSequelize } = require('../../../lib/database.js');
const { DataTypes } = require('sequelize');

const Contacts = initSequelize.define('contacts', {
  jid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  lid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'contacts'
});

Contacts.sync({ alter: true });

async function saveContact(jid, lid, senderName) {
  if (!jid) return;

  try {
    await Contacts.upsert({
      jid,
      lid,
      senderName: senderName || 'Unknown'
    });
  } catch (error) {
    console.error('Contacts Save Error:', error);
  }
}

module.exports = { Contacts, saveContact };
