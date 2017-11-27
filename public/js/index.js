
var socket = io();
socket.io._timeout = 30000;

socket.emit('Command', {
    cmd: "DownLimit", type: "group", addr: 1234
});

socket.on('data', function (data) {
    console.log(data);

    //var msg = document.getElementById('ov1msg');
    //var prevMessage = msg.value;
    //msg.value = (prevMessage + data);
});

socket.on('Badger ORION', function (data) {
    //console.log(JSON.stringify(data));

    var msg = document.getElementById('ov1msg');
    var prevMessage = msg.value;
    msg.value = (prevMessage + JSON.stringify(data)+'\n');
});

function OV1Command()
{
    var cmdSel = document.getElementById('cmdSel');
    var cmdVal = document.getElementById('cmdVal');

    socket.emit('Command', { cmd: cmdSel.value, val: Number(cmdVal.value) });
    console.log('OV1Command: ' + cmdSel.value + " " + cmdVal.value);
}

