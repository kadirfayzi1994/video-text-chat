const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const roomSchema = new Schema({
  roomName1: { type: String, default: "", required: true },
  roomName2: { type: String, default: "", required: true },
  members: []
});

mongoose.model("Room", roomSchema);
