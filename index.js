var app = require('express')();
var http = require('http').Server(app);
var client = require('socket.io')(http);
var port = process.env.PORT || 3000;

//routes
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function (req, res) {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/chatAdmin', function (req, res) {
  res.sendFile(__dirname + '/chatAdmin.html');
});

app.get('/login', function (req, res) {
  res.sendFile(__dirname + '/login.html');
});

app.set('view engine', 'ejs');

client.on('connection', function (socket) {
  socket.on('chat message', function (msg) {
    client.emit('chat message', msg);
  });
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});

const mongo = require('mongodb').MongoClient;
//const client = require('socket.io').listen(3000).sockets;

// Connect to mongo
mongo.connect('mongodb://Manu:j1WKp16eJUZIm66e@cluster0-shard-00-00-4mgro.mongodb.net:27017,cluster0-shard-00-01-4mgro.mongodb.net:27017,cluster0-shard-00-02-4mgro.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true', function (err, db) {
  if (err) {
    throw err;
  }

  console.log('MongoDB connected...');

  // Connect to Socket.io
  client.on('connection', function (socket) {
    let chat = db.collection('chats');

    // Create function to send status
    sendStatus = function (s) {
      socket.emit('status', s);
    }

    // Get chats from mongo collection
    chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
      if (err) {
        throw err;
      }

      // Emit the messages
      socket.emit('output', res);
    });

    // Handle input events
    socket.on('input', function (data) {
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if (name == '' || message == '') {
        // Send error status
        sendStatus('Please enter a name and message');
      } else {
        // Insert message
        chat.insert({ name: name, message: message }, function () {
          client.emit('output', [data]);

          // Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    // Handle clear
    socket.on('clear', function (data) {
      // Remove all chats from collection
      chat.remove({}, function () {
        // Emit cleared
        socket.emit('cleared');
      });
    });
  });
});
