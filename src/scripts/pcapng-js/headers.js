/**
 * Created by Cody on 11/6/2016.
 */
var PCAPNG = (function (parent) {


    parent.headerTypes = {
        ETHERNET:1,
        IP:2,
        TCP:3
    };

    parent.types = parent.types || {};

    var arrToMacString = function(arr) {
        var str = "";
        for (var i=0; i<6; i++) {
            var piece = arr[i];
            str += (piece>>>4).toString(16).toUpperCase();
            str += (piece&15).toString(16).toUpperCase();
            str += ":";
        }
        return str.substr(0,str.length-1);
    };

    parent.types.Ethernet = function (blob) {

        var frame = {};

        frame.type = parent.headerTypes.ETHERNET;

        var header = new Uint8Array(blob.slice(0,14));


        frame.DestMac = header[0]*Math.pow(2,40) + header[1]*Math.pow(2,32) + header[2]*Math.pow(2,24) + header[3]*Math.pow(2,16) + header[4]*Math.pow(2,8) + header[5];
        frame.DestMacString = arrToMacString(header.subarray(0,6));
        frame.SrcMac = header[6]*Math.pow(2,40) + header[7]*Math.pow(2,32) + header[8]*Math.pow(2,24) + header[9]*Math.pow(2,16) + header[10]*Math.pow(2,8) + header[11];
        frame.SrcMacString = arrToMacString(header.subarray(6,12));

        frame.Payload = blob.slice(14);
        frame.IP = parent.types.Ip(frame.Payload);

        return frame;
    };

    parent.types.Ip = function (blob) {
        var datagram = {};

        datagram.type = parent.headerTypes.IP;

        var header = new Uint8Array(blob.slice(0,20));

        datagram.Version = header[0]>>>4;
        datagram.IHL = header[0]&15;
        datagram.DSCP = header[1]>>>2;
        datagram.ECN = header[1]&3;
        datagram.Length = header[2]*Math.pow(2,8) + header[3];
        datagram.Identification = header[4]<<8 + header[5];
        datagram.Flags = header[6]>>>5;
        datagram.FragmentOffset = (header[6]&31)*Math.pow(2,8) + header[7];
        datagram.TTL = header[8];
        datagram.Protocol = header[9];
        datagram.Checksum = header[10]*Math.pow(2,8) + header[11];
        datagram.SrcIP = header[12].toString() + "." + header[13].toString() + "." + header[14].toString() + "." + header[15].toString();
        datagram.DestIP = header[16].toString() + "." + header[17].toString() + "." + header[18].toString() + "." + header[19].toString();

        datagram.Payload = blob.slice(20);
        datagram.TCP = parent.types.Tcp(datagram.Payload);

        return datagram;
    };

    parent.types.Tcp = function (blob) {
        var segment = {};

        segment.type = parent.headerTypes.TCP;

        var header = new Uint8Array(blob.slice(0,20));

        segment.SrcPort = (header[0]*Math.pow(2,8)) + header[1];
        segment.DestPort = (header[2]*Math.pow(2,8)) + header[3];
        segment.SeqNum = (header[4]*Math.pow(2,24)) + (header[5]*Math.pow(2,16)) + (header[6]*Math.pow(2,8)) + header[7];
        segment.AckNum = (header[8]*Math.pow(2,24)) + (header[9]*Math.pow(2,16)) + (header[10]*Math.pow(2,8)) + header[11];
        segment.DataOffset = header[12]>>>4;
        segment.NS = header[12]&1;
        segment.CWR = header[13]>>>7;
        segment.ECE = (header[13]>>>6)&1;
        segment.URG = (header[13]>>>5)&1;
        segment.ACK = (header[13]>>>4)&1;
        segment.PSH = (header[13]>>>3)&1;
        segment.RST = (header[13]>>>2)&1;
        segment.SYN = (header[13]>>>1)&1;
        segment.FIN = header[13]&1;
        segment.WindowSize = (header[14]*Math.pow(2,8)) + header[15];
        segment.Checksum = (header[16]*Math.pow(2,8)) + header[17];
        segment.Urgent = (header[18]*Math.pow(2,8)) + header[19];

        segment.Payload = blob.slice(20);

        return segment;
    };

    return parent;
}(PCAPNG || {}));