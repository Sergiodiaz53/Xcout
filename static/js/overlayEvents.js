/**
 * Created by Plabolo on 15/10/18.
 */

// Overlay Top select
var OVERLAY_NUMBER_FILTER = false, OVERLAY_NUMBER_MAX='0', ACTIVE_OVERLAY=false, SOURCE_OVERLAY="";
var CURRENT_OVERLAY_INFORMATION = {
    'sp_x': '',
    'sp_y': '',
    'chr_x': '',
    'chr_y': '',
    'data_string': '',
}

 // Ajax request about server events
function serverOverlayEvents(sp_x, sp_y, chr_x, chr_y, data_string) {
    CURRENT_OVERLAY_INFORMATION = {
        'sp_x': sp_x,
        'sp_y': sp_y,
        'chr_x': chr_x,
        'chr_y': chr_y,
        'data_string': data_string,
    }; SOURCE_OVERLAY = "SERVER";

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
    if(!svg.empty()){ svg.remove(); }

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

// Overlay by number behavior
function numberChromosomesChecked(){
    var inputCheckbox = document.getElementById('numberChromosomesCheck');
    var inputText = document.getElementById('numberChromosomes');

    if(inputCheckbox.checked){
        inputText.disabled = false; inputText.focus();
        $('#threshold_slider').bootstrapSlider('disable');
    }
    else{
        inputText.disabled=true;
        $('#threshold_slider').bootstrapSlider('enable');
        OVERLAY_NUMBER_MAX='0'
    }

    if(ACTIVE_OVERLAY == true && OVERLAY_NUMBER_MAX!='0' && SOURCE_OVERLAY == "SERVER")
        serverOverlayEvents(CURRENT_OVERLAY_INFORMATION.sp_x, CURRENT_OVERLAY_INFORMATION.sp_y, CURRENT_OVERLAY_INFORMATION.chr_x, CURRENT_OVERLAY_INFORMATION.chr_y, CURRENT_OVERLAY_INFORMATION.data_string);
    else if(ACTIVE_OVERLAY == true && OVERLAY_NUMBER_MAX!='0' && SOURCE_OVERLAY == "LOCAL")
        readLocalEvents(CURRENT_OVERLAY_INFORMATION.sp_x, CURRENT_OVERLAY_INFORMATION.sp_y, CURRENT_OVERLAY_INFORMATION.chr_x, CURRENT_OVERLAY_INFORMATION.chr_y, overlay_threshold, CURRENT_OVERLAY_INFORMATION.data_string);
}

// Bind to behavior to DOM
$('#numberChromosomes').bind("enterKey",function(e){
    OVERLAY_NUMBER_MAX=$(this).val();
    //let inputChecked = document.getElementById('numberChromosomesCheck').checked;

    if(ACTIVE_OVERLAY == true && OVERLAY_NUMBER_MAX!="0" && SOURCE_OVERLAY == "SERVER")
        serverOverlayEvents(CURRENT_OVERLAY_INFORMATION.sp_x, CURRENT_OVERLAY_INFORMATION.sp_y, CURRENT_OVERLAY_INFORMATION.chr_x, CURRENT_OVERLAY_INFORMATION.chr_y, CURRENT_OVERLAY_INFORMATION.data_string);
    else if(ACTIVE_OVERLAY == true && OVERLAY_NUMBER_MAX!='0' && SOURCE_OVERLAY == "LOCAL")
        readLocalEvents(CURRENT_OVERLAY_INFORMATION.sp_x, CURRENT_OVERLAY_INFORMATION.sp_y, CURRENT_OVERLAY_INFORMATION.chr_x, CURRENT_OVERLAY_INFORMATION.chr_y, overlay_threshold, CURRENT_OVERLAY_INFORMATION.data_string);
});

$('#numberChromosomes').keyup(function(e){
    if(e.keyCode == 13)
        $(this).trigger("enterKey");
});