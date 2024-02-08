const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    username: { type: String, required: true },
    avatar: {
      url: String,
      public_id: String,
    },
    token: String,
    hash: String,
    salt: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
