const {initSequelize} = require('../../../lib/database.js');
const {DataTypes} = require('sequelize');

const pdmDatabase = initSequelize.define('pdm', {
  jid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
});

(async () => {
	await pdmDatabase.sync({
		alter: true
	});
})();

async function getPdm(jid) {
  const response = await pdmDatabase.findOne({ where: { jid } });
  return response ? response.dataValues : null;
}


async function setPdm(jid, status) {
  const isExisting = await getPdm(jid);
  return isExisting ? await pdmDatabase.update({ status }, { where: { jid } }) : await pdmDatabase.create({ jid, status });
}


async function delPdm(jid) {
  const isExisting = await getPdm(jid);
  if(isExisting) {
    await pdmDatabase.destroy({ where: { jid } })
    return true;
  } else {
   return false;
  }
}


async function getAllPdm() {
  const response = [];
  const data = await pdmDatabase.findAll();
  data.map((e, i) => {
    response.push(
      {
        jid: e.dataValues.jid,
        status: e.dataValues.status
      }
    )
});
return response
}

/**
@automute_and_autounmute
**/
const amute_aunmuteDatabase = initSequelize.define('amute_aunmute', {
	jid: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	time: {
		type: DataTypes.STRING,
		allowNull: false
	},
	timezone: {
		type: DataTypes.STRING,
		allowNull: false
	}
}, {
	tableName: 'amute_aunmute'
});

(async () => {
	await amute_aunmuteDatabase.sync({
		alter: true
	});
})();

async function getAutoMute(jid) {
  
}

async function setAutoMute(jid, time, timezone) {
  
}

module.exports = {setPdm, getPdm, delPdm, getAllPdm, getAutoMute, setAutoMute};
