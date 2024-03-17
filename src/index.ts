import { Elysia } from "elysia";

const currentUsers = new Set();
const app = new Elysia()
app.get("/", async () => Bun.file("./index.html"))
app.get("/marco", () => "polo")
.ws('/ws', {
  message(ws, message) {
    console.log("Got message: ", message, " from ", ws.id);
    app.server!.publish("all", JSON.stringify({
      _type: "new_msg",
      _data: ws.id + ": " + message
    }))
  },
  open(ws) {
    console.log("opening id: ", ws.id);
    currentUsers.add(ws.id);
    ws.send({
      _type: "open_handshake",
      _data: ws.id
    });
    currentUsers.forEach(u => ws.send({
      _type: "new_user",
      _data: u
    }))
    ws.subscribe("all");
    ws.publish("all", {
      _type: "new_user",
      _data: ws.id
    });
    ws.publish("all", JSON.stringify({
      _type: "new_msg",
      _data: ws.id + " joined"
    }))
  },
  close(ws) {
    currentUsers.delete(ws.id);
    app.server!.publish("all", JSON.stringify({
      _type: "delete_user",
      _data: ws.id
    }));
    app.server!.publish("all", JSON.stringify({
      _type: "new_msg",
      _data: ws.id + " left"
    }));
    console.log("closing id: ", ws.id);
  }
})
app.listen(3006);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
