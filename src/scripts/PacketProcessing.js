/**
 * Created by Cody on 11/8/2016.
 */

var TV = (function (parent) {

    parent.receiver = "receiver";
    parent.sender = "sender";

    parent.db = new loki('loki.json');

    parent.importPackets = function(packets, name) {
        var collection = parent.db.addCollection(name);

        for (var i=0; i<packets.length; i++) {
            if (packets[i].type == PCAPNG.blockTypes.ENHANCEDPACKET) {
                collection.insert({
                    id: i,
                    time: packets[i].Timestamp,
                    src: packets[i].Frame.IP.SrcIP,
                    dest: packets[i].Frame.IP.DestIP,
                    seq: packets[i].Frame.IP.TCP.SeqNum,
                    ack: packets[i].Frame.IP.TCP.AckNum,
                    isack: (packets[i].Frame.IP.TCP.ACK == 1)?true:false,
                    issyn: (packets[i].Frame.IP.TCP.SYN == 1)?true:false
                });
            }
        }
    };

    parent.matchPackets = function(sendIP, receiveIP) {
        var sendColl = parent.db.getCollection(parent.sender);
        var recColl = parent.db.getCollection(parent.receiver);
        var matchedColl = parent.db.addCollection('pairs');

        //find time offset for receiver
        var sender = sendColl.chain().simplesort('time');
        var firstPacket = sender.copy().find({'src':{'$eq':sendIP}}).data()[0];
        var secondPacket = sender.copy().find({'src':{'$eq':receiveIP}}).data()[0];
        var averageTime = (firstPacket.time + secondPacket.time) / 2;
        var otherPacket = recColl.chain().simplesort('time').find({'src':{'$eq':sendIP}}).data()[0];
        var offsetTime = Math.round(averageTime - otherPacket.time);

        var sendSent = sendColl.chain().find({'src':{'$eq':sendIP}}).simplesort('time');
        var recRec = recColl.chain().find({'dest':{'$eq':receiveIP}}).simplesort('time');

        var sendSentData = sendSent.data();
        for (var i=0; i<sendSentData.length; i++) {
            var time = sendSentData[i].time;
            var seq = sendSentData[i].seq;
            var ack = sendSentData[i].ack;

            var match = recRec.copy().find({'$and':[{'seq':{'$eq':seq}},{'ack':{'$eq':ack}}]}).data();
            if (!match || match.length == 0) {
                console.log("recRec packet " + i.toString() + " could not be matched");
                continue;
            }

            matchedColl.insert({
                fromip: sendSentData[i].src,
                toip: sendSentData[i].dest,
                senttime: sendSentData[i].time,
                rectime: match[0].time + offsetTime,
                sendertime: sendSentData[i].time,
                sendid: sendSentData[i].id,
                recid: match[0].id,
                sender: sendSentData[i],
                receiver: match[0]
            });
        }

        var recSent = recColl.chain().find({'src':{'$eq':receiveIP}}).simplesort('time');
        var sendRec = sendColl.chain().find({'dest':{'$eq':sendIP}}).simplesort('time');

        var recSentData = recSent.data();
        for (var i=0; i<recSentData.length; i++) {
            var time = recSentData[i].time;
            var seq = recSentData[i].seq;
            var ack = recSentData[i].ack;

            var match = sendRec.copy().find({'$and':[{'seq':{'$eq':seq}},{'ack':{'$eq':ack}}]}).data();
            matchedColl.insert({
                fromip: recSentData[i].src,
                toip: recSentData[i].dest,
                senttime: recSentData[i].time + offsetTime,
                rectime: match[0].time,
                sendertime: match[0].time,
                sendid: match[0].id,
                recid: recSentData[i].id,
                sender: match[0],
                receiver: recSentData[i]
            });
        }
    };

    return parent;

}(TV || {}));