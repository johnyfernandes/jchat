const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { path: '/api/socket.io' });

app.use(express.static('public'));

const messages = [];
const connectedUsers = [];

io.on('connection', (socket) => {
  console.log('Novo Utilizador Conectado');
  let username;

  // Listen for the "user ready" event from the client
  socket.on('user ready', (name) => {
    username = name;
    connectedUsers.push(username);
    io.emit('update user list', connectedUsers);

    // Send stored messages to the new user
    messages.forEach((msg) => {
      socket.emit('chat message', msg);
    });

    // Broadcast the user connected message
    const userConnectedMsg = { username, message: 'conectou-se' };
    io.emit('chat message', userConnectedMsg);
  });

  socket.on('disconnect', () => {
    console.log('Um Utilizador Desconectou-se');
    const index = connectedUsers.indexOf(username);
    if (index > -1) {
      connectedUsers.splice(index, 1);
    }
    io.emit('update user list', connectedUsers);

    // Emit user disconnected message
    const userDisconnectedMsg = { username, message: 'desconectou-se' };
    io.emit('chat message', userDisconnectedMsg);
  });

  socket.on('chat message', ({ username, message }) => {
    const msg = { username, message };
    messages.push(msg); // Save the message in the array
    io.emit('chat message', msg);
  });

  socket.on('clear chat', () => {
    messages.length = 0; // Clear the messages array
    io.emit('clear chat'); // Broadcast the clear chat event to all clients
  });
});

module.exports = app;