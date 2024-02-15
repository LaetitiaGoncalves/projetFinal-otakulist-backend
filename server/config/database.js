const mysql = require("mysql2");

const connection = mysql.createPool({
  host: "localhost",
  user: "laetitia",
  database: "otakulist",
  password: "root",
});

module.exports = connection.promise();
