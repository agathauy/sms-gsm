var modem = require("../index.js");

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
        m1.sendMessage(num, reply);
    }
});