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
b) Create a symbolic link to  �nodecurtain.service� in /etc/systemd/system	
>  sudo ln nodecurtain.service /etc/systemd/system/nodecurtain.service
c) Enable and start:
$ sudo systemctl enable nodecurtain.service
$ sudo systemctl stop nodecurtain.service
$ sudo systemctl start nodecurtain.service
$ sudo systemctl restart nodecurtain.service
$ sudo systemctl disable nodecurtain.service
$ ps aux
7) Console out logged to "/var/log/syslog" startup logged to "/var/log/messages" Create mysql datbase:
8) Remote debug from Visual Studio Code 
    https://code.visualstudio.com/docs/nodejs/nodejs-debugging
    https://nodejs.org/en/docs/guides/debugging-getting-started/
    a) Add protocol to launch.js:
        {
            "type": "node",
            "protocol": "inspector",
            "request": "attach",
            "name": "Attach to remote",
            "address": "192.168.1.89",
            "port": "9229"
        }
    b) Launch server with startup break:
        > ssh pi@192.168.1.89
        > cd ~/GridInsightOV1
        > node --inspect-brk=192.168.1.89:9229 server.js # break at startup
        > node --inspect=192.168.1.89:9229 server.js # run at startup
9) auto start:?	
	a) Log into to pi as root in putty?
	b) Copy  nodecurtain.service to /etc/systemd/system	
        > sudo cp node_ov1.service /etc/systemd/system
	c) Enable and start:
		$  sudo systemctl enable nodecurtain.service
		$  sudo systemctl restart nodecurtain.service
		$  sudo systemctl disable nodecurtain.service
		$ ps aux
10) Console out logged to "/var/log/syslog" startup logged to "/var/log/messages"??Create mysql datbase:????

Notes: Set timezone: >sudo dpkg-reconfigure tzdata?Reboot: >sudo reboot
>ps <- list running processes
> pidof node  <-  node process id