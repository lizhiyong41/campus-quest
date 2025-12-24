// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

// 创建连接池，使用环境变量中的链接
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 导出查询接口，供其他文件调用
module.exports = {
    query: (text, params) => pool.query(text, params),
};