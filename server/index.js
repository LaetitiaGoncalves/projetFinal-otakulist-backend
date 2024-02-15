const express = require("express");
const cors = require("cors");
const axios = require("axios");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const apicache = require("apicache");
require("dotenv").config();

const NodeCache = require("node-cache");
const myCache = new NodeCache();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 3001;

const db = require("./config/database");
const List = require("./models/List");

// Middleware de caching
const customCacheMiddleware = async (req, res, next) => {
  const key = req.originalUrl || req.url;
  const cachedResponse = myCache.get(key);

  if (cachedResponse) {
    console.log("Serving from cache");
    return res.status(200).json(cachedResponse);
  } else {
    res.sendResponse = res.json;
    res.json = (body) => {
      myCache.set(key, body, 24 * 60 * 60);
      res.sendResponse(body);
    };
    next();
  }
};

// Configuration de Cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUD,
  api_secret: process.env.API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Models

const User = require("./models/User");

// Création d'un user

app.post("/signup", fileUpload(), async (req, res) => {
  try {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const userExists = await User.findByEmail(req.body.email);
    if (userExists) {
      return res
        .status(409)
        .json({ message: "This email already has an account" });
    }

    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(32);

    const avatarUpload = req.files?.avatar
      ? await cloudinary.uploader.upload(convertToBase64(req.files.avatar), {
          folder: `api/otakulist/users`,
          public_id: "avatar_" + new Date().getTime(),
        })
      : null;

    const newUser = await User.create({
      email: req.body.email,
      username: req.body.username,
      avatarUrl: avatarUpload ? avatarUpload.url : null,
      avatarPublicId: avatarUpload ? avatarUpload.public_id : null,
      hash,
      salt,
      token,
    });

    res.json({
      _id: newUser.id,
      email: req.body.email,
      username: req.body.username,
      avatar: avatarUpload ? avatarUpload.url : null,
      token: token,
    });
  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login d'un User
app.post("/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const user = await User.findByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hash = SHA256(req.body.password + user.salt).toString(encBase64);
    if (hash !== user.hash) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      _id: user.id,
      token: user.token,
      username: user.username,
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route pour obtenir la liste d'animes de la saison actuelle
app.get("/seasonal", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/seasons/now";
    const response = await axios.get(url, {
      params: {
        page: 1,
        limit: 10,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des animés saisonniers",
    });
  }
});

// Route pour obtenir la liste d'animes de la saison prochaine
app.get("/seasonal/upcoming", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/seasons/upcoming";
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des animés saisonniers",
    });
  }
});

// Route pour obtenir le classement des 100 meilleurs animes

app.get("/topanime", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/top/anime";
    const response = await axios.get(url, {
      params: {
        page: 1,
        limit: 10,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error("Rate limit reached. Please try again later.");
      res
        .status(429)
        .json({ error: "Rate limit reached. Please try again later." });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Route pour obtenir le classement des animés les plus populaires du moment

app.get("/airing", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/top/anime";
    const response = await axios.get(url, {
      params: {
        filter: "airing",
        page: 1,
        limit: 10,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération du classement des meilleurs animés",
    });
  }
});

// Route pour obtenir le classement des animés les plus populaires

app.get("/popularity", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/top/anime?popularity";
    const response = await axios.get(url);
    console.log("Réponse de l'API Jikan : ", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Erreur Axios : ", error.response || error);
    res.status(500).json({
      error:
        "Erreur de récupération du classement des animés les plus populaires",
    });
  }
});

// Route pour obtenir le classement des animés les plus attendus

app.get("/upcoming", customCacheMiddleware, async (req, res) => {
  try {
    const url = "https://api.jikan.moe/v4/top/anime";
    const response = await axios.get(url, {
      params: {
        filter: "upcoming",
        page: 1,
        limit: 10,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération du classement des meilleurs animés",
    });
  }
});

//Route pour obtenir les informations sur un anime

app.get("/anime/:id", customCacheMiddleware, async (req, res) => {
  try {
    const url = `https://api.jikan.moe/v4/anime/${req.params.id}/full`;
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération de l'anime",
    });
  }
});

//Route pour obtenir les images d'un anime
app.get("/anime/pictures/:id", customCacheMiddleware, async (req, res) => {
  try {
    const url = `https://api.jikan.moe/v4/anime/${req.params.id}/pictures`;
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des images",
    });
  }
});

//Route pour obtenir les recommandations pour un anime
app.get(
  "/anime/recommandations/:id",
  customCacheMiddleware,
  async (req, res) => {
    try {
      const url = `https://api.jikan.moe/v4/anime/${req.params.id}/recommendations`;
      const response = await axios.get(url);
      res.status(200).json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Erreur de récupération des recommandations",
      });
    }
  }
);

//Route pour obtenir les personnages d'un anime avec les seiyuu
app.get("/anime/:id/characters", async (req, res) => {
  try {
    const url = `https://api.jikan.moe/v4/anime/${req.params.id}/characters`;
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des images",
    });
  }
});

//Route pour obtenir les news d'un anime

app.get("/anime/:id/news", async (req, res) => {
  try {
    const url = `https://api.jikan.moe/v4/anime/${req.params.id}/news`;
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des news",
    });
  }
});

//Route pour obtenir les genres d'anime

app.get("/genres/anime", async (req, res) => {
  try {
    const url = `https://api.jikan.moe/v4/genres/anime`;
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération des news",
    });
  }
});

//Route pour rechercher un anime

app.get("/searchanime", customCacheMiddleware, async (req, res) => {
  try {
    const search = req.query.search;
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime?q=${search}`
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur de récupération de la recherche",
    });
  }
});

//ajouter un animé à sa liste

app.post("/liste", async (req, res) => {
  const { userId, title, image, status } = req.body;

  if (!userId || !title || !status) {
    return res.status(400).send("Missing data");
  }

  try {
    await List.create({ title, image, userId, status });

    res.status(200).send({
      message: "Anime added to favorites successfully",
    });
  } catch (error) {
    console.error("Failed to insert into LISTS:", error);
    res.status(500).send("Failed to add to favorites");
  }
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "route not found !" });
});
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
