require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");
const app = express();

const path = require("path");
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

// Initialize scheduled tasks
const startScheduledTasks = require('./utils/scheduledTasks');

app.use(express.urlencoded({ extended: true }));

// Middleware to get user ID from query parameter (for testing)
io.use((socket, next) => {
    // Get user details from client connection
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role; // 'admin' or 'collaborateur'
    
    if (!userId || !role) return next(new Error("Authentification requise"));
    
    socket.userId = userId;
    socket.role = role;
    next();
  });

  let onlineUsers = new Set(); // Suivre les IDs des utilisateurs au lieu des IDs de socket


  // Côté serveur (Socket.IO) avec suivi du statut en ligne
let userConnections = new Map(); // Suit { userId: nombreDeConnexions }

io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`${socket.role} ${userId} connecté`);

    // Mettre à jour le nombre de connexions
    const connections = userConnections.get(userId) || 0;
    userConnections.set(userId, connections + 1);
    
    // Notifier UNIQUEMENT si c'était la première connexion
    io.emit('online-users', Array.from(onlineUsers)); // Diffuser à tous les clients

    if (connections === 0) {
        io.emit('online-users', Array.from(userConnections.keys()));
    }

    // Rejoindre la salle spécifique à l'utilisateur
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    console.log(`Utilisateur a rejoint la salle: ${userRoom}`);

    if (socket.role === 'admin') {
        socket.join('admins');
        console.log(`Admin a rejoint la salle admins`);
    }

    if (socket.role === 'rh') {
        socket.join('rhs');
        console.log(`rh a rejoint la salle rhs`);
    }

    // Gestion des messages
    socket.on('chat-message', (data) => {
        console.log('Message reçu:', {
            de: userId,
            à: data.recipientId,
            contenu: data.message
        });

        const recipientRoom = `user_${data.recipientId}`;
        socket.to(recipientRoom).emit('chat-message', {
            senderId: userId,
            message: data.message,
            timestamp: new Date().toISOString()
        });
    });

    // Gestion des utilisateurs en ligne
    socket.on('request-online-users', () => {
        socket.emit('online-users', Array.from(userConnections.keys()));
    });

    // Gestion des notifications
    socket.on('notif', async (data) => {
        try {
            console.log(`\n--- NOUVELLE NOTIFICATION ---`);
            console.log(`Expéditeur: ${socket.role} ${userId}`);
            console.log(`Contenu:`, JSON.stringify(data, null, 2));

            if (socket.role === 'rh') {
                if (!data.targetUserId) {
                    throw new Error('ID utilisateur cible requis pour les notifications admin');
                }

                const targetRoom = `user_${data.targetUserId}`;
                console.log(`Tentative de notification de la salle: ${targetRoom}`);

                // Vérifier l'existence de la salle cible
                const socketsInRoom = await io.in(targetRoom).allSockets();
                console.log(`Connexions actives dans ${targetRoom}:`, socketsInRoom.size);

                if (socketsInRoom.size === 0) {
                    console.warn(`L'utilisateur cible ${data.targetUserId} n'est pas connecté!`);
                    return;
                }

                io.to(targetRoom).emit('notif', {
                    type: 'request_update',
                    message: data.message,
                    senderId: userId,
                    timestamp: new Date().toISOString()
                });

                console.log(`Notification envoyée à ${targetRoom}`);

            } else if (socket.role === 'collaborateur') {
                console.log('Notification de tous les rhs');
                io.to('rhs').emit('notif', {
                    type: 'new_request',
                    message: data.message,
                    senderId: userId,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("[ERREUR DE NOTIFICATION]", error.message);
            socket.emit('error', { message: error.message });
        }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`${socket.role} ${userId} déconnecté`);
        
        // Mettre à jour le nombre de connexions
        const connections = userConnections.get(userId) || 1;
        if (connections === 1) {
            userConnections.delete(userId);
        } else {
            userConnections.set(userId, connections - 1);
        }
        
        io.emit('online-users', Array.from(userConnections.keys()));
        socket.leave(userRoom);
        if (socket.role === 'admin') socket.leave('admins');
    });
});
  
app.get('/api/online-users', (req, res) => {
    try {
        res.json({ success: true, onlineUsers: onlineUsers.size });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs en ligne' });
    }
});


connectDB();
app.use(cors("*"));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/message", require("./routes/messagesRoutes"));
app.use("/api/notification", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

connectDB().then(() => {
    startScheduledTasks();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));