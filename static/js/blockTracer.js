/**
 * Created by Plabolo on 15/10/18.
 */

function getSelectedChromosomesDictionary(){
    let ret;

    return ret;
}

// Selection Checks
function selectionSpeciesCheck(){
    // Species selection check
    let list_species = getValuesOfDOMObjects(".blockTracerSpecie option:selected");
    return !hasDuplicates(list_species)
}

function selectionChromosomeCheck(){
    // Chromosome selection check
    let dict_values = getValuesOfDOMObjectsByParentKeyID("select.selectpicker option:selected");
    let chromosomes_check = true;
    for(key of Object.keys(dict_values)){
        if(dict_values[key].includes("")) chromosomes_check = false;
    }
    if(Object.keys(dict_values).length != $(".blockTracerSpecie").length) chromosomes_check = false;
    return chromosomes_check;
}

function blockTracerButtonBehavior(){
    if(selectionSpeciesCheck() && selectionChromosomeCheck())
        $('#blockTracerButton').prop("disabled", false);
    else
        $('#blockTracerButton').prop("disabled", true);
}

// Create BlockTracerRow
var BLOCKTRACER_ID = 0;
function addNewblockTracerRow(id, erase=true){
    BLOCKTRACER_ID = BLOCKTRACER_ID+1;
    let newRow = document.createElement('div'),
        newSpecieSelectDiv = document.createElement('div'),
        newChromosomeSelectDiv = document.createElement('div'),
        newButtonDiv = document.createElement('div');

    newRow.className = 'blockTracerRow form-group row col-xs-12';
    newRow.id = "blockTracerRow"+BLOCKTRACER_ID;

    // Create Specie Selection
    newSpecieSelectDiv.className = 'col-xs-3';
    let newSpecieSelect = document.createElement('select');
    newSpecieSelect.id = "blocktracer" + BLOCKTRACER_ID;
    newSpecieSelect.className = "form-control blockTracerSpecie";
    let list_species = getValuesOfDOMObjects("#specieX option"), species_html = '';
    for(specie of list_species){
        species_html += '<option value="' + specie + '">' + specie + '</option>';
    }
    newSpecieSelect.innerHTML = species_html

    // Append Specie Selection
    newSpecieSelectDiv.appendChild(newSpecieSelect);
    newRow.appendChild(newSpecieSelectDiv);

    // Create Chromosome Selection
    newChromosomeSelectDiv.className = 'col-xs-6';
    newChromosomeSelectDiv.innerHTML = '<select id="blocktracer' + BLOCKTRACER_ID + '" multiple class="selectpicker" data-live-search="true" title="Select chromosomes..." data-actions-box="true">'

    // Append Chromosome Selection
    newRow.appendChild(newChromosomeSelectDiv);

    // Create and Append Buttons
    newButtonDiv.className = 'col-xs-3';
    newButtonDiv.innerHTML = '<button id="blocktracer' + BLOCKTRACER_ID + '" type="button" class="btn btn-info" onclick="addNewblockTracerRow(' + BLOCKTRACER_ID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="plus"></bs-glyphicon></button>'
    if(erase==true) newButtonDiv.innerHTML = newButtonDiv.innerHTML + '<button type="button" class="btn btn-warning" onclick="removeBlockTracerRow(' + BLOCKTRACER_ID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="minus"></bs-glyphicon></button>';
    
    newRow.appendChild(newButtonDiv);
    
    // --- Append at index
    document.querySelector('#blockTracerRow'+id).after(newRow);
    // Add behavior
    blockTracerSelectedSpecieBehavior("blocktracer" + BLOCKTRACER_ID);
    blockTracerButtonBehavior();
}

// Remove BlockTracerRow
function removeBlockTracerRow(id){
    $('#blockTracerRow'+id).remove();
    blockTracerButtonBehavior();
}

// Clear all BlockTracerRow
function clearAllBlockTracerRow(){
    $(".blockTracerRow").remove()
    blockTracerButtonBehavior();
}

// Chromosome List Behavior
function chromosomeListBehavior(listChromosomes, blockTracerSpecieID){
    data_string = ""
    for(chromosome of listChromosomes){
        data_string+='<option value="' + chromosome + '">' + chromosome + '</option>'
    }
    $("select.selectpicker#" + blockTracerSpecieID).html(data_string);
    $("select.selectpicker#" + blockTracerSpecieID).selectpicker('refresh');
}

// Selected Specie Request Behavior
function blockTracerSelectedSpecieBehavior(blockTracerSpecieID){
    $.ajax({
        type:"GET",
        url:FORCE_URL+"/API/chromosomes",
        data: {
            'specie': $("#" + blockTracerSpecieID + " option:selected").text()
        },
        success: function(content) {
            list_chromosomes = JSON.parse(content).sort(naturalCompare);
            chromosomeListBehavior(list_chromosomes, blockTracerSpecieID)
        }
    });
}

// Export selected overlay to blocktracer
function exportToBlockTracer(spX, chrX, spY, chrY){
    console.log("Export to BLOCKTRACER"); console.log(spX); console.log(chrX); console.log(spY); console.log(chrY);
    // Check if LOCAL or SERVER
    if(SOURCE_OVERLAY == "SERVER"){
        // Server BlockTrace
        console.log("SERVER")
    }
    else if (SOURCE_OVERLAY == "LOCAL"){
        // Local BlockTrace
        console.log("LOCAL"); alert('BlockTracer not implemented for Local files, yet.')
    }
}

function extractBlockTracerRowSpecie(rowElement){
    return rowElement.children[0].children[0].value;
}

function extractBlockTracerRowsData(){
    let blockTracerRows = document.getElementsByClassName('blockTracerRow');
    let blockTracerSpecies = [];
    [].forEach.call(blockTracerRows, row => { blockTracerSpecies.push(extractBlockTracerRowSpecie(row))} );

    let blockTracerChromosomes = getValuesOfDOMObjectsByParentKeyID("select.selectpicker option:selected");
    blockTracerChromosomes = Object.keys(blockTracerChromosomes).map(function(key){
        return blockTracerChromosomes[key];
    })

    return [blockTracerSpecies, blockTracerChromosomes]
}

// ---------------------------
/* --- BlockTracer Main --- */
// ---------------------------

function executeBlockTracer(){
    console.log("BlockTrace!");
    let data = extractBlockTracerRowsData();
    let species = data[0], chromosomes=data[1]; console.log(data)
    $.ajax({
        type:"POST",
        url:FORCE_URL+"/blocktracer/trace/",
        data: {
            'species': JSON.stringify(species),
            'chromosomes' : JSON.stringify(chromosomes)
        },
        success: function(content) {
            results = JSON.parse(content); console.log(results);
            // PAINT
            paintBlockTracer(species, chromosomes, results.events, results.lengths);
        }
    });
}

// ---------------------------
/* --- BlockTracer Draw --- */
// ---------------------------

function getArrayOfSumsFromDict(array_dict){
    let ret = {};
    Object.entries(array_dict).map(function(key_val){
        let tmp_list = [0], values = Object.values(key_val[1]);
        for(i in values){
            if(i !=0 ) tmp_list.push(Object.values(key_val[1]).slice(0, i).reduce( function(a,b) { return a+b } ));
        }
        ret[key_val[0]] = tmp_list;
    });
    return ret;
}

function getSumOfDictValuesFromDict(array_dict){
    let sums = {}
    Object.entries(array_dict).map(function(key_val){ sums[key_val[0]] = Object.values(key_val[1]).reduce( (a, b) => a + b) });
    return sums;
}

function getMaxOfDictValuesFromDict(array_dict){
    let objects = []
    Object.values(array_dict).map(function(array){ Object.values(array).map( o => objects.push(o) ) })
    return Math.max.apply(Math, Object.values( objects.map(function(o) { return o; }) ))
}

var INTERSPECIE_SPACE = 250;
var INTERCHROMOSOME_SPACE = 50;
var CHROMOSOME_BASELINE_HEIGHT = 5;
var BLOCK_BASE_HEIGHT = 30

function paintBlockTracer(species, chromosomes, events, lengths){
    var MAX_SPECIES_LENGTHS = getSumOfDictValuesFromDict(lengths),
        //MAX_CHROMOSOME_LENGTH = getMaxOfDictValuesFromDict(lengths),
        LENGTH_PREPENDS = getArrayOfSumsFromDict(lengths),
        CHROMOSOMES_PER_SPECIE = Object.values(chromosomes).map( o => o.length),
        MAX_CHROMOSOME_PER_SPECIES = Math.max.apply(Math, Object.values( CHROMOSOMES_PER_SPECIE.map(function(o) { return o; }) )),
        MAX_FULL_LENGTH = getMaxOfDictValuesFromDict({1: MAX_SPECIES_LENGTHS}),
        MINIMUM_CHROMOSOME_PIXELS = 700;
        
    // DEBUG :: 
    //console.log("--- DEBUG1 ---"); console.log(MAX_SPECIES_LENGTHS); console.log(LENGTH_PREPENDS); console.log(CHROMOSOMES_PER_SPECIE); console.log(MAX_CHROMOSOME_PER_SPECIES); console.log(MAX_FULL_LENGTH);
    
    var WIDTH = MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS, // (MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 :
        HEIGHT = species.length*INTERSPECIE_SPACE, //(species.length*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 : 
        MARGINS = {
            top: 50,
            right: 30,
            bottom: 30,
            left: 50
        };

    var WIDTH = WIDTH - MARGINS.left - MARGINS.right,
        HEIGHT = HEIGHT - MARGINS.top - MARGINS.bottom;

    // Clear SVG
    var svg = d3.select(".blocktracer > svg");
    if(!svg.empty()){ svg.remove(); }

    // --------
    //Set xScale
    var xScale= d3.scale.linear()
        .domain([0, MAX_FULL_LENGTH])
        .range([25, WIDTH - (INTERCHROMOSOME_SPACE*MAX_CHROMOSOME_PER_SPECIES) ]);

    //Set xAxis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    //Set yScale
    var yScale = d3.scale.ordinal()
        .domain(species)
        .rangeBands([25, HEIGHT]);

    //Set yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickFormat(function (d) {
            return d;
        });

    // DEBUG ::
    console.log("--- DEBUG2 ---"); console.log(xAxis); console.log(xScale); console.log(yAxis); console.log(yScale); 
    // --------
    // Draw SVG
    svg = d3.select('.blocktracer')
        .append("svg")
        .attr("width", WIDTH + MARGINS.left + MARGINS.right + (INTERCHROMOSOME_SPACE*MAX_CHROMOSOME_PER_SPECIES))
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom + species.length*INTERSPECIE_SPACE)
        .attr("class", 'blocktracer-svg')
        .append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + MARGINS.top + ')');

    // Setup data
    var preparedData = prepareBlockTracerData(species, chromosomes, lengths, events, LENGTH_PREPENDS);
    // DEBUG :: 
    console.log("--- DEBUG3 ---"); console.log(preparedData);
    // ---
    // Draw chromosome lines
    var chromosomeBaseLines = svg.selectAll('rect').filter(".chromosomeBaseline")
        .data(preparedData.baselineData)
        .enter().append('g').append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr('x', function(d) { return  xScale(d.x1)+ INTERCHROMOSOME_SPACE*d.index; })/*s[d.specie]*/
        .attr('y', function(d) { return yScale(d.specie); })
        .attr('width', function(d) { return xScale(d.x2); })/*s[d.specie]*/
        .attr('height', CHROMOSOME_BASELINE_HEIGHT);
    
    // DEBUG :: 
    //console.log("--- DEBUG4 ---"); console.log(chromosomeBaseLines);
    // ---

    // Setup BlockInfo groups
    var tracedBlocks = svg.selectAll('blockInfo')
        .data(preparedData.eventData)
        .enter().append('g').classed('blockInfo', true)

        // Draw blocks
        tracedBlocks.append('rect')
        .attr('class', function(d) { return 'tracedBlock block'+d.block_id} )
        .attr('x', function(d) { return  xScale(d.prepend + d.x1) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })/*s[d.specie] */ 
        .attr('y', function(d) { return yScale(d.specie) + d.y_gap; })
        .attr('width', function(d) { return xScale(d.x2) - xScale(d.x1); })/*s[d.specie]*/
        .attr('height', BLOCK_BASE_HEIGHT)
        .attr('fill', function(d) { return preparedData.colors[d.block_id] })
        .on("click", function(d) {
            if(d3.select(this).classed("clicked")){
                svg.selectAll("rect")
                    .style("opacity", 1)
                    .style("z-index", 10)
                    .classed("clicked", false);

                svg.selectAll('line').filter(".linesBlock")
                    .style("opacity", 0)
            } else {
                d3.select(this).classed("clicked");
                var block_id = d.block_id;
                svg.selectAll("rect").filter(".tracedBlock")
                    .style("opacity", function (d2) { return d2.block_id == block_id ? 1 : 0.3; })
                    .style("z-index", function (d2) { return d2.block_id == block_id ? 10 : 1 })
                    .classed("clicked", function () {
                        if (d3.select(this).style("opacity") == 1) return true;
                        else return false;
                    })

                svg.selectAll('line').filter(".linesBlock")
                    .style("opacity", function (d2) { return d2.block_id == block_id ? 1 : 0; })
                    .classed("clicked", function () {
                        if (d3.select(this).style("opacity") == 1) return true;
                        else return false;
                    })
            }   
        });
    
    // DEBUG :: console.log("--- DEBUG5 ---"); console.log(tracedBlocks);
    // Draw blocks and connection lines
    // Lower blocks
    var STROKE_WIDTH = 6, LINE_BLOCK_DIFF = 10;

    console.log("BOTTOM")
    var bottomLines = svg.selectAll('bottomLine')
        .data(preparedData.bottomLines)
        .enter().append('g').classed('bottomLine', true)
        .append('line')
        .attr("class", function(d) { return "linesBlock linesBlockInfo" + d.block_id })
        .attr('x1', function(d) { return xScale(d.x1 + LENGTH_PREPENDS[d.specie][d.chromoIndex]) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr('x2', function(d) { return xScale(d.x2 + LENGTH_PREPENDS[d.specie][d.chromoIndex]) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr('y1', function(d) { return yScale(d.specie)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .attr('y2', function(d) { return yScale(d.specie)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return preparedData.colors[d.block_id] })
        .style('stroke-width', STROKE_WIDTH);


    // Upper blocks
    console.log("UPPER")
    var upperLines = svg.selectAll('upperLine')
        .data(preparedData.upperLines)
        .enter().append('g').classed('upperLine', true)
        .append('line')
        .attr("class", function(d) { return "linesBlock linesBlockInfo" + d.block_id })
        .attr('x1', function(d) { return xScale(d.x1 + LENGTH_PREPENDS[d.specie][d.chromoIndex]) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr('x2', function(d) { return xScale(d.x2 + LENGTH_PREPENDS[d.specie][d.chromoIndex]) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr('y1', function(d) { return yScale(d.specie)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .attr('y2', function(d) { return yScale(d.specie)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return preparedData.colors[d.block_id] })
        .style('stroke-width', STROKE_WIDTH);


    // Connection lines
    console.log("CONNECT")
    var connectionLines = svg.selectAll('connectLine')
        .data(preparedData.connectionLines)
        .enter().append('g').classed('connectionLines', true)
        .append('line')
        .attr("class", function(d) { return "linesBlock linesBlockInfo" + d.block_id })
        .attr('x1', function(d) { return xScale(d.x1 + LENGTH_PREPENDS[d.specieX][d.chromoXIndex]) + INTERCHROMOSOME_SPACE*(d.chromoXIndex); })
        .attr('x2', function(d) { return xScale(d.x2 + LENGTH_PREPENDS[d.specieY][d.chromoYIndex]) + INTERCHROMOSOME_SPACE*(d.chromoYIndex); })
        .attr('y1', function(d) { return yScale(d.specieX)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .attr('y2', function(d) { return yScale(d.specieY)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return preparedData.colors[d.block_id] })
        .style('stroke-width', STROKE_WIDTH/2);

    // DEBUG :: console.log("--- DEBUG6 ---"); console.log(bottomLines); console.log(upperLines); console.log(connectionLines);

/*
    var ticks_yAxis = svg.append("g")
        .call(yAxis)
        .selectAll('text')
        .attr('font-weight', 'bold')
        .style('font-size', '12px')
        .style('text-anchor', 'end')
        .attr('transform', function (d) {
            return "rotate(-45)";//translate(0,5)
        });
*/
}

function prepareBlockTracerData(species, chromosomes, lengths, events, prepends){
    let baselineData = [], eventData = [], colors = [], bottomLines = [], upperLines = [], connectionLines = [];
    for(specieIndex in species){
        let specie = species[specieIndex],
            chromos = chromosomes[specieIndex],
            added_space = 0;
        for(chrIndex in chromos){
            let chr = chromos[chrIndex]
            curr_len = lengths[specie][chr]
            baselineData.push({'specie': specie, 'x1': added_space, 'x2': curr_len, 'index': parseInt(chrIndex)});
            added_space += curr_len
        }
    }

    for(eventIndex in events){
        event = events[eventIndex]
        for(blockInfoIndex in event){
            let block_info = event[blockInfoIndex]

            let specieXIndex = species.indexOf(block_info.info.spX),
                chrXIndex =  chromosomes[specieXIndex].indexOf(block_info.info.chrX),
                specieYIndex = species.indexOf(block_info.info.spY),
                chrYIndex =  chromosomes[specieYIndex].indexOf(block_info.info.chrY),
                //prependX = (chrXIndex > 0) ? Object.values(lengths[block_info.info.spX]).slice(0, chrXIndex).reduce( function(a,b) { return a+b } ) : 0,
                //prependY = (chrYIndex > 0) ? Object.values(lengths[block_info.info.spY]).slice(0, chrYIndex).reduce( function(a,b) { return a+b } ) : 0,
                x1 = block_info.overlap.x1,
                x2 = block_info.overlap.x2,
                y1 = block_info.overlap.y1,
                y2 = block_info.overlap.y2,
                chrX_y_gap = -BLOCK_BASE_HEIGHT,
                chrY_y_gap = -BLOCK_BASE_HEIGHT;

            let currentCond = (block_info.overlap.inverted == true),
                prevCond = (blockInfoIndex > 0) ? (event[blockInfoIndex-1].overlap.inverted == true) : false;

            if(prevCond){
                if(currentCond) chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT;
                else { chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT; chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT; }
            } else {
                if(currentCond) chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT;
            }

            if(eventIndex == 2) console.log(block_info)
            eventData.push({
                'block_id': eventIndex,
                'specie': block_info.info.spX,
                'chromosome': block_info.info.chrX,
                'x1': x1,//Math.min(x1,x2),
                'x2': x2,//Math.max(x1,x2),
                'len': x2-x1,
                'specieIndex': specieXIndex,
                'chromoIndex': chrXIndex,
                'prepend': prepends[block_info.info.spX][chrXIndex],
                'y_gap': chrX_y_gap
            })

            eventData.push({
                'block_id': eventIndex,
                'specie': block_info.info.spY,
                'chromosome': block_info.info.chrY,
                'x1': y1,//Math.min(y1, y2),
                'x2': y2,//Math.max(y1, y2),
                'len': y2-y1,
                'specieIndex': specieYIndex,
                'chromoIndex': chrYIndex,
                'prepend': prepends[block_info.info.spY][chrYIndex],
                'y_gap': chrY_y_gap
            })

            bottomLines.push({
                'block_id': eventIndex,
                'specie': block_info.info.spX,
                'x1': x1,
                'x2': x2,
                'specieIndex': specieXIndex,
                'chromoIndex': chrXIndex
            })

            upperLines.push({
                'block_id': eventIndex,
                'specie': block_info.info.spY,
                'x1': y1,
                'x2': y2,
                'specieIndex': specieYIndex,
                'chromoIndex': chrYIndex
            });
            
            connectionLines.push({
                'block_id': eventIndex,
                'specieX': block_info.info.spX,
                'specieY': block_info.info.spY,
                'chromoXIndex': chrXIndex,
                'chromoYIndex': chrYIndex,
                'x1': x1 + (x2-x1)/2,
                'x2': y1 + (y2-y1)/2
            });
        }
        colors.push("#" + fullColorHex(R_color[eventIndex], G_color[eventIndex], B_color[eventIndex]));
    }

    return {'baselineData': baselineData, 'eventData': eventData, 'colors': colors, 'bottomLines': bottomLines, 'upperLines': upperLines, 'connectionLines': connectionLines};
}

// ---------------------------

// --- Document Init ---
$(document).ready(function(){
    addNewblockTracerRow(BLOCKTRACER_ID, false);
    document.getElementById('blocktracer1').selectedIndex=1;
    blockTracerSelectedSpecieBehavior("blocktracer0");
    blockTracerSelectedSpecieBehavior("blocktracer1");
});

// --- Document Changes ---
$(document).on('change', '.blockTracerSpecie', function() {
    blockTracerSelectedSpecieBehavior($(this).attr('id'));
    $('#blockTracerButton').prop("disabled", true);
});

$(document).on('changed.bs.select', 'select.selectpicker', function() {
    blockTracerButtonBehavior();
});

/*
    var xAxes = {}, xScales = {}
    // For each Number of Chromosomes per specie, create a new axis
    for(indexSpecie in species){
        let specie = species[indexSpecie]
            numberChromosomes = CHROMOSOMES_PER_SPECIE[indexSpecie],
            currentInterchromosomeSpace = (numberChromosomes-1)*0;


        var xScale= d3.scale.linear()
            .domain([0, MAX_FULL_LENGTH])
            .range([0, WIDTH - currentInterchromosomeSpace]);

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom");

        xScales[specie] = xScale; xAxes[specie] = xAxis;
    }
    */