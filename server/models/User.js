const mongoose = require("mongoose");

//création du model User
const User = mongoose.model("User", {
  email: String,
  username: String,
  avatar: Object,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
