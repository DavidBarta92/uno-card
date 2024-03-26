
const socket = io({autoConnect: false});
const canvas = document.getElementById('canvas');;
const ctx = canvas.getContext('2d');

const cdWidth = 240;
const cdHeight = 360;
const cards = new Image();
const back = new Image();

let room;
let hand = [];
let turn;
let playerName;

function init() {
    ctx.font = "12px Arial";
    canvas.style.backgroundColor = '#10ac84';
    cards.src = 'images/deck.svg';
    back.src = 'images/uno.svg';
  
    document.addEventListener('touchstart', onMouseClick, false);
    document.addEventListener('click', onMouseClick, false);
  
    playerName = getCookie('playerName');
    if (playerName == null) {
      playerName = prompt('Enter your name: ', 'Guest');
      if (playerName == null || playerName == "") {
        playerName = 'Guest';
      }
      setCookie('playerName', playerName, 24 * 3600);
    }
  
    socket.connect();
  }

function setCookie(name, value, seconds) {
    let date = new Date();
    date.setTime(date.getTime() + (seconds * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  function getCookie(name) {
    name += "=";
    let cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) == 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  socket.on('connect', requestRoom);

function requestRoom() {
  socket.emit('requestRoom', playerName);
  room = 0;
  hand = [];
  turn = false;
  console.log('>> Room Request');
}

socket.on('responseRoom', function (name) {
    if (name != 'error') {
      room = name;
      console.log('<< Room Response: ' + name);
      ctx.fillText(name, 0, 10);
      ctx.drawImage(back, canvas.width-cdWidth/2-60, canvas.height/2-cdHeight/4, cdWidth/2, cdHeight/2);
      ctx.fillText(playerName, 100, 390);
    } else {
      socket.disconnect();
      alert('Rooms are full! Try again later');
    }
  });
  
  socket.on('countDown', function(countDown) {
    ctx.clearRect(0, 10, 15, 10);
    ctx.fillText(countDown, 0, 20);
  });
