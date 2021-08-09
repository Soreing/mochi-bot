require('dotenv').config();

const Commons  = require('./commons.js');
const pg       = require('pg');

var dbpool = new pg.Pool(
	{
		user: process.env.DB_USR,
		host: process.env.DB_IP,
		database: process.env.DB_NAME,
		password: process.env.DB_PWD,
		port: process.env.DB_PORT,
		max: 200
	});

module.exports = {
	
	pool: function pool() { return dbpool; },
};

