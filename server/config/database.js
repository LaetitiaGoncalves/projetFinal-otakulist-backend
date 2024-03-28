const mysql = require("mysql2");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "otakulist",
  password: "root",
});

module.exports = connection.promise();
