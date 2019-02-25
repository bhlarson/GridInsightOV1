console.log("Starting GritInsightOV1 on " + process.platform + " with node version " + process.version);
require('dotenv').config({ path: './config.env' });
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var ioSocket;

var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.dbhost,
    user: process.env.dbuser,
    //password: 'password',
    database: process.env.dbname
});

var srvMeters = [];

var SerialPort;
if (process.env.simulation == 'true') {
    SerialPort = require('virtual-serialport');
}
else {
    SerialPort = require('serialport');
}

portName = process.env.serialport;
settings = { baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' };

 
//var ov1 = require('./OV1');
//var mysql = require('mysql');
//var log4js = require('log4js');

console.log("Dependancies Found");

if (!Date.prototype.toSQLString) {
    (function () {
        
        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }
        
        Date.prototype.toSQLString = function () {
            //return this.format("yyyy-mm-dd hh-MM-ss");
            return this.getUTCFullYear() +
                '-' + pad(this.getUTCMonth() + 1) +
                '-' + pad(this.getUTCDate()) +
                ' ' + pad(this.getUTCHours()) +
                '-' + pad(this.getUTCMinutes()) +
                '-' + pad(this.getUTCSeconds());
        };
    }());
}

if(!Date.prototype.toDatetimeLocalString){
    (function(){
            var ret = new Date(this);
            var offsetMin = ret.getTimezoneOffset();
            ret.setTime(ret.getTime() + offsetMin*60000);
        
            // 2011-10-05T14:48:00
            retStr = ret.getYear()+'-'+ret.getMonth()+'-'+ret.getDay()+'T'+ret.getHours()+':'+ret.getMinutes()+':'+ret.getSeconds();
        
          return retStr;
    }());
}


var port = Number(process.env.nodeport) || 1339;
app.use(express.static('public'));
app.use('/jq', express.static(__dirname + '/node_modules/jquery/dist/'));

app.get('/', function (req, res) {
    res.sendFile('index.html')
});

app.get('/GetMeters', function (req, res) {
    GetMeters().then(function (meters) {
        srvMeters = meters;
        res.send(meters);
    }, function (failure) {
        res.send(failure);
    });
});

app.get('/AddDevice', function (req, res) {
    var newConfig = req.query.update;
    var sql = 'INSERT INTO ' + process.env.dbdevices + ' SET ?';
    
    pool.query(sql, newConfig, function (dberr, dbres, dbfields) {
        res.send(dberr);
    });
});

app.get('/RemoveDevice', function (req, res) {
    var id = req.query.id;
    var sql = 'DELETE FROM ' + process.env.dbdevices + ' WHERE id=?';
    
    pool.query(sql, id, function (dberr, dbres, dbfields) {
        res.send(dberr);
    });
});

app.get('/Plot', function (req, res) {
    var beginDateTime = req.query.begin;
    var endDateTime = req.query.end;

    GetLog(beginDateTime, endDateTime).then(function (logData) {
        console.log('git /plot succeeded');
        res.send(logData);
    }).then(function (failure) {
        console.log('git /plot failed');
        res.send(failure);
    }).catch(function(err){
        console.log('git /plot catch promise rejection')        
    });
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
        console.log('Command ' + JSON.stringify(data));
        var writeString = '';
        if (data.cmd) {
            writeString += data.cmd;
            if (data.cmd && (data.cmd == 'MODE' || data.cmd == 'SYNC')) {
                writeString += ' ' + data.val.toString();
            }
            writeString += '\r\n';

            if (sp) {
                sp.write(writeString);
            }
        }
    });
});

sp = new SerialPort(portName, settings);
var receiveString = "";
sp.on('data', function (data) {
    process.stdout.write(data);

    receiveString += data.toString();
    console.log("\nReceiveString:" + receiveString);

    var parseStart = receiveString.indexOf('$')
    var parseEnd = receiveString.lastIndexOf('\r\n');
    if (parseStart >= 0 && parseEnd >= parseStart) {
        var fullLines = receiveString.slice(parseStart, parseEnd); // Full lines of data
        receiveString = receiveString.slice(parseEnd + 2, receiveString.length); // Remove data that will be parsed
        var lineArray = fullLines.split('\r\n'); // Array of lines
        console.log("parseStart:" + parseStart + " parseEnd:" + parseEnd +
            " fullLines:" + fullLines + " final receiveString:" + receiveString +
            " lineArray.length=" + lineArray.length)

        for (var i = 0; i < lineArray.length; i++) {
            var entries = lineArray[i].split(',');
            if (entries.length > 0) {
                switch (entries[0]) {
                    case '$UMBOM':
                        if (entries.length >= 6) {
                            var reading = { id: entries[1], consumption: entries[2], flag1: entries[3], flag2: entries[4], strength: entries[5] };
                            srvMeters.forEach(meter => {
                                if (entries[1] == meter.id) {
                                    Record(reading)
                                }
                            });

                        }
                        break;
                    case '$UMSCM':
                        if (entries.length >= 6) {
                            var reading = { id: entries[1], consumption: entries[2], ErtType: entries[3], TamperFlag: entries[4], strength: entries[5] };
                            //if (entries[0] == '83621600') {
                            ioSocket.emit('Itron SCM', reading);
                            //}
                        }
                        break;
                }

            }
        }
    }

    if (ioSocket) {
        ioSocket.emit('data', data.toString());
    }
});

function GetMeters() {
    return new Promise(function (resolve, reject) {
        var connectionString = 'SELECT * FROM `' + process.env.dbdevices +'`';
        pool.query(connectionString, function (dberr, dbres, dbfields) {
            if (dberr)
                reject(dberr);
            else {
                resolve(dbres);
            }
        });
    });
}

async function Record(reading) {

    var record = {
        time: new Date(),
        id: reading.id,
        value: reading.consumption,
        data01: reading.flag1,
        data02: reading.flag2,
        strength: reading.strength,
    };

    console.log(JSON.stringify(record))

    //await pool.query('INSERT INTO '+ process.env.dblog + ' SET ?', record); // Record to DB
    //io.sockets.emit('record', record); // Send record to listening clients

    var sql = 'INSERT INTO ' + process.env.dblog + ' SET ?';
    pool.query(sql, [record], function (dberr, dbres, dbfields) {
        io.sockets.emit('status', record); // Send record to listening clients
        if (dberr)
            io.sockets.emit('status', dberr)
    });
}

module.exports = app;
console.log("GridInsightOIV-1 Started");

GetMeters().then(function (meters) {
    srvMeters = meters;
    console.log("Meters: " + JSON.stringify(srvMeters));
});

function GetLog(begin, end){
    //console.log("GetLog " + begin + ":" + end)
    return new Promise(function (resolve, reject) {
        var connectionString = 'SELECT * FROM '+ process.env.dblog +' WHERE ';
        //console.log("Git Log connectionString: "+ connectionString)
        if (begin && end) {
            var dateBegin = new Date(begin);
            var dateEnd = new Date(end);
            connectionString += "time between '" + dateBegin.toSQLString() + "' and '" + dateEnd.toSQLString() + "'";
        }
        else if (begin) {
            var dateBegin = new Date(begin);
            connectionString += "time >= '" + dateBegin.toSQLString() + "'";
        }
        else if (end) {
            var dateEnd = new Date(end);
            connectionString += "time <= '" + dateEnd.toSQLString() + "'";
        }
        else {
            connectionString += "1";
        }
        //console.log("Git Log final connectionString: "+ connectionString)
        pool.query(connectionString, function (err, res, fields) {
            if (err){
                //console.log("GitLog query error "+ error)
                reject(err);
            }
            else{
                //console.log("GetLog query results " + JSON.stringify(res))
                resolve(res);
            }
        });
    });
}
