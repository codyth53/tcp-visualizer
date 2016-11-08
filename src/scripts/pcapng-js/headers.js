/**
 * Created by Cody on 11/6/2016.
 */
var PCAPNG = (function (parent) {


    parent.headerTypes = {
        ETHERNET:1,
        IP:2
    };

    parent.types = parent.types || {};

    var arrToMacString = function(arr) {
        var str = "";
        for (var i=0; i<6; i++) {
            var piece = arr[i];
            str += (piece>>4).toString(16).toUpperCase();
            str += (piece&15).toString(16).toUpperCase();
            str += ":";
        }
        return str.substr(0,str.length-1);
    };

    parent.types.Ethernet = function (blob) {

        var frame = {};

        frame.type = parent.headerTypes.ETHERNET;

        var header = new Uint8Array(blob.slice(0,14));


        frame.DestMac = header[0]*2**40 + header[1]*2**32 + header[2]*2**24 + header[3]*2**16 + header[4]*2**8 + header[5];
        frame.DestMacString = arrToMacString(header.subarray(0,6));
        frame.SrcMac = header[6]*2**40 + header[7]*2**32 + header[8]*2**24 + header[9]*2**16 + header[10]*2**8 + header[11];
        frame.SrcMacString = arrToMacString(header.subarray(6,12));

        frame.Payload = blob.slice(14);
        frame.IP = parent.types.Ip(frame.Payload);

        return frame;
    };

    parent.types.Ip = function (blob) {
        var datagram = {};

        datagram.type = parent.headerTypes.IP;

        var header = new Uint8Array(blob.slice(0,20));

        datagram.Version = header[0]>>4;
        datagram.IHL = header[0]&15;
        datagram.DSCP = header[1]>>2;
        datagram.ECN = header[1]&2;
        datagram.Length = header[2]<<8 + header[3];
        datagram.Identification = header[4]<<8 + header[5];
        datagram.Flags = header[6]>>5;
        datagram.FragmentOffset = (header[6]&31)<<8 + header[7];
        datagram.TTL = header[8];
        datagram.Protocol = header[9];
        datagram.Checksum = header[10]<<8 + header[11];
        datagram.SrcIP = header[12].toString() + "." + header[13].toString() + "." + header[14].toString() + "." + header[15].toString();
        datagram.DestIP = header[16].toString() + "." + header[17].toString() + "." + header[18].toString() + "." + header[19].toString();

        datagram.Payload = blob.slice(20);

        return datagram;
    };

    return parent;
}(PCAPNG || {}));