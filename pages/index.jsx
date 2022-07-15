import { Chess } from "chess.js";
import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import io from "socket.io-client";

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.browser) return ""; // Browser should use current path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default function Home() {
  const chessboardRef = useRef();
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");

  // connected flag
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // connect to socket server
    const socket = io.connect(getBaseUrl(), {
      path: "/api/socketio",
    });
    
    // log socket connection
    socket.on("connect", () => {
      console.log("SOCKET CONNECTED!", socket.id);
      setConnected(true);
    });

    // log socket disconnection
    socket.on("disconnect", () => {
      console.log("SOCKET DISCONNECTED!");
      setConnected(false);
    });

    // update chat on new message dispatched
    socket.on("message", (message) => {
      setFen(message);
      console.log("SOCKET MESSAGE", message);
    });

    // socket disconnect onUnmount if exists
    if (socket) return () => socket.disconnect();
  }, []);

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  async function onDrop(sourceSquare, targetSquare) {
    const gameCopy = { ...game };
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    });

    // dispatch message to other users
    const message = gameCopy.fen();

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    setGame(gameCopy);
    return move;
  }

  return (
    <div>
      <Chessboard
        id="PlayVsPlay"
        animationDuration={200}
        position={fen}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
        }}
        ref={chessboardRef}
      />
      <button
        className="rc-button"
        onClick={() => {
          safeGameMutate((game) => {
            game.reset();
          });
          chessboardRef.current.clearPremoves();
        }}
      >
        reset
      </button>
      <button
        className="rc-button"
        onClick={() => {
          safeGameMutate((game) => {
            game.undo();
          });
          chessboardRef.current.clearPremoves();
        }}
      >
        undo
      </button>
    </div>
  );
}
