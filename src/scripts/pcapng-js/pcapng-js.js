/**
 * Created by Cody on 10/20/2016.
 */

var PCAPNG = (function (parent) {

    parent.getBlocks = function (blob) {
        var byte = 0;
        var blocks = [];

        while (byte < blob.byteLength) {
            var block = {};

            //Block Type
            var type = blob.slice(byte, byte+4);
            type = new Uint32Array(type);
            block.type = type[0];
            byte += 4;

            //Block Total Length
            var size = blob.slice(byte, byte+4);
            size = new Uint32Array(size);
            size = size[0];
            size = size/4 - 3;
            block.size = size;
            byte += 4;

            //Block Body
            var body = blob.slice(byte, byte + size*4);
            //body = new Uint32Array(body);
            block.body = body;
            byte += size*4;

            //Block Total Length
            byte += 4;

            blocks.push(block);

        }

        return blocks;
    };

    parent.processPcapng = function (blob) {
        var blocks = parent.getBlocks(blob);
        var processed = [];

        for (var i=0; i<blocks.length; i++){
            var type;
            switch (blocks[i].type)
            {
                case parent.blockTypes.INTERFACEDESCRIPTION:
                    type = parent.types.InterfaceDescription;
                    break;
                case parent.blockTypes.PACKET:
                    type = parent.types.Packet;
                    break;
                case parent.blockTypes.SIMPLEPACKET:
                    type = parent.types.SimplePacket;
                    break;
                case parent.blockTypes.NAMERESOLUTION:
                    type = parent.types.NameResolution;
                    break;
                case parent.blockTypes.INTERFACESTATISTICS:
                    type = parent.types.InterfaceStatistics;
                    break;
                case parent.blockTypes.ENHANCEDPACKET:
                    type = parent.types.EnhancedPacket;
                    break;
                default:
                    type = function (blah) {return null;};
                    break;
            }

            var block = type(blocks[i].body);
            if (block != null) processed.push(block);
        }

        return processed;
    };


    return parent;
}(PCAPNG || {}));