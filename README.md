sms-gsm
========
A gsm modem library for Node JS to send and receive text messges.

Warning, in alpha stages.

## Installation
`npm install sms-gsm`

## Usage
See examples/test.js

```
var modem = require("sms-gsm");

/* Change to port */
var m1 = new modem.Modem_text("/dev/tty.usbserial-A600aL36");

/* To always re-open port in case of disconnect */
var open_port = setInterval(() => {
    m1.open((status) => {
        if (status == true) {
            console.log("Port is open");
            clearInterval(open_port);
        } else {
            console.log("in else");
            console.log(status);
        }
    });
}, 3000);

m1.eventEmitter.on('new message', (num, text) => {
    console.log("New message:");
    console.log(num);
    console.log(text);

    var msg = text.trim().split(/\s+/);
    if (msg.toUpperCase() == "HELLO") {
        var reply = "Hi";
        m1.sendMessage(num, reply, (err, res) => {
            if (err) {
                console.log(err);
            } else {

            }
        });
    }
});

```
## TODO 
### For v1
- [ ] Finish Modem Text mode
    - [ ] Handle error codes for each command sent to serial
    - [ ] Have error callbacks
    - [ ] Read messages from storage instead of from notification (?)
    - [ ] Auto hangup calls
    - [ ] Check signal of modem functionality
- [ ] Clean up code
- [ ] Clean comments

### For v2
- [ ] Modem PDU mode
- [ ] Use a message queue for handling commands
