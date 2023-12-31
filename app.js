const express = require('express');
const { Server } = require('socket.io');
const createError = require('http-errors');

// custom modules
const hostModule = require('./src/modules/host.module');
const pingModule = require('./src/modules/ping.module');

const app = express();
const http = require('http').Server(app);
const io = new Server(http);

app.use(express.static('public'));
const path = require("path");
let hosts;


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/hosts',  async (req, res) => {
    return res.send(hosts);
});

// primary host status for begin
app.get('/api/phstatus',  async (req, res) => {
    return res.send(await hostModule.getPrimaryHostStatus());
});

app.get('*', (req, res) => { 
    var errorPg = path.join(__dirname, "./public/404.html"); 
    res.status(404).sendFile(errorPg);
}); 


http.listen(3000, async () => {
    console.log("Listen on port 3000!");
    hosts = await hostModule.getHosts();
    if (hosts.length > 0) {
        // fill zero data for begin
        await hostModule.fillZeroPrimaryHSA();
        await startPing(hosts);
        console.log("Ping Machine has been activated!");
    }
    else {
        console.log("There is no host so Ping Machine has not been activated!");
    }
});

io.on('connection', (socket) => {
    //console.log('Connected!');
    socket.on('Disconnect', () => {
        //console.log('Disconnect!');
    });
});

const startPing = async (hosts) => {
    let statusList = [];
    setInterval( async () => {
        statusList = await pingModule.sendPing(hosts);
        io.emit('hostStatus', statusList);
    }, 3000);
}