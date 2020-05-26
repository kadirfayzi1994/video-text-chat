const express = require("express");
const router = express.Router();

const auth = require("../../auth/auth.js");

module.exports.controller = function(app) {
  app.get("/chat", auth.checkLogin, function(req, res) {
    res.render("chat", {
      user: req.session.user,
      chat: req.session.chat
    });
  });

  app.use(router);
};
