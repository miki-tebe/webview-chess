export default function handler(req, res) {
  if (req.method === "POST") {
    const { body } = req;
    res.socket.server.io.emit("message", body);
    res.status(200).json("Hello World!");
  }
}
