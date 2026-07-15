import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server as ServerSocket } from "socket.io";
import {  getTicketData, startDCN } from "./dcnNotifier";
import { GetUsuariosTI } from "./user";
import { inicializarPool, cerrarPool } from "./config/db";
import { Polling } from "./polling";

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new ServerSocket(server);

// Inicializar pool antes de cualquier conexión
let stopPolling;
(async () => {
  try {
    await inicializarPool();

    // Iniciar la suscripción DCN una vez que el pool esté listo
    // await startDCN(sendUpdateToClients);

    stopPolling = await Polling(sendUpdateToClients, 5000);

    server.listen(process.env.PORT, () => {
      console.log(
        "🚀 Backend escuchando en http://localhost:" + process.env.PORT
      );
    });
  } catch (err) {
    console.error("❌ Error al iniciar el backend:", err);
    process.exit(1);
  }
})();

io.on("connection", async (socket) => {
  console.log("Cliente conectado vía Socket.IO");

  const data = await getTicketData();
  socket.emit("db_update", data);

  const usuarios = await GetUsuariosTI();
  socket.emit("db_user", usuarios);


  socket.on("update_user", async () => {
    const usuarios = await GetUsuariosTI();
    socket.emit("db_user", usuarios);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});



function sendUpdateToClients(data) {
  io.emit("db_update", data);
}

// Maneja cierre limpio del servidor

process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor...");

  try {
    
    await cerrarPool();
    io.close(() => {
      console.log("Conexiones de socket cerradas.");

      // Cerrar servidor HTTP
      server.close(() => {
        console.log("Servidor HTTP cerrado.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Error al cerrar el servidor:", error);
    process.exit(1);
  }
});
