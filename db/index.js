// require Sequelize
const Sequelize = require('sequelize');

// Set up the sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'fsjstd-restapi.db' 
});

const db = {
    sequelize,
    Sequelize,
    models: {  }
}

// TODO: define models here

module.exports = db;