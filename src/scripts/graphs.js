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