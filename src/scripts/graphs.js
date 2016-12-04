/**
 * Created by Cody on 10/9/2016.
 */

function generateLineGraph(data, container) {
    var x = d3.scale.linear()
        .range([0, d3.max(data)], 1);

    var y = d3.scale.linear()
        .range([0,100], 10);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var chart = d3.select(container)
        .attr("width", 500)
        .attr("height", 500)
        .append("g");
}

function displayPackets(selector, sender, receiver) {
    var packets = TV.db.getCollection('pairs').chain().simplesort('sendertime')/*.limit(200)*/.data();
    var combColl = TV.db.getCollection('combine').chain().simplesort('senttime');

    var tofromSeries = [];
    var min=Number.MAX_VALUE;
    var max = 0;
    for (var i=0; i<packets.length; i++) {
        var sendPos = (packets[i].fromip === sender)?0:1;
        var recPos = (packets[i].fromip === sender)?1:0;
        var senderTime = packets[i].senttime;
        var recerTime = packets[i].rectime;
        min = (min<packets[i].senttime)?min:packets[i].senttime;
        max = (max>packets[i].senttime)?max:packets[i].senttime;
        min = (min<packets[i].rectime)?min:packets[i].rectime;
        max = (max>packets[i].rectime)?max:packets[i].rectime;
        tofromSeries.push([
            {"x":senderTime,
            "y":sendPos},
            {"x":recerTime,
            "y":recPos}
        ]);
    }

    var lostOnly = [];
    var lost = TV.db.getCollection('lost').chain().simplesort('sendertime').data();
    console.log("There are " + lost.length + " lost packets");
    for (var i=0; i<lost.length; i++) {
        var sendPos = (lost[i].fromip === sender)?0:1;
        var recPos = 0.5;
        var senderTime = lost[i].senttime;
        var recTime = lost[i].halftime;
        lostOnly.push([
            {"x":senderTime,
            "y":sendPos},
            {"x":recTime,
            "y":recPos}
        ]);
    }

    var tofromLostSeries = tofromSeries.concat(lostOnly);

    var inflightSeries = [];
    var minSeq = 0;
    var maxSeq = 0;
    var maxFlight = 0;
    for (var i=1; i<packets.length; i++) {
        var time = packets[i].sendertime;
        if (packets[i].fromip === sender) {
            maxSeq = Math.max(maxSeq, packets[i].sender.seq + packets[i].sender.tcplen);
        } else {
            minSeq = Math.max(minSeq, packets[i].sender.ack);
        }
        if (maxSeq-minSeq >= 0)
            inflightSeries.push(
                {"x":time,
                "y": maxSeq-minSeq}
            );
        maxFlight = Math.max(maxFlight, maxSeq-minSeq);
    }


    var combined = combColl.copy().data();
    var sentTotalSeries = [];
    var recTotalSeries = [];
    var ackSentTotalSeries = [];
    var ackRecTotalSeries = [];
    var maxSent = 0;
    var maxRec = 0;
    var maxAckSent = 0;
    var maxAckRec = 0;
    var tempCollection = TV.db.addCollection('temp');
    combined.forEach(function(blob, i) {
        if ("pair" in blob) {
            var packet = blob.pair;
            if (packet.fromip === sender) {
                maxSent = Math.max(maxSent, packet.sender.seq + packet.sender.tcplen);
                var blob = {
                    "x": packet.senttime,
                    "y": maxSent
                };
                sentTotalSeries.push(blob);
                tempCollection.insert(blob);

                maxRec = Math.max(maxRec, packet.receiver.seq + packet.receiver.tcplen);
                blob = {
                    "x": packet.rectime,
                    "y": maxRec
                };
                recTotalSeries.push(blob);
                tempCollection.insert(blob);
            } else if (packet.toip === sender) {
                maxAckSent = Math.max(maxAckSent, packet.sender.ack);
                var blob = {
                    "x": packet.senttime,
                    "y": maxAckSent
                };
                ackSentTotalSeries.push(blob);
                tempCollection.insert(blob);

                maxAckRec = Math.max(maxAckRec, packet.receiver.ack);
                blob = {
                    "x": packet.rectime,
                    "y": maxAckRec
                };
                ackRecTotalSeries.push(blob);
                tempCollection.insert(blob);
            }
        } else if ("lost" in blob) {
            var packet = blob.lost;
            if (packet.fromip === sender) {
                maxSent = Math.max(maxSent, packet.sender.seq + packet.sender.tcplen);
                var blob = {
                    "x": packet.senttime,
                    "y": maxSent
                };
                sentTotalSeries.push(blob);
                tempCollection.insert(blob);
            } else {
                maxAckSent = Math.max(maxAckSent, packet.sender.ack);
                var blob = {
                    "x": packet.senttime,
                        "y": maxAckSent
                };
                ackSentTotalSeries.push(blob);
                tempCollection.insert(blob);
            }
        }

    });
    var tempColl = TV.db.getCollection('temp').chain().simplesort('x');

    var WIDTH = 1000,
        HEIGHT = 200,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
        };

    //shared
    var xScale = d3.scale.linear().range([MARGINS.left, WIDTH-MARGINS.right]).domain([min, max]);
    var xAxis = d3.svg.axis().scale(xScale);
    var zoom = d3.behavior.zoom().x(xScale)/*.y(yScale)*//*.scaleExtent([1,10])*/.on("zoom", zoomed);

    //Main graph
    var yScale = d3.scale.linear().range([HEIGHT-MARGINS.top, MARGINS.bottom]).domain([0,1]);
    var yAxis = d3.svg.axis().scale(yScale).orient("left");

    var vis = d3.select(selector).call(zoom).append("svg")
        .call(zoom)
        .attr("width", WIDTH + MARGINS.left + MARGINS.right)
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
        .append("g")
        .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
        .call(zoom);

    vis.append("svg:g").attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")").attr("class", "x axis").call(xAxis);
    vis.append("svg:g").attr("transform", "translate(" + (MARGINS.left) + ",0)").attr("class", "y axis").call(yAxis);

    var lineGen = d3.svg.line().x(function(d) {return xScale(d.x)}).y(function(d) {return yScale(d.y)});
    vis.selectAll('.line')
        .data(tofromLostSeries)
        .enter()
        .append('path')
        .attr("class", "line")
        .attr('stroke-width', 1)
        .attr('stroke', function(d,i){
            if (tofromLostSeries[i][1].y == 0.5) return 'red';
            return tofromLostSeries[i][0].y==1?'green':'blue';
        })
        .attr('d', lineGen);

    var pointsMain = vis.selectAll('.dots')
        .data(tofromLostSeries)
        .enter()
        .append("g")
        .attr("class", "dots")
        .attr("clip-path", "url(#clip)");
    pointsMain.selectAll('.dot')
        .data(function(d,index) {
            var a = [];
            d.forEach(function(point, i){
                a.push({'index':index,'point':point});
            });
            return a;
        })
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', function(d,i){
            return (d.point.y==0.5)?5:2;
        })
        .attr('fill', function(d,i){
            if (d.point.y == 0.5) return 'red';
            return d.point.y==1?'green':'blue';
        })
        .attr('transform', function(d) {
            return "translate("+xScale(d.point.x)+","+yScale(d.point.y)+")";
        });

    //Inflight Graph
    var inflight = d3.select("#inflight").call(zoom).append("svg")
        .call(zoom)
        .attr("width", WIDTH + MARGINS.left + MARGINS.right)
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
        .append("g")
        .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
        .call(zoom);

    var yScale2 = d3.scale.linear().range([HEIGHT-MARGINS.top, MARGINS.bottom]).domain([0,maxFlight]);
    var yAxis2 = d3.svg.axis().scale(yScale2).orient("left");

    inflight.append("svg:g").attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")").attr("class", "x axis").call(xAxis);
    inflight.append("svg:g").attr("transform", "translate(" + (MARGINS.left) + ",0)").attr("class", "y axis").call(yAxis2);
    var lineGen2 = d3.svg.line().x(function(d) {return xScale(d.x)}).y(function(d) {return yScale2(d.y)});

    inflight
        .append('path')
        .datum(inflightSeries)
        .attr("class", "line")
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('d', lineGen2);

    //SeqAck graph
    var yScale3 = d3.scale.linear().range([HEIGHT-MARGINS.top, MARGINS.bottom]).domain([0,Math.max(maxSent, maxRec, maxAckRec, maxAckSent)]);
    var yAxis3 = d3.svg.axis().scale(yScale3).orient("left");

    var seqAckVis = d3.select('#seqack').call(zoom).append("svg")
        .call(zoom)
        .attr("width", WIDTH + MARGINS.left + MARGINS.right)
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
        .append("g")
        .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
        .call(zoom);

    seqAckVis.append("svg:g").attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")").attr("class", "x axis").call(xAxis);
    seqAckVis.append("svg:g").attr("transform", "translate(" + (MARGINS.left) + ",0)").attr("class", "y axis").call(yAxis3);

    var lineGen3 = d3.svg.line().x(function(d) {return xScale(d.x)}).y(function(d) {return yScale3(d.y)});
    seqAckVis.selectAll('.line')
        .data([sentTotalSeries,recTotalSeries,ackSentTotalSeries,ackRecTotalSeries])
        .enter()
        .append('path')
        .attr("class", "line")
        .attr('stroke-width', 1)
        .attr('stroke', function(d,i){
            return ['red','blue','green','orange'][i];
        })
        .attr('d', lineGen3);

    function zoomed() {
        vis.select(".x.axis").call(xAxis);
        vis.selectAll('path.line').attr('d', lineGen);
        pointsMain.selectAll('circle').attr("transform", function(d) {
            return "translate("+xScale(d.point.x)+","+yScale(d.point.y)+")";
        });
        inflight.select(".x.axis").call(xAxis);
        inflight.selectAll('path.line').attr('d', lineGen2);

        var scale = xScale.domain();
        var combFilter = tempColl.copy().find({x: {'$gte': scale[0]}}).find({x: {'$lte': scale[1]}}).data();
        var yMin = combFilter[0].y - 100;
        var yMax = combFilter[combFilter.length-1].y + 100;
        yScale3.domain([yMin, yMax]);
        seqAckVis.select(".x.axis").call(xAxis);
        seqAckVis.select(".y.axis").call(yAxis3);
        seqAckVis.selectAll('path.line').attr('d', lineGen3);
        console.log("I zoomed");
    }
}