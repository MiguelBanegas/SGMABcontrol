import { io } from "socket.io-client";
import { getServerUrl } from "./utils/config";

const socketStatus = {
  connected: false,
};

const socket = io(getServerUrl(), {
  autoConnect: true,
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to socket server");
  socketStatus.connected = true;
});

socket.on("disconnect", () => {
  console.log("Disconnected from socket server");
  socketStatus.connected = false;
});

export default socket;
