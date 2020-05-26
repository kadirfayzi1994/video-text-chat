const express = require("express");

const router = express.Router();

module.exports.controller = function(app) {
  router.get("/", function(req, res) {
    res.redirect("/user/login");
  });

  app.use(router);
};
