const {Sequelize} = require('sequelize');
const config = require('../config.js');

if(!config.DATABASE_URL) throw new Error('Database url not provided.');

const initSequelize = new Sequelize(config.DATABASE_URL, {
  dialect: new URL(config.DATABASE_URL).protocol.replace(':', '') === 'postgresql' ? 'postgres' : '',
  protocol: "postgres",
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
  },
  logging: false
}
);


class databaseConnection {
  constructor () {
    
  }
  async connect() {
    try {
      await initSequelize.authenticate();
      console.log('Database connection established.');
    } catch {
      console.log('Database connection failed.');
    }
  }
}


module.exports = {initSequelize, databaseConnection};
