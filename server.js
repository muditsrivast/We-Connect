const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path = require('path');
const bodyParser = require('body-parser');
const compiler = require('compilex');

const server = http.createServer(app);
const io = new Server(server);
app.use(express.json())
app.post('/compile',(req,res)=>{
  const option = { stats: true}
  compiler.init(option);
  const code = req.body.code;
  const inputRadio = req.body.inputRadio;
  const lang = req.body.lang;
  const input = req.body.input; 
  console.log(code);
  console.log(inputRadio);

  console.log(lang);
  console.log(input);


  if(inputRadio==='true')
  { console.log("trueenter")
    switch(lang){
      case 'C++' : 
          var envdata = {OS:'windows',cmd:'g++',options:{timeout:10000}};
          compiler.compileCPPWithInput(envdata,code,input,function(data){
            if(data.error)
              res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;
      case 'Python' : 
          var envdata = {OS:'windows'};
          compiler.compilePythonWithInput(envdata,code,input,function(data){
            if(data.error)
            res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;
      case 'Java' : 
          var envdata = {OS:'windows'};
          compiler.compileJavaWithInput(envdata,code,input,function(data){
            if(data.error)
            res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;

    }
  } else {
         console.log("enteredinit")
    switch(lang){
      case 'C++' : 
          var envdata = {OS:'windows',cmd:'g++',options:{timeout:10000}};
          compiler.compileCPP(envdata,code,function(data){
            if(data.error)
            res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;
      case 'Python' : 
          var envdata = {OS:'windows'};
          compiler.compilePython(envdata,code,function(data){
            if(data.error)
            res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;
      case 'Java' : 
          var envdata = {OS:'windows'};
          compiler.compileJava(envdata,code,function(data){
            if(data.error)
            res.status(200).send(data.error);
            else
            res.status(200).send(data.output);
          });
          break;

    }

  // res.send("working");
  }
})
  
const userSocketMap = {};
app.get('/',(req,res)=>{
  res.send("<h1>working</h1>");
})
function getAllConnectedClients(roomId) {
  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    console.log(clients);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    // console.log('recieved', code);
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
