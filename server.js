const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5150;

// Middleware ka use request process karne ke liye hota hai

// express.json() -> Ye middleware request body ko JSON format me convert karta hai
app.use(express.json());

// cors() -> Ye middleware Cross-Origin Requests allow karta hai (alag-alag domains se requests aane dega)
app.use(cors());

const dataDir = path.join(__dirname, "data");
const productsFile = path.join(dataDir, "products.json");
const reviewsFile = path.join(dataDir, "reviews.json");

//  Ensure kar raha hai ki "data" folder exist kare, nahi to bana de
const ensureDataFolder = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};
ensureDataFolder();

// File se data read karne ka function
const getData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
};

// File me data save karne ka function
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error.message);
  }
};

// API Routes (Ye endpoints frontend ya kisi aur client ko data dene ya lene me madad karte hain)
// Home Route - Simple response deta hai ki API chal rahi hai
app.get("/", (req, res) => res.send("User Ratings and Reviews API is Running!"));

// Products list laane ke liye API
app.get("/products", (req, res) => res.json(getData(productsFile)));

// Ek specific product ki details aur uske reviews laane ke liye API
app.get("/products/:id", (req, res) => {
  const products = getData(productsFile);
  const reviews = getData(reviewsFile);
  const productId = parseInt(req.params.id);

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const productReviews = reviews.filter((r) => r.productId === productId);
  res.json({ ...product, reviews: productReviews });
});

// Naya product add karne ke liye API
app.post("/products", (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) return res.status(400).json({ error: "Name and category required" });

  const products = getData(productsFile);
  const newProduct = { id: products.length + 1, name, category, averageRating: 0 };

  products.push(newProduct);
  saveData(productsFile, products);

  res.status(201).json(newProduct);
});

//  Kisi product ka review add karne ke liye API
app.post("/reviews", (req, res) => {
  const { productId, review, rating } = req.body;
  if (!productId || !review || rating < 1 || rating > 5) return res.status(400).json({ error: "Invalid data" });

  const products = getData(productsFile);
  const reviews = getData(reviewsFile);
  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex === -1) return res.status(404).json({ error: "Product not found" });

  const newReview = { id: reviews.length + 1, productId, review, rating };
  reviews.push(newReview);
  saveData(reviewsFile, reviews);

  //  Average rating update kar raha hai
  const productReviews = reviews.filter((r) => r.productId === productId);
  products[productIndex].averageRating = (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(2);
  saveData(productsFile, products);

  res.status(201).json(newReview);
});

// Server ko start karne ka code
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
