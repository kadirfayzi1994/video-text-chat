
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const path = require("path");
const fs = require("fs");
const app = express();
const http = require("http").Server(app);


const port = process.env.PORT || 3000;

require("./src/sockets/chat.js").sockets(http);

const uri = 'mongodb+srv://kadir:qYuk4ihEEkK2iHyD@video-chat-app-gdjlj.mongodb.net/video-chat-app?retryWrites=true&w=majority'
mongoose.connect(process.env.DATABASE_URI || 'mongodb://127.0.0.1/video-chat-app',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
mongoose.connection.once("open", function () {
  console.log("Connected To Database");
});

app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

const sessionInit = session({
  name: "userCookie",
  secret: "chat-app-socket-io",
  resave: true,
  httpOnly: true,
  saveUninitialized: true,
  store: new mongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 3600000 }
});

app.use(sessionInit);

app.use(express.static(path.resolve(__dirname, "./public")));

app.set("views", path.resolve(__dirname, "./src/views"));
app.set("view engine", "ejs");

app.use(bodyParser.json(
  {
    limit: "10mb",
    extended: true
  }));
app.use(bodyParser.urlencoded(
  {
    limit: "10mb",
    extended: true
  }));
app.use(cookieParser());

fs.readdirSync("./src/schemas").forEach(function (file) {
  if (file.indexOf(".js")) {
    require("./src/schemas/" + file);
  }
});

fs.readdirSync("./src/routers").forEach(function (file) {
  if (file.indexOf(".js")) {
    var route = require("./src/routers/" + file);
    route.controller(app);
  }
});


const userModel = mongoose.model("User");

app.use(function (req, res, next) {
  if (req.session && req.session.user) {
    userModel.findOne({ email: req.session.user.email }, function (err, user) {
      if (user) {
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        delete req.session.user.password;
        next();
      }
    });
  } else {
    next();
  }
});

http.listen(port, function () {
  console.log("server started at port :" + port);
});
