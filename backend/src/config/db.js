const mongoose = require('mongoose');

async function main() {
    const connStr = process.env.DB_CONNECT_STRING;
    const dbName = process.env.DB_NAME || 'leetcode';
    await mongoose.connect(connStr, { dbName });
}

module.exports = main;


