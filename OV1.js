// OV1 Interface
var log4js = require('log4js');
var SerialPort;
if (process.env.simulation == 'true') {
    SerialPort = require('virtual-serialport');
}
else {
    SerialPort = require('serialport'); 115200
}

var OVPort = function () {
    this.active = false;
    this.portName = '/dev/ttyAMA0';
    this.settings = { baudrate: 115200, databits: 8, stopbits: 1, parity: 'none' };
    this.serialPort = {};
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
            this.serialPort = new SerialPort(config.portName, this.settings);
            var pThis = this;
            this.serialPort.on('data', function (data) {
                console.log('serial data: ' + data)
                // Add data to buffer
                pThis.readString += data
                //for (var i = 0; i < data.length; i++) {
                //    pThis.readBuffer.push(data[i]);
                //}
                console.log('Appended read buffer: ' + pThis.readString)
                pThis.Evaluate(pThis.readString);
            });
            this.serialPort.on('err', function (err) {
                var result = { err: err };
                this.complete.forEach(function callback(complete) {
                    complete(result);
                });
            });
            this.serialPort.on('open', function () {
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
            this.serialPort.write(sendBuffer, function (err, result) {
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