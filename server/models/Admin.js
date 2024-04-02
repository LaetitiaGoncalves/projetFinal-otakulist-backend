const db = require("../config/database");

class Admin {
  // Création d'un nouvel admin
  static create({
    email,
    droits,
    token,
    hash,
    salt,
  }) {
    return db.execute(
      "INSERT INTO admins (email, droits, token, hash, salt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, droits, token, hash, salt]
    );
  }

  // Trouver un admain par email
  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  
}

module.exports = Admin;
