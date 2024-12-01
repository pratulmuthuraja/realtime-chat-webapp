import { Server } from 'socket.io';

export default {
  register({ strapi }) {
    console.log('Starting WebSocket server...');

    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: 'http://192.168.0.2:3000',
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["*"]
      },
      transports: ['websocket', 'polling']
    });

    // Log when the server is ready
    io.engine.on("connection_error", (err) => {
      console.log('Connection error:', err.message);
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('message', (message) => {
        console.log('Message received:', message);
        // Echo back
        socket.emit('message', {
          content: message.content,
          timestamp: new Date(),
          isFromUser: false
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    strapi.io = io;
  }
};