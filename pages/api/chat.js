export default function handler(req, res) {
  if (req.method === "POST") {
    const { body } = req;
    console.log("body:", body);
    res.socket.server.io.emit(
      "message",
      `Hello from Next.js! ${body.to} ${body.from}`
    );
    res.status(200).json("Hello World!");
  }
}
