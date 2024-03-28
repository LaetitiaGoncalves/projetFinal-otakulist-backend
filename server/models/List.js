const db = require("../config/database");

class List {
  // Insérer un élément dans la liste
  static create({ title, image, userId, animeId, status }) {
    return db.execute(
      "INSERT INTO lists (title, image, user_id, anime_id, status) VALUES (?, ?, ?, ?, ?)",
      [title, image, userId, animeId, status]
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

  // Trouver un élément par userId et animeId
  static findByUserIdAndAnimeId(userId, animeId) {
    return db.execute(
      "SELECT * FROM lists WHERE user_id = ? AND anime_id = ?",
      [userId, animeId]
    );
  }

  // Mettre à jour un élément de la liste par userId et animeId
  static updateByAnimeId(userId, animeId, { title, image, status }) {
    return db.execute(
      "UPDATE lists SET title = ?, image = ?, status = ? WHERE user_id = ? AND anime_id = ?",
      [title, image, status, userId, animeId]
    );
  }

  // Récupérer les éléments de la liste d'un utilisateur
  static findAllByUserId(userId) {
    return db.execute("SELECT * FROM lists WHERE user_id = ?", [userId]);
  }

  // Récupérer la liste d'un user avec jointure
  static findAllByUserIdWithJoin(userId) {
    return db.execute(
      `SELECT lists.id, lists.title, lists.image, lists.anime_id, lists.status
    FROM lists
    JOIN users ON lists.user_id = users.id
    WHERE users.id = ?`,
      [userId]
    );
  }
}

module.exports = List;
