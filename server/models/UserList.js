const mongoose = require("mongoose");

const Favorite = mongoose.model("Favorite", {
  id: String,
  name: String,
  image: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Favorite;
