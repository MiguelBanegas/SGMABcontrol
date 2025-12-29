import { io } from "socket.io-client";

// En producción usamos la URL actual, en desarrollo localhost:5051
const socket = io(import.meta.env.PROD ? "/" : "http://localhost:5051");

export default socket;
