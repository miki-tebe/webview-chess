import { Chess } from "chess.js";
import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import io from "socket.io-client";

export default function Home() {
  const chessboardRef = useRef();
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('start');

  // connected flag
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // connect to socket server
    const socket = io.connect(process.env.BASE_URL, { path: "/api/socketio" });

    // log socket connection
    socket.on("connect", () => {
      console.log("SOCKET CONNECTED!", socket.id);
      setConnected(true);
    });

    // update chat on new message dispatched
    socket.on("message", (message) => {
      if (message.fen !== fen) {
        setFen(message);
      }
      console.log("SOCKET MESSAGE", message);
    });

    // socket disconnect onUnmount if exists
    if (socket) return () => socket.disconnect();
  }, [fen]);

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
    setGame(gameCopy);

    // dispatch message to other users
    const message = gameCopy.fen();
    // setFen(game.fen());

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

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
