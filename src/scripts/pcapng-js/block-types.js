/**
 * Created by Cody on 10/20/2016.
 */

var PCAPNG = (function (parent) {


    parent.blockTypes = {
        SECTIONHEADER: 168627466,
        INTERFACEDESCRIPTION: 1,
        PACKET: 2,
        SIMPLEPACKET: 3,
        NAMERESOLUTION: 4,
        INTERFACESTATISTICS: 5,
        ENHANCEDPACKET:6
    };

    parent.types = parent.types || {};

    parent.types.SectionHeader = function (uintArray) {
        var packet = {};

        packet.type = parent.blockTypes.SECTIONHEADER;

        packet.ByteOrderMagic = uintArray[0];
        packet.MajorVersion = uintArray[1] >> 16;
        packet.MinorVersion = uintArray[1] & 65535;
        packet.SectionLength = uintArray[2] * 2^32 + uintArray[3];

        return packet;
    }

    parent.types.InterfaceDescription = function (blob) {
        var type = parent.blockTypes.INTERFACEDESCRIPTION;
    };

    parent.types.Packet = function (blob) {
        var type = parent.blockTypes.PACKET;
    };

    parent.types.SimplePacket = function (blob) {
        var type = parent.blockTypes.SIMPLEPACKET;
    };

    parent.types.NameResolution = function (blob) {
        var type = parent.blockTypes.NAMERESOLUTION;
    };

    parent.types.InterfaceStatistics = function (blob) {
        var type = parent.blockTypes.INTERFACESTATISTICS;
    };

    parent.types.EnhancedPacket = function (blob) {
        var packet = {};

        packet.type = parent.blockTypes.ENHANCEDPACKET;

        var header = new Uint32Array(blob.slice(0,20));


        packet.InterfaceId = header[0];
        packet.Timestamp = header[1] * 2^32 + header[2];
        packet.CapturedPacketLength = header[3];
        packet.PacketLength = header[4];

        packet.Data = blob.slice(20, 20 + packet.CapturedPacketLength);
        packet.Frame = parent.types.Ethernet(packet.Data);

        return packet;
    };


    return parent;
}(PCAPNG || {}));