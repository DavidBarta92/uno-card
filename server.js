const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const numRooms = 5;
const maxPeople = 10;

app.use(express.static(__dirname + '/public'));
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));

function onConnection(socket) {
   console.log('a user connected');
}

let deck = Array.apply(null, Array(112)).map(function (_, i) {return i;});

deck.splice(56, 1); //56
deck.splice(69, 1); //70
deck.splice(82, 1); //84
deck.splice(95, 1); //98

/**
 * Shuffles all elements in array
 * @function
 * @param {Array} to shuffle
 */
function shuffle(a) {
   let j, x, i;
   for (i = a.length - 1; i > 0; i--) {
     j = Math.floor(Math.random() * (i + 1));
     x = a[i];
     a[i] = a[j];
     a[j] = x;
   }
 }

let data = [];
for (let i = 1; i <= numRooms; i++) {
  let room = [];
  room['timeout'] = [];
  room['timeout']['id'] = 0;
  room['timeout']['s'] = 10;
  room['deck'] = [];
  room['reverse'] = 0;
  room['turn'] = 0;
  room['cardOnBoard'] = 0;
  room['people'] = 0;
  let players = [];
  for (let j = 0; j < maxPeople; j++) {
    let p = [];
    p['id'] = 0;
    p['name'] = "";
    p['hand'] = [];
    players[j] = p;
  }
  room['players'] = players;
  data['Room_'+i] = room;
}

/**
 * Whenever a client connects
 * @function
 * @param {Socket} socket Client socket
 */
function onConnection(socket) {
     /**
      * Whenever a room is requested, looks for a slot for the player,
      * up to 10 players in a room, maxRooms and started games are respected.
      * @method
      * @param {String} playerName Player name
      * @return responseRoom with the name of the room, otherwise error.
      */
     socket.on('requestRoom', function(playerName) {
       socket.playerName = playerName;
       for (let i = 1; i <= numRooms; i++) {
         let name = 'Room_' + i;
         let people;
         try {
           people = io.sockets.adapter.rooms[name].length;
         } catch (e) {
           people = 0;
         }
         if (people < maxPeople && data[name]['timeout']['s'] > 0) {
           socket.join(name);
           console.log('>> User ' + socket.playerName +
           ' connected on ' + name + ' (' + (people + 1) + '/' + maxPeople + ')');
           io.to(socket.id).emit('responseRoom', name);
           if (people + 1 >= 2) {
             clearInterval(data[name]['timeout']['id']);
             data[name]['timeout']['s'] = 10;
             data[name]['timeout']['id'] = setInterval(function() {
               startingCountdown(name);
             }, 1000);
           }
           return;
         }
       }
       io.to(socket.id).emit('responseRoom', 'error');
       console.log('>> Rooms exceeded');
     });
   }

   /**
 * Starts a countdown for start a game on a room
 * @function
 * @param {String} name Room name
 */
function startingCountdown(name) {
   let countDown = data[name]['timeout']['s']--;
   io.to(name).emit('countDown', countDown);
   console.log('>> ' + name + ': Starting in ' + countDown);
   if (countDown <= 0) {
     clearInterval(data[name]['timeout']['id']);
     startGame(name);
   }
 }