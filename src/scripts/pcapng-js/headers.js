/**
 * Created by Cody on 11/6/2016.
 */
var PCAPNG = (function (parent) {


    parent.headerTypes = {
        ETHERNET:1
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

        return frame;
    };

    return parent;
}(PCAPNG || {}));