const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors')
const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    credentials: true,
}))

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (you can replace '*' with your specific origin)  }
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    credentials: true,
}})


let pdfData = null; // Store the base64 data of the uploaded PDF
let currentPage = 0; // Track the current page
let adminSocket = null; // Track the admin's socket

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    if (!pdfData){
      adminSocket = socket.id
      io.to(socket.id).emit('admin', {admin: socket.id})
    }

    // If admin uploads a PDF, store data and emit it to all users
    socket.on('upload-pdf', (data) => {
        pdfData = data.base64;
        currentPage = 0;
        io.emit('load-pdf', { base64: pdfData, page: currentPage });
    });

    // Listen for page changes from the admin
    socket.on('change-page', (page) => {
        currentPage = page;
        io.emit('update-page', page);
    });

    // Send the current PDF data and page to newly connected users
    if (pdfData) {
        socket.emit('load-pdf', { base64: pdfData, page: currentPage });
    }

    socket.on('disconnect', () => {
        if (socket.id === adminSocket) adminSocket = null;
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
