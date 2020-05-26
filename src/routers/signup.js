const express = require("express");
const mongoose = require("mongoose");

const auth = require("../../auth/auth.js");

const router = express.Router();

const userModel = mongoose.model("User");

module.exports.controller = function (app) {
  router.get("/signup", auth.loggedIn, function (req, res) {
    res.render("signup", {
      user: req.session.user,
      chat: req.session.chat
    });
  });

  router.post("/api/v1/signup", auth.loggedIn, function (req, res) {
    const newUser = new userModel({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

    newUser.save(function (err, result) {
      if (err || result == undefined || result == null || result == "") {
        res.render("message", {
          title: "Hata",
          msg: "Kullanıcı Oluşturulamadı. Tekrar Deneyin.",
          user: req.session.user,
          chat: req.session.chat
        });
      } else {
        req.user = result;
        delete req.user.password;
        req.session.user = result;
        delete req.session.user.password;
        res.redirect("/chat");
      }
    });
  });

  app.use("/user", router);
}; 
