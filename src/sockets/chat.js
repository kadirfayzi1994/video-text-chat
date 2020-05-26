const socketio = require("socket.io");
const mongoose = require("mongoose");
const events = require("events");
const _ = require("lodash");
const eventEmitter = new events.EventEmitter();

require("../schemas/userSchema.js");
require("../schemas/chatSchema.js");
require("../schemas/roomSchema.js");


const userModel = mongoose.model("User");
const chatModel = mongoose.model("Chat");
const roomModel = mongoose.model("Room");

module.exports.sockets = function (http) {
  io = socketio.listen(http);

  const ioChat = io.of("/chat");
  const users = {};
  let oldChats, sendUsers, setRoom;
  const userSocket = {};

  ioChat.on("connection", function (socket) {
    socket.on("set-user-data", function (username) {
      socket.username = username;
      userSocket[socket.username] = socket.id;

      eventEmitter.emit("get-all-users");

      sendUsers = function () {
        for (i in userSocket) {
          for (j in users) {
            if (j == i) {
              users[j] = "Online";
            }
          }
        }
        ioChat.emit("onlineUsers", users);
      };
    });

    socket.on("set-room", function (room) {
      socket.leave(socket.room);
      eventEmitter.emit("get-room-data", room);
      setRoom = function (roomId) {
        socket.room = roomId;
        socket.join(socket.room);
        ioChat.to(userSocket[socket.username]).emit("set-room", socket.room);
      };
    });

    socket.on("old-chats-init", function (data) {
      eventEmitter.emit("read-chat", data);
    });

    socket.on("old-chats", function (data) {
      eventEmitter.emit("read-chat", data);
    });

    oldChats = function (result, username, room) {
      ioChat.to(userSocket[username]).emit("old-chats", {
        result: result,
        room: room
      });
    };

    socket.on("chat-msg", function (data) {
      eventEmitter.emit("save-chat", {
        msgFrom: socket.username,
        msgTo: data.msgTo,
        msg: data.msg,
        room: socket.room,
        date: data.date
      });

      ioChat.to(socket.room).emit("chat-msg", {
        msgFrom: socket.username,
        msg: data.msg,
        date: data.date
      });
    });

    socket.on("disconnect", function () {
      _.unset(userSocket, socket.username);
      users[socket.username] = "Offline";
      ioChat.emit("onlineUsers", users);
    });
  });

  eventEmitter.on("save-chat", function (data) {
    var newChat = new chatModel({
      msgFrom: data.msgFrom,
      msgTo: data.msgTo,
      msg: data.msg,
      room: data.room,
      createdOn: data.date
    });
    newChat.save();
  });

  eventEmitter.on("read-chat", function (data) {
    chatModel
      .find({})
      .where("room")
      .equals(data.room)
      .sort("-createdOn")
      .exec(function (err, result) {
        oldChats(result, data.username, data.room);
      });
  });

  eventEmitter.on("get-all-users", function () {
    userModel
      .find({})
      .select("username")
      .exec(function (err, result) {
        for (var i = 0; i < result.length; i++) {
          users[result[i].username] = "Offline";
        }
        sendUsers();
      });
  });

  eventEmitter.on("get-room-data", function (room) {
    roomModel.find(
      {
        $or: [
          { roomName1: room.roomName1 },
          { roomName1: room.roomName2 },
          { roomName2: room.roomName1 },
          { roomName2: room.roomName2 }
        ]
      },
      function (err, result) {
        if (result == "" || result == undefined || result == null) {
          newRoom = new roomModel({
            roomName1: room.roomName1,
            roomName2: room.roomName2
          });
          newRoom.save(function (err, newResult) {
            setRoom(newResult._id);
          });
        } else {
          var jresult = JSON.parse(JSON.stringify(result));
          setRoom(jresult[0]._id);
        }
      }
    );
  });

  return io;
};
