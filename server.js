const express =require('express');
const path = require('path');
const http =require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUsers, getRoomUsers,userLeave} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);


//set stactic folder
app.use(express.static(path.join(__dirname, 'public')));
const botName ='chatBot';

// Run when clients connects 
io.on('connection', socket =>{

    socket.on('joinRoom',({username, room})=> {
        
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        
        
        //welcome Current user
        socket.emit('message',formatMessage(botName,'welcome to chatcord'));

        // broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} user connected`));

    })

    console.log('new connections...'); 

    
    // listening to chatmessage
    socket.on('chatMessage', msg=>{
        const user = getCurrentUsers(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username,msg));

    //send user and room info
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room) 
    });
    });


    //disconnects
    socket.on('disconnect',()=>{

        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} disconnected`)); 
           
            //send user and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room) 
            });
        }
    } );
    
});



server.listen(3000, ()=>{
    console.log(`server running on port 3000`)
});

