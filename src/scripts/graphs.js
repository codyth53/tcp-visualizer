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

function process10Packets(selector, sender, receiver) {
    var packets = TV.db.getCollection('pairs').chain().simplesort('sendertime')/*.limit(200)*/.data();

    var series = [];
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
        series.push([
            {"x":senderTime,
            "y":sendPos},
            {"x":recerTime,
            "y":recPos}
        ]);
    }

    var WIDTH = 1000,
        HEIGHT = 200,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
        };

    var xScale = d3.scale.linear().range([MARGINS.left, WIDTH-MARGINS.right]).domain([min, max]);
    var yScale = d3.scale.linear().range([HEIGHT-MARGINS.top, MARGINS.bottom]).domain([0,1]);
    var xAxis = d3.svg.axis().scale(xScale);
    var yAxis = d3.svg.axis().scale(yScale).orient("left");
    var zoom = d3.behavior.zoom().x(xScale)/*.y(yScale)*//*.scaleExtent([1,10])*/.on("zoom", zoomed);

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
    /*for (var i=0; i<series.length; i++) {
        var color = 'blue';
        if (series[i][0].y == 1)
            color = 'red';
        vis.append('svg:path').attr('d', lineGen(series[i])).attr('stroke-width', 2).attr('stroke', color).attr('fill', 'none');
    }*/
    vis.selectAll('.line')
        .data(series)
        .enter()
        .append('path')
        .attr("class", "line")
        .attr('stroke-width', 1)
        .attr('stroke', function(d,i){
            return series[i][0].y==1?'red':'blue';
        })
        .attr('d', lineGen);

    function zoomed() {
        vis.select(".x.axis").call(xAxis);
        //vis.select(".y.axis").call(yAxis);
        vis.selectAll('path.line').attr('d', lineGen);
        console.log("I zoomed");
    }
}