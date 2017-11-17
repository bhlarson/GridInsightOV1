# GridInsightOV1
API for Gird Insight OV-1 serial interface

Install software on Raspberry PI:
Log onto Raspberry PI with Putty or other command line terminal?1) Clone repository
> git clone https://github.com/bhlarson/CurtainControl.git
2) Update standard dependencies
> npm update
 3) Ensure communication using picocom.  <ctrl>+a <ctrl>+q to exit.
> picocom /dev/ttyAMA0 -b 115200 
3) Update and build node serial port interface
> sudo npm install serialport --unsafe-perm --build-from-source
5) execute project from console?>node server.js
6) auto start project:
a) Log into to pi as root in putty
b) Create a symbolic link to  ”nodecurtain.service” in /etc/systemd/system	
>  sudo ln nodecurtain.service /etc/systemd/system/nodecurtain.service
c) Enable and start:
$ sudo systemctl enable nodecurtain.service
$ sudo systemctl stop nodecurtain.service
$ sudo systemctl start nodecurtain.service
$ sudo systemctl restart nodecurtain.service
$ sudo systemctl disable nodecurtain.service
$ ps aux
7) Console out logged to "/var/log/syslog" startup logged to "/var/log/messages" Create mysql datbase:
