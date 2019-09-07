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
db.models.Users = require('./models/Users')(sequelize);
db.models.Courses = require('./models/Courses')(sequelize);

module.exports = db;