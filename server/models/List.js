const db = require("../config/database");

class List {
  // Insérer un élement dans la liste
  static create({ title, image, userId, status }) {
    return db.execute(
      "INSERT INTO lists (title, image, user_id, status) VALUES (?, ?, ?, ?)",
      [title, image, userId, status]
    );
  }

  // Mettre à jour un élément de sa liste avec son statut
  static updateById(id, { title, image, status }) {
    return db.execute(
      "UPDATE lists SET title = ?, image = ?, status = ? WHERE id = ?",
      [title, image, status, id]
    );
  }

  // Récupérer les éléments d'une liste par statut pour un utilisateur spécifique
  static findByUserIdAndStatus(userId, status) {
    return db.execute("SELECT * FROM lists WHERE user_id = ? AND status = ?", [
      userId,
      status,
    ]);
  }
}

module.exports = List;
