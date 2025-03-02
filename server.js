require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");
const app = express();
const socketIo = require('socket.io');


const http = require('http');
const notificationRoutes = require('./routes/notificationRoutes');

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:4200', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});


app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB
connectDB();

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
// Middlewares
// In server.js

// Add this after initializing socket.io
app.use((req, res, next) => {
  req.io = io;  // Attach the io object to the request
  next();  
});

app.use(cors()); 

app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json("Connected !");
  });
  


app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use('/api', notificationRoutes);



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));