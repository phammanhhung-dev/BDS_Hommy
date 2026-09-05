const db = require("../config/db");

class ViModel {
  static async getAll() {
    const [rows] = await db.execute("SELECT * FROM vi");
    return rows;
  }

  static async getByNguoiDungId(nguoiDungId) {
    const [rows] = await db.execute("SELECT * FROM vi WHERE NguoiDungID = ?", [
      nguoiDungId,
    ]);
    return rows[0] || null;
  }
}

module.exports = ViModel;
