// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (_req, res) => {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    // adapt Next's net Server to http Server
    const httpServer = res.socket.server;
    const io = new Server(httpServer, {
      path: "/api/socketio",
    });
    // append SocketIO server to Next.js socket server response
    res.socket.server.io = io;
  }
  res.end();
};
