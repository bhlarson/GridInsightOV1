// OV1 Interface
var log4js = require('log4js');
var SerialPort;
if (process.env.simulation == 'true') {
    SerialPort = require('virtual-serialport');
}
else {
    SerialPort = require('serialport');
}

var OVPort = function () {
    this.active = false;
    this.portName = '/dev/ttyAMA0';
    this.settings = { baudrate: 115200, databits: 8, stopbits: 1, parity: 'none' };
    this.port = {};
    this.message = {}
    this.timeout = 0;
    this.log = {};
    this.listeners = [];
    this.complete = [];
    this.writeString = '';
    this.readString = '';
}

OVPort.constructor = OVPort
OVPort.prototype = {

    // var config = { log: {}};
    Start: function (config, complete) {
        console.log("in Input");
        try {
            this.log = config.log;
            this.complete.push(complete);
            this.port = new SerialPort(config.portName, this.settings);

            this.port.on('data', function (data) {
                console.log('Data:', data);
            });

            var pThis = this;
            //this.port.on('data', function (data) {
            //    //console.log('serial data ascii: ' + data.toString('ascii'));
            //    //console.log('serial data utf8: ' + data.toString('utf8'));
            //    //console.log('serial data latin1: ' + data.toString('latin1'));
            //    console.log('serial data: ' + data.toString('hex'));

            //    var dataBuffer = [];
            //    for (var i = 0; i < data.length; i++) {
            //        dataBuffer.push(data[i]);
            //    }
            //    console.log('buffer data: ' + dataBuffer.toString('hex'));
            //    // Add data to buffer
            //    //pThis.readString += data.toString('ascii');
            //    //for (var i = 0; i < data.length; i++) {
            //    //    pThis.readBuffer.push(data[i]);
            //    //}
            //    //console.log('Appended read buffer: ' + pThis.readString);y
            //    //pThis.Evaluate(pThis.readString);
            //});
            this.port.on('err', function (err) {
                var result = { err: err };
                this.complete.forEach(function callback(complete) {
                    complete(result);
                });
            });
            this.port.on('open', function () {
            });
        }
        catch (err) {
            console.log("Serial Port Initialization error " + err);
            var result = { err: err };
            complete(result);
        }
    },

    Stop: function (config) {
        console.log("in Input");
        if (this.id) {
            clearTimeout(this.id);
            this.id = 0;
            var result = {};

            this.complete.forEach(function callback(complete) {
                complete(result);
            });

        }
    },

    // var command = {name:['MODE', 'SYNC', 'RESET', 'VRSN', 'SERL'], value:0};
    Input: function (command) {
        console.log("in Input");
        if (command.name) {
            this.writeString += command.name;
            if (command.value && (command.name == 'MODE' || command.name == 'SYNC')) 
            {
                this.writeString += command.value.toString();
            }
            this.writeString += '\n'
        }

        this.Evaluate();
    },

    Output: function (listener) {
        console.log("in Output");
        this.listeners.push(listener);
    },

    RemoveOutput: function (listener) {
        console.log("in RemoveOutput");
        for (var i = this.listeners.length - 1; i >= 0; i--) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i, 1);
            }
        }
    },

    Evaluate: function () {
        while (this.writeString.length > 0) {
            var sendBuffer = this.writeString;
            this.writeString = ''
            console.log('Evaluate write ' + sendBuffer);
            this.port.write(sendBuffer, function (err, result) {
                if (err) {
                    console.log('write error ' + err);
                    //reject({ result: module.exports.CompleteEnum.ACTION_FAIL, error: err });
                }
                else {
                    console.log('Evaluate write result ' + result);
                }
            });
        }

        if (this.readString.length && this.listeners) {
            var sendBuffer = this.readString;
            this.readString = '';

            // Send buffer to listeners
            var data = { serialData: sendBuffer };
            this.listeners.forEach(function (listener) {
                listener(data);
            });
        }
    }
};

exports.OVPort = OVPort;