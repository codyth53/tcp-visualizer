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
                    issyn: (packets[i].Frame.IP.TCP.SYN == 1)?true:false,
                    tcplen: packets[i].Frame.IP.Length
                });
            }
        }
    };

    parent.normalizePackets = function(realSrc, realDst, otherSrc, otherDst) {
        var sendColl = parent.db.getCollection(parent.sender);
        var recColl = parent.db.getCollection(parent.receiver);
        var sender = sendColl.chain().simplesort('time').limit(3).data();
        var recer = recColl.chain().simplesort('time').limit(3).data();
        var midSend = (sender[1].time + sender[2].time) / 2;
        var midRec = (recer[1].time + recer[2].time) / 2;
        var offset = Math.round(midSend - midRec);
        var sendSeqOffset = sender[1].seq - recer[1].seq;
        var recSeqOffset = sender[0].seq - recer[0].seq;

        var baseTime = Math.min(sendColl.min('time'), recColl.min('time') + offset);
        
        var sendAll = sendColl.data;
        for (var i=0; i<sendAll.length; i++) {
            var item = sendAll[i];
            item.time -= baseTime;
            sendColl.update(item);
        }

        var recAll = recColl.data;
        for (var i=0; i<recAll.length; i++) {
            var item = recAll[i];
            item.time -= baseTime;
            item.time += offset;
            if (item.src == otherSrc) {
                item.src = realSrc;
                item.dest = realDst;
                item.seq += sendSeqOffset;
                item.ack += recSeqOffset;
            } else {
                item.src = realDst;
                item.dest = realSrc;
                item.seq += recSeqOffset;
                item.ack += sendSeqOffset;
            }
            recColl.update(item);
        }
    }

    parent.matchPackets = function(sendIP, receiveIP) {
        var sendColl = parent.db.getCollection(parent.sender);
        var recColl = parent.db.getCollection(parent.receiver);
        var matchedColl = parent.db.addCollection('pairs');

        var sendSent = sendColl.chain().find({'src':{'$eq':sendIP}}).simplesort('time');
        var recRec = recColl.chain().find({'dest':{'$eq':receiveIP}}).simplesort('time');

        var sendSentData = sendSent.data();
        for (var i=0; i<sendSentData.length; i++) {
            var time = sendSentData[i].time;
            var seq = sendSentData[i].seq;
            var ack = sendSentData[i].ack;
            var tcplen = sendSentData[i].tcplen;

            var match = recRec.copy().find({'$and':[{'seq':{'$eq':seq}},{'ack':{'$eq':ack}},{'tcplen':{'$eq':tcplen}}]}).data();
            if (!match || match.length == 0) {
                console.log("sendSent packet " + i.toString() + " could not be matched");
                continue;
            }

            matchedColl.insert({
                fromip: sendSentData[i].src,
                toip: sendSentData[i].dest,
                senttime: sendSentData[i].time,
                rectime: match[0].time,
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
            var tcplen = recSentData[i].tcplen;

            var match = sendRec.copy().find({'$and':[{'seq':{'$eq':seq}},{'ack':{'$eq':ack}},{'tcplen':{'$eq':tcplen}}]}).data();
            if (!match || match.length == 0) {
                console.log("sendRec packet " + i.toString() + " could not be matched");
                continue;
            }
            matchedColl.insert({
                fromip: recSentData[i].src,
                toip: recSentData[i].dest,
                senttime: recSentData[i].time,
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