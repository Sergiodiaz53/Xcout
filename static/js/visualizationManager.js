/**
 * Created by Sergio on 2/10/17.
 */

var itemSize = 14,
    cellSize = itemSize - 1,
    margin = {top: 120, right: 20, bottom: 20, left: 200};

var width = 800 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var colorValueLow = 0.25, colorValueHigh = 0.75;
var overlay_threshold = 0.75

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

    //Get number of chromosomes for specie
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

    //Calculate OverlayBox positions
    var curr_ind = 0;
    for(specie of Object.keys(speciesX_numbers)) {
        text = specie + " - Overlay";
        x_elements.splice(speciesX_numbers[specie] + curr_ind, 0, text);
        speciesX_numbers[specie] = speciesX_numbers[specie]+1;
        curr_ind = speciesX_numbers[specie];
    }

    curr_ind = 0;
    for(specie of Object.keys(speciesY_numbers)) {
        text = specie + " - Overlay";
        y_elements.splice(speciesY_numbers[specie] + curr_ind, 0, text);
        speciesY_numbers[specie] = speciesY_numbers[specie]+1;
        curr_ind = speciesX_numbers[specie];
    }
    console.log("X_ELEMENTS :: " + x_elements.length + " || Y_ELEMENTS :: " + y_elements.length)

    // Add overlay to data
    for(tick_x of x_elements){
        let items_x = tick_x.split(" - ");

        if(items_x[1] == "Overlay"){
            for(tick_y of y_elements){
                let score, items_y = tick_y.split(" - ");
                if(items_x[0]==items_y[0]) score = -20; else score = -10;

                if(items_y[1] != "Overlay"){
                    data.push({
                        chromosomeX_number:items_x[1],
                        chromosomeY_number:items_y[1],
                        img:"none",
                        score:score,
                        specieX:items_x[0],
                        specieY:items_y[0]
                    })
                }
            }
        }

    }

    for(tick_y of y_elements){
        let items_y = tick_y.split(" - ");

        if(items_y[1] == "Overlay"){
            for(tick_x of x_elements){
                let score, items_x = tick_x.split(" - ");
                if(items_x[0]==items_y[0]) score = -20; else score = -10;
                if(items_x[1] != "Overlay"){
                    data.push({
                        chromosomeX_number:items_x[1],
                        chromosomeY_number:items_y[1],
                        img:"none",
                        score:score,
                        specieX:items_x[0],
                        specieY:items_y[0]
                    });
                }
            }
        }

    }

    // --- Paint ---

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

    var blueColor = d3.scale.linear()
        .domain([-15, -5])  
        .range(["blue", "blue"]);

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
        .attr('x', function(d) {return xScale(d.specieX + " - " + d.chromosomeX_number); })
        .attr('y', function(d) {return yScale(d.specieY + " - " + d.chromosomeY_number); })
        .attr('fill', function(d) {
            if(d.score == -10) return "#0099cc";
            else if(d.score == -20) return "white";
            else return colorScale(d.score); 
        })
        .on("click", function(d) {
            overlayOn();
            spinnerOn("Creating image...");
            collapser("collapseOverlay");
            hider("comparisonInfo");
            
            if (d.score != -20){
                var string = "";
                var div = $("#comparisonPreview");
                d3.select(this).classed("clicked", true);
                
                if(d.score == -10) {
                    let sp_x = d.specieX, sp_y = d.specieY
                    let chr_x = d.chromosomeX_number, chr_y = d.chromosomeY_number;
                    $.ajax({
                        type:"GET",
                        url:"/API/overlay",
                        data: {
                            'specieX': sp_x,
                            'specieY': sp_y,
                            'chromosomeX': chr_x,
                            'chromosomeY': chr_y,
                            'threshold': overlay_threshold
                        },
                        success: function(content)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  {
                            response = JSON.parse(content)
                            tmp_test = response;
                            string = "<img style='height: 100%; width: 100%; object-fit: contain' src='data:image/jpeg;base64, " + response.img + "' />";
                            div.html(string);
                            toggler("comparisonInfo");
                            
                            let chr_n, color;
                            let rows = [];
                            for(i in response.urls){
                                chr_n = imgUrlParser(response.urls[i], response.overlay_axis, response.inverted)
                                if(i == 0)
                                    color = "black";
                                else
                                    color = response.color[i-1]//rgb(response.color_r[i-1], response.color_g[i-1], response.color_b[i-1]);
                                
                                rows.push([color, chr_n]);
                            }

                            string = ""
                            for(row in rows){
                                if(row % 5 == 0)
                                    string+='';
                                string += "<tr\> <th scope='row' bgcolor='" + row[0] + "'> </th> <td>" + row[1] + "</td> </tr>"
                            }
                            $("#collapseOverlayInfo").html(string)
                        }
                    });
                }
                else{
                    var image_path = d.img;
                    string = "<img style='height: 100%; width: 100%; object-fit: contain' src=" + image_path + " + />"
                    div.html(string)
                }
                overlayOff();
                spinnerOff();
            }
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

    //showAlert("Loaded", "Comparison loaded", "Success")
}
var tmp_test;
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

function fitToScreen() {
    var svg = $(".heatmap > svg")[0];

	var bb=svg.getBBox();
	var bbx=bb.x
	var bby=bb.y
	var bbw=bb.width
	var bbh=bb.height
	//---center of graph---
	var cx=bbx+.5*bbw
	var cy=bby+.5*bbh
    //---create scale: ratio of desired width vs current width--
	var width=390 //---desired width (or height)
	var scale=width/bbw //--if height use myHeight/bbh--
	//---where to move it center of my pane---
	var targetX=200
	var targetY=200
	//---move its center to target x,y ---
	var transX=(-cx)*scale + targetX
	var transY=(-cy)*scale + targetY
	svg.setAttribute("transform","translate("+transX+" "+transY+")scale("+scale+" "+scale+")")


}