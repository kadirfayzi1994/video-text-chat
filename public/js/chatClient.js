$(function () {
  var socket = io('/chat');

  var username = $('#user').val();
  var roomId;
  var toUser;

  socket.on('connect', function () {
    socket.emit('set-user-data', username);
  });

  socket.on('onlineUsers', function (users) {
    $('#list').empty();
    $('#list').append($('<li>').append($('<button id="ubtn" class="btn btn-success btn-block"></button>').text("Genel")));

    for (var user in users) {
      if (user == username) {
        var userName = $('<button class="disabled" style="width: 100px;">').text(user);
      }
      else {
        var userName = $('<button id="ubtn" class="btn btn-success btn-md" style="width: 100px;">').text(user);
      }
      if (users[user] == "Online") {
        var userStatus = $('<span>&#x2B24;</span>').css({ "float": "right", "color": "#00FF01" });
      }
      else {
        var userStatus = $('<span>&#x2B24;</span>').css({ "float": "right" });
      }
      $('#list').append($('<li>').append(userName, userStatus));
    }
  });

  $(document).on("click", "#ubtn", function () {
    $('#messages').empty();
    toUser = $(this).text();

    $('#frndName').text(toUser);
    $('#chatForm').show();

    if (toUser == "Genel") {
      var currentRoom = "Genel";
      var reverseRoom = "Genel";
    }
    else {
      var currentRoom = username + "-" + toUser;
      var reverseRoom = toUser + "-" + username;
    }
    socket.emit('set-room', { roomName1: currentRoom, roomName2: reverseRoom, isGroup: false });
  });

  socket.on('set-room', function (room) {
    $('#messages').empty();
    roomId = room;
    socket.emit('old-chats-init', { room: roomId, username: username });
  });

  socket.on('old-chats', function (data) {
    if (data.room == roomId) {
      if (data.result.length != 0) {
        for (var i = 0; i < data.result.length; i++) {
          var chatDate = moment(data.result[i].createdOn).format("MMMM Do YYYY , hh:mm a");
          var txt1 = $('<span></span>').text(data.result[i].msgFrom + " : ").css({ "color": "#006496" });
          var txt2 = $('<span></span>').text(chatDate).css({ "float": "right", "color": "#a6a6a6", "font-size": "14px" });
          var txt3 = $('<p></p>').append(txt1, txt2);
          var txt4 = $('<p></p>').text(data.result[i].msg).css({ "color": "#000000" });
          $('#messages').prepend($('<li>').append(txt3, txt4));
        }
      }
    }
  });

  $('form').submit(function () {
    socket.emit('chat-msg', { msg: $('#myMsg').val(), msgTo: toUser, date: Date.now() });
    $('#myMsg').val("");
    return false;
  });

  socket.on('chat-msg', function (data) {
    var chatDate = moment(data.date).format("MMMM Do YYYY , hh:mm a");
    var txt1 = $('<span></span>').text(data.msgFrom + " : ").css({ "color": "#006496" });
    var txt2 = $('<span></span>').text(chatDate).css({ "float": "right", "color": "#a6a6a6", "font-size": "14px" });
    var txt3 = $('<p></p>').append(txt1, txt2);
    var txt4 = $('<p></p>').text(data.msg).css({ "color": "#000000" });
    $('#messages').append($('<li>').append(txt3, txt4));
  });



  /////////// Video chat \\\\\\\\\\\

  function getLocalVideo(callbacks) {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    var constraints = {
      audio: true,
      video: true
    }
    navigator.getUserMedia(constraints, callbacks.success, callbacks.error);
  }

  function recieveStream(stream, elementId) {
    const video = document.getElementById(elementId);
    video.srcObject = stream;
    window.peer_stream = stream;
  }

  getLocalVideo({
    success: function (stream) {
      window.localstream = stream;
      recieveStream(stream, 'localVideo');
    },
    error: function (error) {
      alert("Kameraya Ulaşılamıyor !");
      console.log(error);
    }
  });

  var conn;
  var peer_id;

  var peer = new Peer({
    host: 'peerjs-server.herokuapp.com', secure: true, port: 443,
    config: {
      'iceServers': [
        { url: 'stun:stun.l.google.com:19302' }
      ]
    }
  });

  peer.on('open', function () {
    document.getElementById("displayId").innerHTML = peer.id;
  });

  peer.on('connection', function (connection) {
    alert("Bağlantı Başarıyla Kuruldu !!")
    conn = connection;
    peer_id = connection.peer;
    document.getElementById("connId").value = peer_id;
  });

  peer.on('error', function (err) {
    alert("Bir Hata Oluştu : " + err);
    console.log(err);
  });

  document.getElementById("conn_button").addEventListener("click", function () {
    peer_id = document.getElementById("connId").value;
    if ((peer_id !== null || peer_id !== undefined || peer_id !== "") && peer_id.length == 16) {
      conn = peer.connect(peer_id);
      alert("Bağlantı Başarıyla Kuruldu !!")
    }
    else {
      alert("Girdiğiniz Bağlantı Id'si Eksik Veya Hatalı. Lütfen Kontrol Ederek Tekrar Deneyin.");
      return false;
    }
  });

  peer.on('call', function (call) {
    var acceptCall = confirm("Cevaplamak İstiyor Musunuz ?");
    if (acceptCall) {
      call.answer(window.localstream);
      call.on('stream', function (stream) {
        window.peer_stream = stream;
        recieveStream(stream, 'remoteVideo');
      });
      call.on('close', function () {
        alert("Görüşme Sona Erdi");
      });

    } else {
      alert("Arama Reddedildi");
    }
  });

  document.getElementById("call_button").addEventListener("click", function () {
    if (window.localstream) {
      var call = peer.call(peer_id, window.localstream);
      call.on('stream', function (stream) {
        window.peer_stream = stream;
        recieveStream(stream, 'remoteVideo');
      });
    } else {
      alert("Lütfen Kameranızı Açın")
    }
  });

  document.getElementById("end_call").addEventListener("click", function () {
    var video = document.querySelector("#localVideo");
    var stream = video.srcObject;
    var tracks = stream.getTracks();
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      track.stop();
    }
    video.srcObject = null;
  });

});
