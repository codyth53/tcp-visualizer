/**
 * Created by Cody on 11/8/2016.
 */

var TV = (function (parent) {

    var receiver = "receiver";
    var sender = "sender";

    parent.db = new loki('loki.json');

    parent.importPackets = function(packets, name) {
        var collection = db.addCollection(name);

        for (var i=0; i<packets.length; i++) {
            collection.insert({
                time: packets.Timestamp,
                src: packets.Frame.IP.SrcIP,
                dest: packets.Frame.IP.DestIP,
                seq: packets.Frame.IP.TCP.SeqNum,
                ack: packets.Frame.IP.TCP.AckNum,
                isack: (packets.Frame.IP.TCP.ACK == 1)?true:false
            })
        }
    };

    parent.matchPackets = function(sendIP, receiveIP) {
        var sendColl = parent.db.getCollection(sender);
        var recColl = parent.db.getCollection(receiver);
        var matchedColl = parent.db.addCollection('pairs');

        var sendSent = sendColl.find({'src':{'$eq':sendIP}}).simplesort('time');
        var recRec = recColl.find({'dest':{'$eq':receiveIP}}).simplesort('time');

        var sendSentData = sendSent.data();
        for (var i=0; i<sendSentData.length; i++) {
            var time = sendSentData[i].time;
            var match = recRec.find({'time':{'$gt':time}}, true).data()[0];

            matchedColl.insert({
                fromip: sendSentData[i].src,
                toip: sendSentData[i].dest,
                senttime: sendSentData[i].time,
                rectime: match.time
            });
        }

        var recSent = recColl.find({'src':{'$eq':receiveIP}}).simplesort('time');
        var sendRec = sendColl.find({'dest':{'$eq':sendIP}}).simplesort('time');

        var recSentData = recSent.data();
        for (var i=0; i<recSentData.length; i++) {
            var time = recSentData[i].time;
            var match = sendRec.find({'time':{'%gt':time}},true).data()[0];

            matchedColl.insert({
                fromip: recSentData[i].src,
                toip: recSentData[i].dest,
                senttime: recSentData[i].time,
                rectime: match.time
            });
        }
    }

}(TV || {}));