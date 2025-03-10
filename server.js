require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");
const app = express();
const socketIo = require('socket.io');
const reportRoutes = require("./routes/documentRoutes");
const User = require("./models/User.model")


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



const onlineUsers = new Map(); // To store socketId with userId and role

io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Listen for authentication
    socket.on('authenticate', async (userId) => {
        // Fetch user from the database using _id
        const user = await User.findById(userId);
        if (user) {
            // Store user info along with the socketId
            onlineUsers.set(socket.id, { userId: user._id, role: user.role });
            console.log(`User ${user._id} with role ${user.role} connected`);
        }

        // Emit the number of online users
        io.emit('onlineUsers', onlineUsers.size);
    });

    // Handle notification sending to admins
    socket.on('newNotification', (notification) => {
        console.log('Notification:', notification);
        const { userId, message } = notification;

        // Emit notification to all connected admins
        onlineUsers.forEach((userInfo, socketId) => {
            if (userInfo.role === 'admin') {
                io.to(socketId).emit('newNotification', message); // Emit the notification to the admin
                console.log(`Notification sent to admin ${userInfo.userId} on socket ${socketId}`);
            }
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo) {
            onlineUsers.delete(socket.id); // Remove user from the map
            console.log(`User ${userInfo.userId} disconnected`);
        }

        // Emit the number of online users
        io.emit('onlineUsers', onlineUsers.size);
    });
});





// API Route to Get Online Users
app.get('/api/online-users', (req, res) => {
    try {
        res.json({ success: true, onlineUsers: onlineUsers.size });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching online users' });
    }
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
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));