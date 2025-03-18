require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");
const app = express();
const reportRoutes = require("./routes/documentRoutes");

const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.use(express.urlencoded({ extended: true }));

// Middleware to get user ID from query parameter (for testing)
io.use((socket, next) => {
    // Get user details from client connection
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role; // 'admin' or 'collaborateur'
    
    if (!userId || !role) return next(new Error("Authentication required"));
    
    socket.userId = userId;
    socket.role = role;
    next();
  });

  let onlineUsers = new Set(); // Track unique connected users


  io.on('connection', (socket) => {
    console.log(`${socket.role} ${socket.userId} connected`);
    onlineUsers.add(socket.id);
    io.emit('onlineUsers', onlineUsers.size); // Send updated count

    // Join user-specific room with verification
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    console.log(`User joined room: ${userRoom}`);

    // Verify room membership
    io.in(userRoom).allSockets().then(sockets => {
        console.log(`Current connections in ${userRoom}:`, sockets.size);
    });

    // Join admin room if user is admin
    if (socket.role === 'admin') {
        socket.join('admins');
        console.log(`Admin joined admins room`);
    }
    socket.on('chat-message', (data) => {
        console.log('Received message:', {
          from: socket.userId,
          to: data.recipientId,
          content: data.message
        });
    
        // Broadcast to recipient
        const recipientRoom = `user_${data.recipientId}`;
        socket.to(recipientRoom).emit('chat-message', {
          senderId: socket.userId,
          message: data.message,
          timestamp: new Date().toISOString()
        });
      });
    
    socket.on('request-online-users', () => {
        socket.emit('online-users', onlineUsers.size);
      });   

    // Notification handler with enhanced debugging
    socket.on('notif', async (data) => {
        try {
            console.log(`\n--- NEW NOTIFICATION ---`);
            console.log(`Sender: ${socket.role} ${socket.userId}`);
            console.log(`Payload:`, JSON.stringify(data, null, 2));

            if (socket.role === 'admin') {
                if (!data.targetUserId) {
                    throw new Error('Target user ID required for admin notifications');
                }

                const targetRoom = `user_${data.targetUserId}`;
                console.log(`Attempting to notify room: ${targetRoom}`);

                // Verify target room existence
                const socketsInRoom = await io.in(targetRoom).allSockets();
                console.log(`Active connections in ${targetRoom}:`, socketsInRoom.size);

                if (socketsInRoom.size === 0) {
                    
                    console.warn(`Target user ${data.targetUserId} is not connected!`);
                    return;
                }

                io.to(targetRoom).emit('notif', {
                    type: 'request_update',
                    message: data.message,
                    senderId: socket.userId,
                    timestamp: new Date().toISOString()
                });

                console.log(`Notification sent to ${targetRoom}`);

            } else if (socket.role === 'collaborateur') {
                console.log('Notifying all admins');
                io.to('admins').emit('notif', {
                    type: 'new_request',
                    message: data.message,
                    senderId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("[NOTIFICATION ERROR]", error.message);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log(`${socket.role} ${socket.userId} disconnected`);
        socket.leave(`user_${socket.userId}`);
        onlineUsers.delete(socket.id); // Remove user from the set
        io.emit('onlineUsers', onlineUsers.size); // Update count

        if (socket.role === 'admin') socket.leave('admins');
    });
});
  
app.get('/api/online-users', (req, res) => {
    try {
        res.json({ success: true, onlineUsers: onlineUsers.size });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching online users' });
    }
});


connectDB();
app.use(cors("*"));
app.use(express.json());

// Routes
app.get("/", (req, res) => res.json("Connected!"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));