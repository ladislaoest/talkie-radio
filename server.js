/**
 * TALKIE — Signaling Server
 * WebSocket + WebRTC signaling para producción
 * 
 * Deploy: Railway, Render, Fly.io
 * Run: node server.js
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

// DESACTIVAR CACHE PARA DESARROLLO
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(express.static(path.join(__dirname)));

// State
const rooms = {}; // roomId -> { users: { socketId -> { name, channel } } }

function getRoom(roomId) {
  if (!rooms[roomId]) rooms[roomId] = { users: {} };
  return rooms[roomId];
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  console.log(`[+] Connected: ${socket.id}`);

  // JOIN EVENT ROOM
  socket.on('join', ({ name, event, channel }) => {
    currentRoom = event;
    currentUser = { name, channel, id: socket.id };

    socket.join(event);
    const room = getRoom(event);
    room.users[socket.id] = currentUser;

    // Send current users to new joiner
    socket.emit('room_users', Object.values(room.users));

    // Notify others
    socket.to(event).emit('user_joined', currentUser);

    // WebRTC: send existing peer IDs so new user can initiate
    const peerIds = Object.keys(room.users).filter(id => id !== socket.id);
    socket.emit('existing_peers', peerIds);

    console.log(`[JOIN] ${name} → ${event}/${channel}`);
  });

  // CLIENT LOGGING BRIDGE
  socket.on('client_log', ({ type, message }) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[BROWSER][${timestamp}][${type}] ${message}`);
  });

  // CHANNEL CHANGE
  socket.on('change_channel', ({ channel }) => {
    if (currentUser) {
      currentUser.channel = channel;
      getRoom(currentRoom).users[socket.id].channel = channel;
      io.to(currentRoom).emit('user_channel_changed', { id: socket.id, channel });
    }
  });

  // PTT EVENTS
  socket.on('ptt_start', ({ channel }) => {
    socket.to(currentRoom).emit('ptt_start', { id: socket.id, name: currentUser?.name, channel });
  });

  socket.on('ptt_stop', ({ channel }) => {
    socket.to(currentRoom).emit('ptt_stop', { id: socket.id, name: currentUser?.name, channel });
  });

  // WEBRTC SIGNALING
  socket.on('offer', ({ targetId, sdp }) => {
    io.to(targetId).emit('offer', { fromId: socket.id, sdp });
  });

  socket.on('answer', ({ targetId, sdp }) => {
    io.to(targetId).emit('answer', { fromId: socket.id, sdp });
  });

  socket.on('ice_candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice_candidate', { fromId: socket.id, candidate });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].users[socket.id];
      io.to(currentRoom).emit('user_left', { id: socket.id });
      if (Object.keys(rooms[currentRoom].users).length === 0) {
        delete rooms[currentRoom];
      }
    }
    console.log(`[-] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TALKIE Server running on port ${PORT}`);
  console.log(`Open: http://localhost:${PORT}`);
});
