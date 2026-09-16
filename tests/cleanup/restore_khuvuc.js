const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'realestate',
        multipleStatements: true
    });

    console.log("Reading realestate.sql...");
    const sqlContent = fs.readFileSync('../realestate.sql', 'utf8');
    const lines = sqlContent.split(/\r?\n/);

    let query = "SET FOREIGN_KEY_CHECKS = 0;\nDROP TABLE IF EXISTS `khuvuc`;\nSET FOREIGN_KEY_CHECKS = 1;\n";
    
    // Lines 551 to 3341 (0-indexed: 550 to 3340) - CREATE TABLE & INSERTs
    for(let i = 550; i <= 3340; i++) { 
        if (lines[i] !== undefined) query += lines[i] + "\n"; 
    }
    
    // Lines 5118 to 5120 - PRIMARY KEY & INDEXES
    for(let i = 5117; i <= 5119; i++) { 
        if (lines[i] !== undefined) query += lines[i] + "\n"; 
    }
    
    // Lines 5348 to 5349 - AUTO_INCREMENT
    for(let i = 5347; i <= 5348; i++) { 
        if (lines[i] !== undefined) query += lines[i] + "\n"; 
    }
    
    // Lines 5490 to 5491 - CONSTRAINTS
    for(let i = 5489; i <= 5490; i++) { 
        if (lines[i] !== undefined) query += lines[i] + "\n"; 
    }

    try {
        console.log("Executing restore queries for khuvuc...");
        await pool.query(query);
        console.log("✅ Restore khuvuc complete!");
    } catch (e) {
        console.error("❌ Failed:", e);
    }
    process.exit(0);
}
run();
