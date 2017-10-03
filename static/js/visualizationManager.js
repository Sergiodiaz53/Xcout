/**
 * Created by Sergio on 2/10/17.
 */

var itemSize = 16,
    cellSize = itemSize - 1,
    margin = {top: 120, right: 20, bottom: 20, left: 200};

var width = 800 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;


function getFullComparisonOf(specieX, specieY){

    var full_comparison;

    $.ajax({
        type:"GET",
        url:"/API/comparison",
        data: {
            'specieX': specieX,
            'specieY': specieY
        },
        success: function(content) {
            full_comparison = JSON.parse(content);
            console.log(full_comparison)
            visualizeFullComparisonFromJSON(full_comparison)
        }
    });
}


function visualizeFullComparisonFromJSON(full_comparison_json) {

    var data = full_comparison_json;

    //Get elements for X and Y Axis
    var x_elements = d3.set(data.map(function( comparison ) { return comparison.specieX + " - " + comparison.chromosomeX_number; } )).values(),
        y_elements = d3.set(data.map(function( comparison ) { return comparison.specieY + " - " + comparison.chromosomeY_number;  } )).values();

    //Set xScale
    var xScale = d3.scale.ordinal()
        .domain(x_elements)
        .rangeBands([0, x_elements.length * itemSize]);

    //Set xAxis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient("top");

    //Set yScale
    var yScale = d3.scale.ordinal()
        .domain(y_elements)
        .rangeBands([0, y_elements.length * itemSize]);

    //Set yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient("left");

    //Set colorScale
    var colorScale = d3.scale.linear()
        .range(['green', 'black','red']) // or use hex values
        .domain([0,50,100]);

    //Create SVG
    var svg = d3.select("svg > g");
    if(svg.empty()){
        svg = d3.select('.heatmap')
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    var cells = svg.selectAll('rect')
        .data(data)
        .enter().append('g').append('rect')
        .attr('class', 'cell')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('y', function(d) { return yScale(d.specieX); })
        .attr('x', function(d) { return xScale(d.specieY); })
        .attr('fill', function(d) { return colorScale(d.score); })
        .on("click", function(d) {
            var string = "";

            if(d3.select(this).classed("clicked")){
                d3.select(this).classed("clicked", false);
                div.transition()
                    .duration(200)
                    .style("opacity", 0);
                div.html(string);
            } else {
                d3.select(this).classed("clicked", true);
                div.transition()
                    .duration(200)
                    .style("opacity", 1);
                var image_path = d.img;
                string = "<img style='height: 100%; width: 100%; object-fit: contain' src=" + image_path + " + />"
                div.html(string)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY + 50) + "px")
                    .style("font-color", "white");
            }

          });

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("max-width", "500px")
        .style("max-height", "500px")
        .style("float", "right")
        .style("margin-right","100px")
        .style("border","solid 1px black");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll('text')
        .attr('font-weight', 'normal');

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".5em")
        .attr("transform", function (d) {
            return "rotate(-65)";
        });
}
