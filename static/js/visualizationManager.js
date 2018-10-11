/**
 * Created by Sergio and Plabolo on 2/10/17.
 */
var FORCE_URL = "";//"/xcout";

var itemSize = 14,
    cellSize = itemSize - 1,
    margin = {top: 120, right: 20, bottom: 20, left: 200};

var width = 800 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var colorValueLow = 0.25, colorValueHigh = 0.75;
var overlay_threshold = 0.75;
var heatmap_svg;

// Add Comparison to Comparison Table/List
function addComparisonToComparisonList(specieX, specieY){
    var newRow = "<tr><td class='specieX_name'>"+specieX+"</td><td>vs</td><td class='specieY_name'>"+specieY+"</td><td><button class='btn btn-md btn-danger removeButton'><bs-glyphicon icon='remove'></bs-glyphicon></bs-glyphicon></button></td>'";

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

        getFullComparisonOf(specieX, specieY);
    });
}

// Get all Comparisons Info in Comparison Table
function getFullComparisonOf(specieX, specieY){
    var comparisonJson = [];
    for (var i = 0; i<specieX.length; i++){
        auxComparison  = {
            specieX: specieX[i],
            specieY: specieY[i]
        }
        
        if(!localSpecieCheck(specieX[i])){
            addComparisonToComparisonList(specieX[i], specieY[i]);
            comparisonJson.push(auxComparison)
        }
    }
    requestPaintComparisons(comparisonJson);
}

// Paint Ajax Request
function requestPaintComparisons(comparisonJson){
    $.ajax({
        type:"GET",
        url:FORCE_URL+"/API/comparison",
        data: {
            'comparisons': JSON.stringify(comparisonJson)
        },
        success: function(content) {
            full_comparison = JSON.parse(content); SERVER_COMPARISON = full_comparison;
            SERVER_LOADED = (full_comparison.length > 1) ? true : false;
            visualizeFullComparisonFromJSON(full_comparison)
        }
    });
}

// Visualize all Comparison Info
function visualizeFullComparisonFromJSON(full_comparison_json = [], local_comparison_json = []) {
    if(LOCAL_LOADED && !(local_comparison_json.length > 0)) local_comparison_json = LOCAL_COMPARISON;
    if(SERVER_LOADED && !(full_comparison_json.length > 0)) full_comparison_json = SERVER_COMPARISON;
    console.log('Visualize!')

    var data = full_comparison_json.concat(local_comparison_json);// console.log(data)

    // Clear Sidemenu
    emptier('comparisonData');
    hider('comparisonInfo');
    $(".heatmap").html('');

    //Create SVG
    var svg = d3.select("svg > g");
    if(!svg.empty()){
        d3.select("svg").remove();
    }

    //Get elements for X,Y and UpperLevelXYAxis
    var x_elements = d3.set(data.map(function( comparison ) {return comparison.specieX + " - " + comparison.chromosomeX_number; } )).values(),
        y_elements = d3.set(data.map(function( comparison ) {return comparison.specieY + " - " + comparison.chromosomeY_number;  } )).values();
    var speciesX_numbers = {}, speciesY_numbers = {};

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

    //Calculate OverlayCell positions
    var curr_ind = 0;
    for(specie of Object.keys(speciesX_numbers)) {
        curr_ind += speciesX_numbers[specie];
        text = specie + " - Overlay";
        x_elements.splice(curr_ind, 0, text);
        speciesX_numbers[specie] = speciesX_numbers[specie]+1; curr_ind+=1;
    }

    curr_ind = 0;
    for(specie of Object.keys(speciesY_numbers)) {
        curr_ind += speciesY_numbers[specie];
        text = specie + " - Overlay";
        y_elements.splice(curr_ind, 0, text);
        speciesY_numbers[specie] = speciesY_numbers[specie]+1; curr_ind+=1;
    }

    // Add overlay to data
    let specieX = [], specieY = [], score;

    $('#comparisonList .specieX_name').each(function() { specieX.push($(this).html()) });
    $('#comparisonList .specieY_name').each(function() { specieY.push($(this).html()) });

    for(i in specieX){
        let currX = specieX[i], currY = specieY[i], items_x, items_y;
        
        for(tick_x of x_elements){
            items_x = tick_x.split(" - ");
            if(items_x[0] == currX && items_x[1] == "Overlay"){
                for(tick_y of y_elements){
                    items_y = tick_y.split(" - ");
                    if(items_y[0] == currY && items_x[0]==items_y[0]) score = -20; else score = -10;
                    if(items_y[0] == currY && items_y[1] != "Overlay"){
                        data.push({
                            specieX:items_x[0], specieY:items_y[0], 
                            chromosomeX_number:items_x[1], chromosomeY_number:items_y[1],
                            img:"none", score:score
                        })
                    }
                }
            }
        }

        for(tick_y of y_elements){
            items_y = tick_y.split(" - ");
            if(items_y[0] == currY && items_y[1] == "Overlay"){
                for(tick_x of x_elements){
                    items_x = tick_x.split(" - ");
                    if(items_x[0] == currX && items_x[0]==items_y[0]) score = -20; else score = -10;
                    if(items_x[0] == currX && items_x[1] != "Overlay"){
                        data.push({
                            specieX:items_x[0], specieY:items_y[0], 
                            chromosomeX_number:items_x[1], chromosomeY_number:items_y[1],
                            img:"none", score:score
                        })
                    }
                }
            }
        }
    }
    // -------------
    // --- Paint ---
    // -------------
    
    // Set cell size
    width = itemSize * Object.values(speciesX_numbers).reduce((a, b) => a + b, 0);
    height = itemSize * Object.values(speciesY_numbers).reduce((a, b) => a + b, 0);

    // Clear Overlay (if exists)
    d3.select("body").append("div")
        .attr("class", "tooltip_score")
        .style("opacity", 0);

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
        // PLABOLO + SERGIURO + 3ST3B4NF0RM5T.CSw CERTIFIED
        .range(['red', 'red', 'green','white']) // or use hex values
        .domain([0, colorValueLow, colorValueHigh, 1]);

    // --------------
    // Draw SVG
    svg = d3.select('.heatmap')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    heatmap_svg = d3.select('.heatmap > svg');
    // Draw axis
    var ticks_y_axis = svg.append("g")
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
        .style('font-size', '14px')
        .style('text-anchor', 'middle')
        .attr('transform', function (d) {
            return "translate(-140,100)rotate(-90)";
        });

    var ticks_x_axis = svg.append("g")
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
        .style('font-size', '12px')
        .attr('font-weight', 'normal')
        .attr('transform', function (d) {
            return "translate(100,-100)";
        });

    // Clear and Define the div for the tooltip
    d3.selectAll('.tooltip_score').remove();

    var tooltip_score = d3.select("body").append("div")
        .attr("class", "tooltip_score")
        .style("opacity", 0);

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
        // Tooltip + Axis highlighting :: ON
        .on("mouseover", function(d) {
            if(d.score >= 0){	
                tooltip_score.transition()		
                    .duration(200)
                    .style("opacity", .9);
                    tooltip_score.html(d.score) //) + "<br/>"  + d.close)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            
            }
            for(x_tick of ticks_x_axis[0]){
                if(x_tick.innerHTML == d.specieX + " - " + d.chromosomeX_number){
                    tick_dom = d3.select(x_tick);
                    tick_dom.style('font-size','12')
                        .attr('font-weight', 'bold');
                }
            }
            
            for(y_tick of ticks_y_axis[0]){
                if(y_tick.innerHTML == d.specieY + " - " + d.chromosomeY_number){
                    tick_dom = d3.select(y_tick);
                    tick_dom.style('font-size','12')
                        .attr('font-weight', 'bold');
                }
            }
        })
        // Tooltip + Axis highlighting :: OFF	
        .on("mouseout", function(d) {		
            tooltip_score.transition()		
                .duration(500)		
                .style("opacity", 0);

            for(x_tick of ticks_x_axis[0]){
                if(x_tick.innerHTML == d.specieX + " - " + d.chromosomeX_number){
                    tick_dom = d3.select(x_tick);
                    tick_dom.style('font-size','9')
                        .attr('font-weight', 'normal');
                }
            }
            
            for(y_tick of ticks_y_axis[0]){
                if(y_tick.innerHTML == d.specieY + " - " + d.chromosomeY_number){
                    tick_dom = d3.select(y_tick);
                    tick_dom.style('font-size','9')
                        .attr('font-weight', 'normal');
                }
            }
        })
        // On cell click behavior
        .on("click", function(d) {
            hider("comparisonInfo");
            
            if (d.score != -20){
                var string = "";
                var data_string = '<div class="horizontal-line"></div><button type="button" class="btn btn-warning btn-md pull-right" \
                        onclick="clearSidemenuSelection()">\
                        <bs-glyphicon icon="menu-down"></bs-glyphicon></button>\
                    <table id="infoTable" class="table table-bordered table-hover"> \
                        <tr> \
                            <th scope="row">X Axis</th> \
                            <td>' + d.specieX + ' - Chromosome: ' + d.chromosomeX_number + '</td> \
                        </tr> \
                        <tr> \
                            <th scope="row">Y Axis</th> \
                            <td>' + d.specieY + ' - Chromosome: ' + d.chromosomeY_number + '</td> \
                        </tr> \
                    '

                var div = $("#comparisonPreview");
                d3.select(this).classed("clicked", true);
                if(d.score == -10) {
                    overlayOn();
                    spinnerOn("Creating image...");
                    let sp_x = d.specieX, sp_y = d.specieY
                    let chr_x = d.chromosomeX_number, chr_y = d.chromosomeY_number;

                    if(localSpecieCheck(d.specieX)){
                        // Overlay local
                        readLocalEvents(sp_x, sp_y, chr_x, chr_y, overlay_threshold, data_string);
                        
                    } else {
                        // Overlay server
                        serverOverlayEvents(sp_x, sp_y, chr_x, chr_y, data_string);
                    }
                    div.removeClass('comparisonPreview');
                    overlayOff();
                    spinnerOff();
                }
                else{
                    div.addClass('comparisonPreview');
                    clearDivIdSVG("comparisonOverlay"); clearOverlay();
                    // Add comparison data
                    data_string += '<tr> \
                            <th scope="row">Score</th> \
                            <td>' + d.score + '</td> \
                        </tr> \
                    </table> \
                    '
                    //"<h3>Score: "  + d.score + "</h3>";
                    $("#comparisonData").html(data_string);

                    // Add image
                    if(localSpecieCheck(d.specieX)){
                        loadLocalImage(local_data.pngs.find(function(png){ return png.name == d.img }));
                    } else{
                        var image_path = d.img;
                        string = "<img style='height: 100%; width: 100%; object-fit: contain' src=" + image_path + " + />"
                        div.html(string);
                    }
                }
            }
        });

    checkSpeciesTable();
    showAlert("Loaded", "Comparison loaded", "info");
}
// Ajax request about server events
function serverOverlayEvents(sp_x, sp_y, chr_x, chr_y, data_string) {
    CURRENT_OVERLAY_INFORMATION = {
        'sp_x': sp_x,
        'sp_y': sp_y,
        'chr_x': chr_x,
        'chr_y': chr_y,
        'data_string': '',
    }
    $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/overlay",
        data: {
            'specieX': sp_x,
            'specieY': sp_y,
            'chromosomeX': chr_x,
            'chromosomeY': chr_y,
            'threshold': overlay_threshold,
            'overlay_max': OVERLAY_NUMBER_MAX
        },
        success: function (content) {
            response = JSON.parse(content);
            // Add comparison data -- HEADER
            $("#comparisonData").html(data_string);
            // Add image -- EVENTS METHOD
            let chromosome_numbers = [];
            let colors = [...new Set(response.events.map(item => item.color))];
            for (url of response.urls) {
                chromosome_numbers.push(imgUrlParser(url, response.base_axis));
            }
            CURRENT_OVERLAY = {
                'events': response.events,
                'max_x': response.max_x,
                'max_y': response.max_y,
                'lengths': response.lengths,
                'base_axis': response.base_axis,
                'chromosome_numbers': chromosome_numbers,
                'colors': colors
            };
            overlayComparisonEvents(response.events, response.max_x, response.max_y, response.lengths, response.base_axis, chromosome_numbers, colors);
            shower("comparisonInfo");
            $("#collapseOverlay").collapse("show");
        },
        error: function (error) {
            response = error.responseJSON;
            showAlert("Error", response.message, "danger");
        }
    });
}

function overlayComparisonEvents(events, max_x, max_y, lengths, base_axis, chromosome_numbers, colors, filter=false){
    var WIDTH = 455,
        HEIGHT = 495,
        MARGINS = {
            top: 15,
            right: 15,
            bottom: 55,
            left: 55
        };
    var WIDTH = WIDTH - MARGINS.left - MARGINS.right,
        HEIGHT = HEIGHT - MARGINS.top - MARGINS.bottom;

    var stroke_width = 2, axis_decimals = 2;
    ACTIVE_OVERLAY = true;

    // Clear Sidemenu
    var comparisonPreview = $("#comparisonPreview");
    comparisonPreview.html('');
    comparisonPreview.removeClass('comparisonPreview');

    if(base_axis == 'Y') [max_x, max_y] =  [max_y, max_x];

    // Clear SVG
    var svg = d3.select("#comparisonOverlay > svg");
    if(!svg.empty()){
        svg.remove();
    }

    //Set xScale
    var xScale = d3.scale.linear()
        .domain([0,max_x])
        .range([0, WIDTH]);
    //Set xAxis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat(function (d) {
            return (d!=0) ? pairbaseNotation(d, axis_decimals) : 0;
        });

    //Set yScale
    var yScale = d3.scale.linear()
        .domain([0,max_y])
        .range([0, HEIGHT]);

    //Set yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickFormat(function (d) {
            return (d!=0) ? pairbaseNotation(d, axis_decimals) : 0;
        });

    // Create SVG
    svg = d3.select('#comparisonOverlay')
        .append("svg")
        .attr("width", WIDTH + MARGINS.left + MARGINS.right)
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
        .attr("class", 'comparisonOverlay')
        .append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + MARGINS.top + ')');
       
    // Paint Events
    var event_lines;
    if(base_axis = 'X'){
        event_lines = svg.selectAll('line')
            .data(events).enter()
            .append('g').append('line')
            .attr('y1', function(d) { return yScale(scaleEventParam(lengths[d.cmp], d.x1)); })
            .attr('x1', function(d) { return xScale(scaleEventParam(max_x,d.y1)); })
            .attr('y2', function(d) { return yScale(scaleEventParam(lengths[d.cmp], d.x2)); })
            .attr('x2', function(d) { return xScale(scaleEventParam(max_x,d.y2)); })
            .attr('data-legend', function(d) { return chromosome_numbers[d.cmp] })
            .style('stroke', function(d){ return d.color })
            .style('stroke-width', stroke_width)
            .style('z-index', 110);
    }else{
        event_lines = svg.selectAll('line')
            .data(events).enter()
            .append('g').append('line')
            .attr('y1', function(d) { return yScale(scaleEventParam(max_x,d.y1)); })
            .attr('x1', function(d) { return xScale(scaleEventParam(lengths[d.cmp], d.x1)); })
            .attr('y2', function(d) { return yScale(scaleEventParam(max_x,d.y2)); })
            .attr('x2', function(d) { return xScale(scaleEventParam(lengths[d.cmp], d.x2)); })
            .attr('data-legend', function(d) { return chromosome_numbers[d.cmp] })
            .style('stroke', function(d){ return d.color })
            .style('stroke-width', stroke_width)
            .style('z-index', 110);
    }

    var ticks_xAxis = svg.append("g")
        /*.attr('transform', function (d) {
            return "translate(" + MARGINS.left + ",0)";
        })*/
        .call(yAxis)
        .selectAll('text')
        .attr('font-weight', 'bold')
        .style('font-size', '12px')
        .style('text-anchor', 'end')
        .attr('transform', function (d) {
            return "translate(-7,0)rotate(-45)";
        });
    
    var ticks_yAxis = svg.append("g")
        .attr('transform', function (d) {
            return "translate(0," + (HEIGHT) + ")";
        })
        .call(xAxis)
        .selectAll('text')
        .attr('font-weight', 'bold')
        .style('font-size', '12px')
        .style('text-anchor', 'end')
        .attr('transform', function (d) {
            return "rotate(-45)";//translate(0,5)
        });

    // X axis label
    svg.append('text')
        .attr("transform", "translate(" + (WIDTH / 2) + " ," + (HEIGHT + 3*MARGINS.bottom/4) + ")")
        .style("text-anchor", "middle")
        .attr('font-weight', 'bold')
        .style('font-size', '13px')
        .text("Mbp");

    // Y axis label
    svg.append('text')
        .attr("transform", "rotate(-90)translate(" + (0 - HEIGHT / 2) + " ," + (0 - 3*MARGINS.left/4) + ")")
        .style("text-anchor", "middle")
        .attr('font-weight', 'bold')
        .style('font-size', '13px')
        .text("Mbp");

    // Legend
    if(!filter){
        let string = ""
        for(chr_i in chromosome_numbers){
            if(chr_i % 4 == 0)
                string+="<div>";
            string += "<div onclick='remakeOverlayFiltered(" + chr_i + ")' class='legendChromosome" + chr_i +"' style='background-color: " + colors[chr_i] + ";'>&emsp;</div>"
                + "<div onclick='remakeOverlayFiltered(" + chr_i + ")' class='legendChromosome" + chr_i +"'>" + chromosome_numbers[chr_i][1] + "</div>";
            if((chr_i-3) % 4 == 0)
                string+="</div>";
        }
        $("#collapseOverlayInfo").html(string);
    }
    
    var tooltip_event = d3.select("body").append("div")
        .attr("class", "tooltip_event")
        .style("opacity", 0);
        
    // Behaviour
    event_lines
        // Tooltip :: ON
        .on("mouseover", function(d) {
            let event_info = "From: " + chromosome_numbers[d.cmp][0] + " - " + chromosome_numbers[d.cmp][1];


            if(base_axis = 'X'){
                event_info += "</br>x1 : " + scaleEventParam(max_x,d.y1).toLocaleString()
                event_info += "</br>y1 : " + scaleEventParam(lengths[d.cmp], d.x1).toLocaleString()
                event_info += "</br>x2 : " + scaleEventParam(max_x,d.y2).toLocaleString();
                event_info += "</br>y2 : " + scaleEventParam(lengths[d.cmp], d.x2).toLocaleString()
            }else{
                event_info += "</br>x1 : " + scaleEventParam(lengths[d.cmp], d.x1).toLocaleString()
                event_info += "</br>y1 : " + scaleEventParam(max_x,d.y1).toLocaleString()
                event_info += "</br>x2 : " + scaleEventParam(lengths[d.cmp], d.x2).toLocaleString()
                event_info += "</br>y2 : " + scaleEventParam(max_x,d.y2).toLocaleString()
            }

            tooltip_event.transition()		
                .duration(200)
                .style("opacity", .9);
                tooltip_event.html(event_info)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

            d3.select(this)
                .style('stroke-width', stroke_width*2);
        })
        // Tooltip :: OFF	
        .on("mouseout", function(d) {		
            tooltip_event.transition()		
                .duration(500)		
                .style("opacity", 0);
            
            d3.select(this)
                .style('stroke-width', stroke_width);
        })

    // --- Create Grid
    // Add the X gridlines
    svg.selectAll("line.horizontalGrid").data(yScale.ticks(ticks_xAxis[0].length)).enter()
        .append("line")
        .attr(
        {
            "class":"horizontalGrid",
            "x1" : 0,
            "x2" : WIDTH,
            "y1" : function(d){ return yScale(d);},
            "y2" : function(d){ return yScale(d);},
            "fill" : "none",
            "shape-rendering" : "crispEdges",
            "stroke" : "lightgrey",
            "stroke-width" : "1px",
            'stroke-opacity' : '0.6'
        });
    
    // Add the Y gridlines
    svg.selectAll("line.verticalGrid").data(xScale.ticks(ticks_yAxis[0].length)).enter()
        .append("line")
        .attr(
        {
            "class":"horizontalGrid",
            "x1" : function(d){ return xScale(d);},
            "x2" : function(d){ return xScale(d);},
            "y1" : 0,
            "y2" : HEIGHT,
            "fill" : "none",
            "shape-rendering" : "crispEdges",
            "stroke" : "lightgrey",
            "stroke-width" : "1px",
            'stroke-opacity' : '0.6',
        });
}

// Repaint Overlay
let CURRENT_OVERLAY = {}, FILTERED_CHROMOSOMES = [];
function remakeOverlayFiltered(filterChromosomeIndex){
    if(FILTERED_CHROMOSOMES.includes(filterChromosomeIndex)){
        FILTERED_CHROMOSOMES.splice(FILTERED_CHROMOSOMES.indexOf(filterChromosomeIndex), 1);
        $(".legendChromosome" + filterChromosomeIndex).removeClass('filtered-legend');
    } else {
        FILTERED_CHROMOSOMES.push(filterChromosomeIndex);
        $(".legendChromosome" + filterChromosomeIndex).addClass('filtered-legend');
    }
    
    let base_axis = CURRENT_OVERLAY.base_axis,
        events = CURRENT_OVERLAY.events.filter(function(el){
            return !FILTERED_CHROMOSOMES.includes(el.cmp)
        }),
        lengths = CURRENT_OVERLAY.lengths.filter(function(el, ind){
            return !FILTERED_CHROMOSOMES.includes(ind)
        }),
        chromosome_numbers = CURRENT_OVERLAY.chromosome_numbers.filter(function(el, ind){
            return !FILTERED_CHROMOSOMES.includes(ind)
        }),
        colors = CURRENT_OVERLAY.colors.filter(function(el, ind){
            return !FILTERED_CHROMOSOMES.includes(ind)
        }),
        max_x = (base_axis=='X') ? CURRENT_OVERLAY.max_x : Math.max.apply(Math, lengths.map(function(o) { return o; })),
        max_y = (base_axis=='Y') ? CURRENT_OVERLAY.max_y : Math.max.apply(Math, lengths.map(function(o) { return o; }));
    
    overlayComparisonEvents(events, max_x, max_y, CURRENT_OVERLAY.lengths, base_axis, CURRENT_OVERLAY.chromosome_numbers, CURRENT_OVERLAY.colors, true)
        
}

// Automatic Threshold (Plabolize) to automatically understand EPW Scores
function getScoresThreshold(){
    var tmp = getLoadedSpecies(),
        specieX = tmp.specieX,
        specieY = tmp.specieY;

    var comparisonJson = [];
    for (var i = 0; i<specieX.length; i++){
        auxComparison  = {
            specieX: specieX[i],
            specieY: specieY[i]
        }
        
        if(!localSpecieCheck(specieX[i])){
            addComparisonToComparisonList(specieX[i], specieY[i]);
            comparisonJson.push(auxComparison)
        }
    }

    // Get scores
    let local_scores = [];

    for(local_cmp of LOCAL_COMPARISON){
        local_scores.push(parseFloat(local_cmp.score));
    }
    $.ajax({
        type:"POST",
        url:FORCE_URL+"/API/color_threshold/",
        data: {
            'comparisons': JSON.stringify(comparisonJson),
            'local_scores': JSON.stringify(local_scores)
        },
        success: function(content) {
            thresholds = JSON.parse(content); console.log(thresholds);
            let color_slider = $("#color_slider").bootstrapSlider();
            // ESTEBAN PEREZ W0HLFEIL ( *100)
            color_slider.bootstrapSlider('setValue', [thresholds.red*100,thresholds.green*100]);
            colorValueLow = thresholds.red;
            colorValueHigh = thresholds.green;

            // Repaint
            requestPaintComparisons(comparisonJson);
        }
    });
}

// Fit heatmap canvas to screen
function fitToScreen() {
    var svg = $(".heatmap > svg"),
        heatmap = $(".heatmap");

	var bb=svg[0].getBBox();
	var bbx=bb.x
	var bby=bb.y
	var bbw=bb.width
	var bbh=bb.height
	//---center of graph---
	var cx=bbx+.5*bbw
	var cy=bby+.5*bbh
    //---create scale: ratio of desired width/height vs current width/height--
	var width_total = heatmap.width();
    var height_total = heatmap.height();

    var curr_width = svg.width();
    var curr_height = svg.height();

    var scaleX = width_total/curr_width; //--if height use myHeight/bbh--
    var scaleY = height_total/curr_height;
    let scale;
    if(scaleX < scaleY) scale=scaleX; else scale=scaleY
	//---where to move it center of my pane--- (cx)*scale + 
	var targetX=500
	var targetY=200
	//---move its center to target x,y --- translate("+transX+" "+transY+")
	var transX=cx*(scale-1)
    var transY=cy*(scale-1)

	svg[0].setAttribute("transform","translate("+transX+","+transY+")scale("+scale+","+scale+")")
}