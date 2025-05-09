const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static(path.join(__dirname, 'public')));

let messageHistory = []; // Histórico de mensagens
const adminPassword = '12345'; // Senha para o administrador

io.on('connection', (socket) => {
  console.log('Um usuário conectou');

  // Definir o nome do usuário como "Anônimo" por padrão
  socket.username = 'Anônimo';
  socket.isAdmin = false;

  // Receber o nome do usuário e verificar a senha
  socket.on('set username', ({ username, password }) => {
    if (username === 'm1000' && password === adminPassword) {
      socket.username = 'm1000'; // Identificar como administrador
      socket.isAdmin = true; // Permissão de administrador
    } else {
      socket.username = 'Anônimo';
      socket.isAdmin = false;
    }
    console.log(`${socket.username} entrou no chat.`);
    socket.emit('is admin', socket.isAdmin); // Informar ao cliente se é admin
    socket.emit('chat history', messageHistory); // Enviar histórico de mensagens
  });

  // Receber mensagens do cliente
  socket.on('chat message', (msg) => {
    if (msg && msg.text) {
      const message = { id: Date.now(), name: socket.username, text: msg.text, timestamp: new Date() };
      messageHistory.push(message); // Adicionar ao histórico
      io.emit('chat message', message); // Enviar mensagem para todos os usuários
    }
  });

  // Permitir que o administrador apague mensagens
  socket.on('delete message', (messageId) => {
    if (socket.isAdmin) {
      messageHistory = messageHistory.filter((msg) => msg.id !== parseInt(messageId)); // Remover mensagem
      io.emit('delete message', messageId); // Notificar clientes sobre a exclusão
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.username} desconectou.`);
  });
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});