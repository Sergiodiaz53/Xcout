/**
 * Created by Sergio on 2/10/17.
 */

var itemSize = 8,
    cellSize = itemSize - 1,
    margin = {top: 120, right: 20, bottom: 20, left: 200};

var width = 800 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var colorValueLow = 0.25, colorValueHigh = 0.75;

function getFullComparisonOf(specieX, specieY){

    var full_comparison;

    comparisonJson = [];
    for (var i = 0; i<specieX.length; i++){
        auxComparison  = {
            specieX: specieX[i],
            specieY: specieY[i]
        }
        addComparisonToComparisonList(specieX[i], specieY[i]);
        comparisonJson.push(auxComparison)
    }

    $.ajax({
        type:"GET",
        url:"/API/comparison",
        data: {
            'comparisons': JSON.stringify(comparisonJson)
        },
        success: function(content) {
            full_comparison = JSON.parse(content);
            console.log(full_comparison);
            visualizeFullComparisonFromJSON(full_comparison)
        }
    });
}

function visualizeFullComparisonFromJSON(full_comparison_json) {

    var data = full_comparison_json;

    var speciesX_numbers = {};
    var speciesY_numbers = {};


    //Get elements for X,Y and UpperLevelXYAxis
    var x_elements = d3.set(data.map(function( comparison ) {return comparison.specieX + " - " + comparison.chromosomeX_number; } )).values(),
        y_elements = d3.set(data.map(function( comparison ) {return comparison.specieY + " - " + comparison.chromosomeY_number;  } )).values();

    for (var i = 0, j = x_elements.length; i < j; i++) {
       speciesX_numbers[x_elements[i].split(" - ")[0]] = (speciesX_numbers[x_elements[i].split(" - ")[0]] || 0) + 1;
    }

    for (var i = 0, j = y_elements.length; i < j; i++) {
       speciesY_numbers[y_elements[i].split(" - ")[0]] = (speciesY_numbers[y_elements[i].split(" - ")[0]] || 0) + 1;
    }

    //Sorting elements and axis
    x_elements.sort(naturalCompare);
    y_elements.sort(naturalCompare);
    speciesX_numbers = sortObject(speciesX_numbers);
    speciesY_numbers = sortObject(speciesY_numbers);

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

    //Set upperLevelxScale
    var previousValues = 0;
    var upperLevelxScale = d3.scale.ordinal()
        .domain(Object.keys(speciesX_numbers))
        .range((function(){
            var values = Object.values(speciesX_numbers).map(function(x){
                previousValues += (x * itemSize);
                return previousValues});
            values.unshift(0);
            return values;
        })());


    //Set upperLevelxAxis
    var upperLevelxAxis = d3.svg.axis()
        .scale(upperLevelxScale)
        .orient("top");

    //Set yScale
    var yScale = d3.scale.ordinal()
        .domain(y_elements)
        .rangeBands([0, y_elements.length * itemSize]);

    //Set yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //Set upperLevelyScale
    previousValues = 0;
    var upperLevelyScale = d3.scale.ordinal()
        .domain(Object.keys(speciesY_numbers).sort())
        .range((function(){
            var values = Object.values(speciesY_numbers).map(function(x){
                previousValues += (x * itemSize);
                return previousValues});
            values.unshift(0);
            return values;
        })());

    //Set upperLevelyAxis
    var upperLevelyAxis = d3.svg.axis()
        .scale(upperLevelyScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient("left");

    //Set colorScale
    var colorScale = d3.scale.linear()
        .range(['red', 'green','green','white']) // or use hex values
        .domain([0,colorValueLow,colorValueHigh,1]);

    //Create SVG
    var svg = d3.select("svg > g");
    if(!svg.empty()){
        d3.select("svg").remove();
    }

    width = itemSize * Object.values(speciesX_numbers).reduce((a, b) => a + b, 0);
    height = itemSize * Object.values(speciesY_numbers).reduce((a, b) => a + b, 0);
    svg = d3.select('.heatmap')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var cells = svg.selectAll('rect')
        .data(data)
        .enter().append('g').append('rect')
        .attr('class', 'cell')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', function(d) { return xScale(d.specieX + " - " + d.chromosomeX_number); })
        .attr('y', function(d) { return yScale(d.specieY + " - " + d.chromosomeY_number); })
        .attr('fill', function(d) { return colorScale(d.score); })
        .on("click", function(d) {
            var string = "";
            var div = $("#comparisonPreview");
            d3.select(this).classed("clicked", true);
            var image_path = d.img;
            string = "<img style='height: 100%; width: 100%; object-fit: contain' src=" + image_path + " + />"
            div.html(string)
          });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll('text')
        .style('font-size', '10px')
        .attr('font-weight', 'normal');

    svg.append("g")
        .attr("class", "y axis")
        .call(upperLevelyAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .style('font-size', '10px')
        .style('text-anchor', 'middle')
        .attr('transform', function (d) {
            return "translate(-140,100)rotate(-90)";
        });

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .style('font-size', '9px')
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", "1.3em")
        .attr("transform", function (d) {
            return "rotate(-90)";
        });

    svg.append("g")
        .attr("class", "x axis")
        .call(upperLevelxAxis)
        .selectAll('text')
        .style('font-size', '10px')
        .attr('font-weight', 'normal')
        .attr('transform', function (d) {
            return "translate(100,-100)";
        });

    showAlert("Loaded", "Comparison loaded", "Success")
}

function addComparisonToComparisonList(specieX, specieY){
    var newRow = "<tr><td class='specieX_name'>"+specieX+"</td><td>vs</td><td class='specieY_name'>"+specieY+"</td><td><button class='btn btn-md btn-danger glyphicon glyphicon-remove removeButton'></button></td>'";


    //If comparison doesn't exists, add it.
    if(!$('#comparisonList tr > td:contains('+specieX+') + td:contains(vs) + td:contains('+specieY+')').length) $("#comparisonList").find("tbody").append(newRow)

    $(".removeButton").click(function(){
        $(this).closest("tr").remove();

        var specieX = [],
            specieY = [];

        $('#comparisonList .specieX_name').each(function() {
            specieX.push($(this).html())
        });

        $('#comparisonList .specieY_name').each(function() {
            specieY.push($(this).html())
        });

        getFullComparisonOf(specieX, specieY)
    });
}

function getComparisonFromLocalFile(){


}