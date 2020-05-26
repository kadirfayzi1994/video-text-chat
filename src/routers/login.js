const express = require("express");
const mongoose = require("mongoose");

const auth = require("../../auth/auth.js");

const router = express.Router();

const userModel = mongoose.model("User");

module.exports.controller = function (app) {
  router.get("/login", auth.loggedIn, function (req, res) {
    res.render("login", {
      user: req.session.user,
      chat: req.session.chat
    });
  });

  router.get("/logout", function (req, res) {
    delete req.session.user;
    res.redirect("/user/login");
  });

  router.post("/api/v1/login", auth.loggedIn, function (req, res) {
    userModel.findOne({ $and: [{ email: req.body.email }, { password: req.body.password }] },
      function (err, result) {
        if (err || result == null || result == undefined || result == "") {
          res.render("message", {
            title: "Hata",
            msg: "Kullanıcı Bulunamadı. Tekrar Deneyin.",
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
      }
    );
  });

  app.use("/user", router);
};
