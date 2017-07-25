var SerialPort = require('serialport');
var events = require('events');
var _ = require("underscore");

var ctrlZ = String.fromCharCode(26);
class Modem_text {
    constructor(port, options) {
        this.port = port;
        if (options == undefined) {
            var options = {};
        }
        _.defaults(options, {
            baudrate: 115200,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            flowControl: false,
            autoOpen: false
        });
        this.options = options;
        this.serial = new SerialPort(this.port, this.options);
        this.eventEmitter = new events.EventEmitter();

        console.log(this.port);
        console.log(this.options);

        this.init = true;
        //this.newMsgs = [];
        // list of pending to sendMsgs UUID
        this.sendMsgQueue = [];

        this.sendMsgFlag = false;
        this.contMsgFlag = false;

        this.sendMessage = "";
        this.waitingCaret = false;

        this.serial.on('open', (err) => {
            if (err) {
                console.log("Error in opening port");
            }
            console.log("Port is opened");
        });
        var data = "";
        var newMsg = false;
        var msgHeader = [];
        var msg = {
                num: "",
                text: ""
            }
            // Check sendMsgQueue for new msgs
        setInterval(() => {
            console.log("IN SENDING MSG 5 SECS");
            console.log(this.sendMsgFlag);
            console.log(this.contMsgFlag);
            console.log(this.sendMsgQueue);
            if (this.sendMsgFlag == false & this.sendMsgQueue.length > 0) {
                console.log("sendMsgFlag is FALSE");

                this.actualSendMsg();
            }

        }, 5000);
        // handle events
        this.serial.on('data', (buffer) => {
            data += buffer.toString();
            console.log("DATA: " + data);
            var parts = data.split('\r\n');
            console.log('PARTS:', parts);

            //data = "";

            data = parts.pop();
            console.log(data)
            console.log('POPPED DATA: ' + data);
            if (data.trim() == '>') {
                console.log("received >");
                console.log(this.sendMsgFlag);
                console.log(this.contMsgFlag);
            }
            // Input msg
            if (data.trim() == '>' & this.sendMsgFlag == true & this.contMsgFlag == false) {
                console.log("in before continue send msg");
                this.continueSendMsg();
            }
            //console.log('POPPED DATA:', data);
            console.log("before for each");
            console.log(parts);
            parts.forEach((part) => {
                //console.log('PART:', part);
                //console.log("PART: " + part.split('\r'));
                //console.log(part.split('\r'));
                var newparts = [];
                newparts = part.split('\r');
                console.log('start of new parts');
                console.log(newparts);
                console.log('end of new parts');
                newparts.forEach((newpart) => {
                    // if expecting new msg
                    console.log(newpart);
                    if (newMsg == true) {
                        newMsg = false;
                        console.log(newpart);
                        msg.text = newpart;
                        // Has acquired new msg
                        console.log("New msg");
                        console.log(msg);
                        console.log('end of new msg');
                        this.eventEmitter.emit('new message', msg.num, msg.text);
                        console.log(this.newMsgs);
                    }
                    // new message, expect next array to be msg
                    if (newpart.indexOf('+CMT: ') > -1) {
                        // get header details
                        msgHeader = newpart.split("+CMT: ")[1].split(',');
                        msg.num = msgHeader[0].split('"')[1];
                        newMsg = true;
                    }
                    // successfully sent a mesg
                    if (newpart.indexOf('+CMGS: ') == 0) {
                        // get header details
                        /*
                        msgHeader = newpart.split("+CMT: ")[1].split(',');
                        msg.num = msgHeader[0];
                        newMsg = true;*/
                        this.sendMsgQueue.shift();
                        this.contMsgFlag = false;
                        this.sendMsgFlag = false;

                        console.log("Sent message");
                    }
                    // got ok
                    if (newpart.indexOf('OK') == 0) {
                        //
                    }
                    // received error
                    if (newpart.indexOf('ERROR') == 0) {
                        // For sending msgs
                        if (this.sendMsgFlag == true) {
                            this.sendMsgFlag = false;
                            this.contMsgFlag = false;
                        }

                    }
                    // received a command
                    if (newpart.indexOf('AT') == 0) {
                        //
                    }


                });

            });
            console.log("end received data");
        });
    }
    open(cb) {
        this.serial.open((err) => {
            if (err) {
                console.log("in error");
                console.log(err);
                cb(err);
                return false;
                //return (err);
                //return new Error("Error opening port: " + err.message);
            }
            this.serial.write("AT");
            this.serial.write("\r");
            // set to text mode
            this.serial.write("AT+CMGF=1");
            this.serial.write("\r");
            cb(true);
            return true;
        });
    }

    sendMsg(number, message) {
        console.log("in prior send msg");
        console.log(number);
        console.log(message);
        this.sendMsgQueue.push({ num: number, msg: message });
        return;
    }

    actualSendMsg() {
        console.log("in send msg");
        this.sendMsgFlag = true;
        //this.sendMessage = message;

        /*
        this.serial.write("AT+CMGF=1\r");
        this.serial.write("AT+CMGS=\"" + number + "\"\r");
        */
        /*
        setTimeout(() => {
            this.serial.write('\r');
            return;
        }, 100);
        */
        setTimeout(() => {
            this.serial.write("AT+CMGF=1\r");
            setTimeout(() => {
                this.serial.write("AT+CMGS=\"" + this.sendMsgQueue[0].num + "\"\r");
                return;
            }, 100);
        }, 100);


    }
    continueSendMsg() {
        console.log("in continue send msg");
        this.contMsgFlag = true;
        //this.serial.flush();
        setTimeout(() => {
            this.serial.write(this.sendMsgQueue[0].msg);
            setTimeout(() => {
                this.serial.write(Buffer([0x1A]));
                return;
            }, 100);

        }, 100);
        ///this.sendingMsg = false;
        //return;

    }
    readMsgs() {
        console.log("before read messages");
        this.serial.write("AT+CPMS=\"SM\"");
        this.serial.write('\r');
        this.serial.write("AT+CMGL=\"ALL\"");
        this.serial.write('\r');
        return;
    }
    newMsgs(cb) {
        this.eventEmitter.on('new message', (num, text) => {
            console.log("here in newMsgs()");
            cb("got it");
            return true;
        });
        //return this.newMsgs;
    }
    queueCmd() {
        //
        return;
    }

    execute(cmd, newline, expect) {
        setTimeout(() => {
            this.serial.write(cmd);
            setTimeout(() => {
                this.serial.write(newline);
            }, 100);

        }, 100);
    }
    checkSignal() {
        return;
    }



}

class Modem_pdu {
    constructor(port) {
        this.port = port;
        console.log(port);
    }
}




module.exports = {
    Modem_text: Modem_text,
    Modem_pdu: Modem_pdu
}


/*
var globe_modem = new Modem_text("test");
console.log(globe_modem.port);
*/