console.log("Starting GritInsightOV1 on " + process.platform + " with node version " + process.version);
require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioSocket;

var SerialPort;
if (process.env.simulation == 'true') {
    SerialPort = require('virtual-serialport');
}
else {
    SerialPort = require('serialport');
}

const Delimiter = SerialPort.parsers.Delimiter;
portName = process.env.serialport;
settings = { baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' };

 
//var ov1 = require('./OV1');
//var mysql = require('mysql');
//var log4js = require('log4js');

console.log("Dependancies Found");


//log4js.configure({
//    appenders: { command: { type: 'file', filename: 'state.log' } },
//    categories: { default: { appenders: ['command'], level: 'ALL' } }
//});
//const cmdLog = log4js.getLogger('command');

//var ov1Port = new ov1.OVPort();
//ov1Port.Output(function (data) {
//    console.log(data);
//    if (data.serialData && ioSocket) {
//        ioSocket.emit('data', data.serialData);
//    }
//});
//var config = { log: cmdLog, portName: process.env.serialport };
//ov1Port.Start(config, function (result) {
//    console.log(result);
//});
 
//command = { name: 'VRSN' };
//ov1Port.Input(command);

//// Home database credentials
//var pool = mysql.createPool({
//    connectionLimit: 10,
//    host: process.env.dbhost,
//    user: process.env.dbuser,
//    //  password        : 'password',
//    database: process.env.dbname
//});

//console.log("mysql.createPool exists=" + (typeof pool !== 'undefined'));

var port = Number(process.env.nodeport) || 1339;
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile('index.html')
});


http.listen(port, function () {
    console.log("Listening on port " + port);
});

io.on('connection', function (socket) {
    socket.broadcast.emit('Server Connected');
    ioSocket = socket;
    socket.on('disconnect', function () {
        console.log('Socket.IO  disconnected ' + socket.id);
    });
    socket.on('connect_failed', function () {
        console.log('socket.io connect_failed');
    })
    socket.on('reconnect_failed', function () {
        console.log('socket.io reconnect_failed');
    })
    socket.on('error', function (err) {
        console.log('socket.io error:' + err);
    })
    socket.on('Command', function (data) {
        command = { name: data.cmd, value: data.val };
        console.log('Command ' + JSON.stringify(data));
    });
});

sp = new SerialPort(portName, settings);
const parser = sp.pipe(new Delimiter({ delimiter: Buffer.from('EOL') }));

sp.on('data', function (data) {
    process.stdout.write(data);
    ioSocket.emit('data', data.toString());
});

module.exports = app;
console.log("GridInsightOIV-1 Started");