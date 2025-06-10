import express from "express";

import http from "http";
import { Server as ServerSocket } from "socket.io";
import { cerrarDCN, getTicketData, startDCN } from "./dcnNotifier";
import { Polling } from "./polling";
import { GetUsuariosTI } from "./user";
import { inicializarPool } from "./config/db";

const app = express();

const server = http.createServer(app);

const io = new ServerSocket(server);

io.on("connection", async (socket) => {
  console.log("🟢 Cliente conectado vía Socket.IO");

  const data = await getTicketData();
  socket.emit("db_update", data);

  const usuarios = await GetUsuariosTI();
  socket.emit("db_user", usuarios);

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

function sendUpdateToClients(data) {
  io.emit("db_update", data);
}

startDCN(sendUpdateToClients).catch(console.error);

let stopPolling;

async function iniciarServidor() {
  stopPolling = await Polling(sendUpdateToClients, 5000);

  server.listen(5005, () => {
    console.log("🚀 Backend escuchando en http://localhost:5005");
  });
}

//iniciarServidor();

// Maneja cierre limpio del servidor
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor...");
  if (stopPolling) await stopPolling();
  await cerrarDCN();
  server.close(() => {
    console.log("Servidor detenido");
    process.exit(0);
  });
});

server.listen(5005, () => {
  console.log("🚀 Backend escuchando en http://localhost:5005");
});
