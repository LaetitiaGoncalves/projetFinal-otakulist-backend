const db = require("../config/database");

class User {
  // Création d'un nouvel utilisateur
  static create({
    email,
    username,
    avatarUrl,
    avatarPublicId,
    token,
    hash,
    salt,
  }) {
    return db.execute(
      "INSERT INTO users (email, username, avatar_url, avatar_public_id, token, hash, salt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, username, avatarUrl, avatarPublicId, token, hash, salt]
    );
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Mettre à jour un utilisateur
  static updateById(
    id,
    { username, avatarUrl, avatarPublicId, token, hash, salt }
  ) {
    return db.execute(
      "UPDATE users SET username = ?, avatar_url = ?, avatar_public_id = ?, token = ?, hash = ?, salt = ? WHERE id = ?",
      [username, avatarUrl, avatarPublicId, token, hash, salt, id]
    );
  }

  // Supprimer un utilisateur
  static deleteById(id) {
    return db.execute("DELETE FROM users WHERE id = ?", [id]);
  }
}

module.exports = User;
