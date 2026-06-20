const bcrypt = require("bcrypt");
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const Favorite = require("./models/Favorite");

const favorites = require("./data/favorites");

const app = express();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });
const PORT = process.env.PORT || 5000;mongoose.connection.on("connected", () => {
  console.log("🔥 Database Connected Successfully");
});

mongoose.connection.on("error", (err) => {
  console.log("❌ Database Error:", err);
});


// Middleware
app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.json({
    message: "Arcadia Backend API Running 🚀"
  });
});

/* =========================
   GET FAVORITES
========================= */
app.get("/favorites/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    const favorites = await Favorite.find({ userId });

    res.status(200).json(favorites);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});

/* =========================
   ADD FAVORITE
========================= */
// app.post("/favorites", (req, res) => {

//   const { title, category } = req.body;

//   // Validation
//   if (!title || !category) {
//     return res.status(400).json({
//       error: "Title and category are required"
//     });
//   }
//   const existingFavorite = favorites.find(
//     fav => fav.title === title
//   );

//   if (existingFavorite) {
//     return res.status(409).json({
//       error: "Already in favorites"
//     });
//   }
//   const newFavorite = {
//     id: req.body.id,
//     title,
//     category
//   };

//   favorites.push(newFavorite);

//   res.status(201).json({
//     message: "Favorite added successfully",
//     data: newFavorite
//   });
// });


app.post("/favorites", async (req, res) => {

  console.log("BODY:", req.body);
  try {

    const { userId, itemId, title, category } = req.body;

    if (!userId || !itemId || !title || !category) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }
    const existingFavorite =
      await Favorite.findOne({
        userId,
        itemId
      });

    if (existingFavorite) {
      return res.status(409).json({
        message: "Already in favorites"
      });
    }

    const favorite = await Favorite.create({
      userId,
      itemId,
      title,
      category
    });

    res.status(201).json({
      message: "Favorite added",
      favorite
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});


// app.delete("/favorites/:id", (req, res) => {

//   const { id } = req.params;

//   const index = favorites.findIndex(fav => fav.id === id);

//   if (index === -1) {
//     return res.status(404).json({
//       error: "Favorite not found"
//     });
//   }

//   const removedFavorite = favorites.splice(index, 1);

//   res.status(200).json({
//     message: "Favorite removed",
//     data: removedFavorite[0]
//   });

// });

app.delete("/favorites/:favoriteId", async (req, res) => {

  try {

    await Favorite.findByIdAndDelete(
      req.params.favoriteId
    );

    res.status(200).json({
      message: "Favorite deleted"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});


app.post("/signup", async (req, res) => {

  try {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});
app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});