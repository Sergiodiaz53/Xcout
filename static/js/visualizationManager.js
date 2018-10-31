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
        
        clearSidemenuSelection();
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
    var svg = d3.select(".heatmap > svg > g");
    if(!svg.empty()){ d3.select("svg").remove(); }

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
        curr_ind += speciesX_numbers[specie]; text = specie + " - Overlay"; x_elements.splice(curr_ind, 0, text);
        speciesX_numbers[specie] = speciesX_numbers[specie]+1; curr_ind+=1;
    }

    curr_ind = 0;
    for(specie of Object.keys(speciesY_numbers)) {
        curr_ind += speciesY_numbers[specie]; text = specie + " - Overlay"; y_elements.splice(curr_ind, 0, text);
        speciesY_numbers[specie] = speciesY_numbers[specie]+1; curr_ind+=1;
    }

    // Add overlay to data
    let specieX = [], specieY = [], score;

    $('#comparisonList .specieX_name').each(function() { specieX.push($(this).html()) });
    $('#comparisonList .specieY_name').each(function() { specieY.push($(this).html()) });

    for(i in specieX){
        let currX = specieX[i], currY = specieY[i], items_x, items_y;
        
        for(tick_x of x_elements){
            items_x = tick_x.split(" - "); if(items_x[0] == currX && items_x[1] == "Overlay"){
                for(tick_y of y_elements){ items_y = tick_y.split(" - ");
                    if(items_y[0] == currY && items_x[0]==items_y[0]) score = -20; else score = -10;
                    if(items_y[0] == currY && items_y[1] != "Overlay") data.push({ specieX:items_x[0], specieY:items_y[0], chromosomeX_number:items_x[1], chromosomeY_number:items_y[1], img:"none", score:score })
                }
            }
        }

        for(tick_y of y_elements){
            items_y = tick_y.split(" - "); if(items_y[0] == currY && items_y[1] == "Overlay"){
                for(tick_x of x_elements){ items_x = tick_x.split(" - ");
                    if(items_x[0] == currX && items_x[0]==items_y[0]) score = -20; else score = -10;
                    if(items_x[0] == currX && items_x[1] != "Overlay") data.push({ specieX:items_x[0], specieY:items_y[0],  chromosomeX_number:items_x[1], chromosomeY_number:items_y[1], img:"none", score:score })
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

    // Clear Tooltip (if exists)
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
                var data_string = '<div class="horizontal-line"></div>\
                <button type="button" class="btn btn-primary btn-md pull-left" onclick=\'exportToBlockTracer("' + d.specieX + '","' + d.chromosomeX_number + '","' + d.specieY + '","' + d.chromosomeY_number + '")\'>Export to BlockTracer\
                        <bs-glyphicon icon="export"></bs-glyphicon></button>\
                <button type="button" class="btn btn-warning btn-md pull-right" onclick="clearSidemenuSelection()">\
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