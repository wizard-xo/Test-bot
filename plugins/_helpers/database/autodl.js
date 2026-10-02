const {initSequelize} = require('../../../lib/database.js');
const {DataTypes} = require('sequelize');

const autodlDatabase = initSequelize.define('autodl', {
	jid: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: false
	}
}, {
	tableName: 'autodl'
});

(async () => {
	await autodlDatabase.sync({
		alter: true
	});
})();

async function getAutodl(jid) {
	const response = await autodlDatabase.findOne({
		where: {
			jid
		}
	});
	return response ? response.dataValues : false;
}

async function setAutodl(jid, value) {
  const isExisting = await getAutodl(jid);
  return isExisting ? await autodlDatabase.update({ status: value }, { where: { jid } }) : await autodlDatabase.create({ jid, status: value });
}

async function delAutodl(jid) {
  const isExisting = await getAutodl(jid);
  if(isExisting) {
    await autodlDatabase.destroy({ where: { jid } })
    return true;
  } else {
   return false;
}
}

async function getAllAutodl() {
  const response = [];
  const data = await autodlDatabase.findAll();
  data.map((e, i) => {
    response.push(
      {
        jid: e.dataValues.jid,
        status: e.dataValues.status
      }
    )
});
return response.length > 0 ? response : false;
}

module.exports = {getAutodl, setAutodl, delAutodl, getAllAutodl}
