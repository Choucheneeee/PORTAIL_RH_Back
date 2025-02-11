require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");
const app = express();


app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: ["http://localhost:4200"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json("Connected !");
  });
  

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));