import { io } from "socket.io-client";

import { getServerUrl } from "./utils/config";

const socket = io(getServerUrl());

export default socket;
