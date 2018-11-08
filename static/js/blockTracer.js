/**
 * Created by Plabolo on 15/10/18.
 */

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
    // console.log("Export to BLOCKTRACER"); console.log(spX); console.log(chrX); console.log(spY); console.log(chrY);
    // Check if LOCAL or SERVER
    let changeIndex = 0;
    if(SOURCE_OVERLAY == "SERVER"){
        // Server BlockTrace
        console.log("SERVER")
        let blockTracerRows = [], specieSelects = [], chromosomeSelects = [];
        $(".blockTracerRow").each( function(i, d) { if(i == changeIndex || i == changeIndex+1) blockTracerRows.push(d.id[d.id.length-1]) });
        
        for(blockTracerIndex in blockTracerRows){
            let selects = $("select#blocktracer" + blockTracerIndex)
                specieSelect = $(selects[0]),
                chromosomeSelect = $(selects[1]);

            specieSelects.push(specieSelect); chromosomeSelects.push(chromosomeSelect);
            chromosomeSelect.selectpicker();
            let values = [];

            if(blockTracerIndex == changeIndex){
                specieSelect.val(spX)
                values = (chrX != "Overlay") ? [chrX] : CURRENT_OVERLAY.chromosome_numbers.map(x => x[1])
            } 
            if(blockTracerIndex == changeIndex+1){
                specieSelect.val(spY)
                values = (chrY != "Overlay") ? [chrY] : CURRENT_OVERLAY.chromosome_numbers.map(x => x[1])
            }

            chromosomeSelect.selectpicker('val',values)
        }
    }
    else if (SOURCE_OVERLAY == "LOCAL"){
        // Local BlockTrace
        console.log("LOCAL"); alert('BlockTracer not implemented for Local files, yet.')
    }
}

function getOverlayChromosomeArray(){
    return []
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

var BLOCK_TRACER_PARAMS = {'species': [], 'chromosomes': [], 'results': {}}

function executeBlockTracer(){
    let data = extractBlockTracerRowsData();
    let species = data[0], chromosomes=data[1], emptyCheck = document.getElementById('emptyChromosomesCheck').checked; console.log(data)

    overlayOn();
    spinnerOn("Tracing Blocks...");

    if(BLOCK_TRACER_PARAMS.species.toString() == species.toString() && BLOCK_TRACER_PARAMS.chromosomes.toString() == chromosomes.toString()){
        let currSpecies = $.extend(true, [], BLOCK_TRACER_PARAMS.species), currChromosomes = $.extend(true, [], BLOCK_TRACER_PARAMS.chromosomes),
            currResults = $.extend(true, {}, BLOCK_TRACER_PARAMS.results);
        
        if(emptyCheck) emptyChromosomesCheck(currSpecies, currChromosomes, currResults.lengths, currResults.non_empty);
        // PAINT
        paintBlockTracer(currSpecies, currChromosomes, currResults.events, currResults.lengths, $("#verticalBT").hasClass('active'));
    }
    else $.ajax({
        type:"POST",
        url:FORCE_URL+"/blocktracer/trace/",
        data: {
            'species': JSON.stringify(species),
            'chromosomes' : JSON.stringify(chromosomes)
        },
        success: function(content) {
            results = JSON.parse(content); console.log(results);
            BLOCK_TRACER_PARAMS = {'species': $.extend(true, [], species), 'chromosomes':  $.extend(true, [], chromosomes), 'results':  $.extend(true, {}, results)}

            if(emptyCheck) emptyChromosomesCheck(species, chromosomes, results.lengths, results.non_empty);

            paintBlockTracer(species, chromosomes, results.events, results.lengths, $("#verticalBT").hasClass('active'));
            showAlert("Loaded", "BlockTracer succesfully finished", "info");
        }
    });
}

function emptyChromosomesCheck(species, chromosomes, lengths, non_empty) {
    let non_empty_list = [];

    for (resultsExists of non_empty) { let items = resultsExists.split(' - '); non_empty_list.push([items[0], items[1]]); }

    non_empty_items = non_empty_list.sort(function (a, b) {
        if (a[0] == b[0]) return chromosomes[species.indexOf(a[0])].indexOf(a[1]) - chromosomes[species.indexOf(b[0])].indexOf(b[1]);
        return species.indexOf(a[0]) - species.indexOf(b[0]);
    });

    for (spIndex in species) {
        let curr_specie = species[spIndex], curr_chromosomes = chromosomes[spIndex], new_chromosomes = [], curr_lengths = lengths[curr_specie], new_lengths = {};
        for (non_empty of non_empty_list) {
            if (non_empty[0] == curr_specie && curr_chromosomes.indexOf(non_empty[1]) != -1) {
                new_chromosomes.push(non_empty[1]); new_lengths[non_empty[1]] = curr_lengths[non_empty[1]];
            }
        }
        chromosomes[spIndex] = new_chromosomes; lengths[curr_specie] = new_lengths;
    }
}

// ---------------------------
/* --- BlockTracer Draw --- */
// ---------------------------

var INTERSPECIE_SPACE = 500;
var INTERCHROMOSOME_SPACE = 200;
var CHROMOSOME_BASELINE_HEIGHT = 5;
var BLOCK_BASE_HEIGHT = 30;
var BASELINE_EDGES_WIDTH = 5;
var CHROMO_LABEL_OFFSET = -50;
var SPECIES_LABEL_OFFSET_X = -60;
var SPECIES_LABEL_OFFSET_Y = 40;

function paintBlockTracer(species, chromosomes, events, lengths, inverted){
    var MAX_SPECIES_LENGTHS = getSumOfDictValuesFromDict(lengths),
        //MAX_CHROMOSOME_LENGTH = getMaxOfDictValuesFromDict(lengths),
        LENGTH_PREPENDS = getArrayOfSumsFromDict(lengths),
        CHROMOSOMES_PER_SPECIE = Object.values(chromosomes).map( o => o.length),
        MAX_CHROMOSOME_PER_SPECIES = Math.max.apply(Math, Object.values( CHROMOSOMES_PER_SPECIE.map(function(o) { return o; }) )),
        MAX_FULL_LENGTH = getMaxOfDictValuesFromDict({1: MAX_SPECIES_LENGTHS}),
        MINIMUM_CHROMOSOME_PIXELS = 800;
        
    // DEBUG :: console.log("--- DEBUG1 ---"); console.log(MAX_SPECIES_LENGTHS); console.log(LENGTH_PREPENDS); console.log(CHROMOSOMES_PER_SPECIE); console.log(MAX_CHROMOSOME_PER_SPECIES); console.log(MAX_FULL_LENGTH);
    
    var WIDTH = MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS, // (MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 :
        HEIGHT = (species.length-1)*INTERSPECIE_SPACE, //(species.length*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 : 
        MARGINS = {
            top: 50,
            right: 30,
            bottom: 30,
            left: 100
        };

    var WIDTH = WIDTH - MARGINS.left - MARGINS.right,
        HEIGHT = HEIGHT - MARGINS.top - MARGINS.bottom;

    // Clear SVG
    var svg = d3.select(".blocktracer > svg");
    if(!svg.empty()){ svg.remove(); }

    // -------- 
    // Scales
    //Set ColorScale
    var widthDomain = [0, MAX_FULL_LENGTH], widthRange = [0, WIDTH - (INTERCHROMOSOME_SPACE*MAX_CHROMOSOME_PER_SPECIES)],
        heightDomain = species, heightRange = [25, HEIGHT];

    //Set Scales
    var xScale = d3.scale.linear()
        .domain(widthDomain)
        .range(widthRange);
    var yScale = d3.scale.ordinal()
        .domain(heightDomain)
        .rangeBands(heightRange);

    //Set Axes
    var xAxis = d3.svg.axis()
        .scale((!inverted) ? xScale : yScale)
    var yAxis = d3.svg.axis()
        .scale((!inverted) ? yScale : xScale)

    // DEBUG :: console.log("--- DEBUG2 ---"); console.log(colorScale); console.log(xAxis); console.log(yAxis); //console.log(xScale); console.log(yScale);
    // --------
    // Draw SVG
    let svgWidth = WIDTH + MARGINS.left + MARGINS.right,
        svgHeight = HEIGHT + MARGINS.top + MARGINS.bottom;
        
    svg = d3.select('.blocktracer')
        .append("svg")
        .attr(getPositionAttribute('width', inverted), svgWidth)
        .attr(getPositionAttribute('height', inverted), svgHeight)
        .attr("class", 'blocktracer-svg')
        .append('g')
        .attr('transform', (!inverted) ? 'translate(' + MARGINS.left + ',' + MARGINS.top + ')' : 'translate(' + MARGINS.top + ',' + MARGINS.left + ')');

    // Setup data
    var preparedData = prepareBlockTracerData(species, chromosomes, lengths, events, LENGTH_PREPENDS);
    // DEBUG :: 
    console.log("--- DEBUG3 ---"); console.log(preparedData);
    // ---
    // Draw chromosome lines
    var chromosomeBaseLines = svg.selectAll('chromoBase')
        .data(preparedData.baselineData)
        .enter().append('g').classed('chromoBase', true)
        
        chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function(d) { return  xScale(d.x1) + INTERCHROMOSOME_SPACE*d.index; })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function(d) { return yScale(d.specie); })
        .attr(getPositionAttribute('width', inverted), function(d) { return xScale(d.x2); })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT);
    
        // 3'-5'
        chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function(d) { return  xScale(d.x1) + INTERCHROMOSOME_SPACE*d.index - BASELINE_EDGES_WIDTH; })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function(d) { return yScale(d.specie) - CHROMOSOME_BASELINE_HEIGHT; })
        .attr(getPositionAttribute('width', inverted), function(d) { return BASELINE_EDGES_WIDTH; })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT*2);

        // 5'-3'
        chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function(d) { return  xScale(d.x2)+xScale(d.x1) + INTERCHROMOSOME_SPACE*d.index; })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function(d) { return yScale(d.specie); })
        .attr(getPositionAttribute('width', inverted), function(d) { return BASELINE_EDGES_WIDTH; })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT*2)

    // DEBUG :: 
    //console.log("--- DEBUG4 ---"); console.log(chromosomeBaseLines);
    // --------

    // Setup BlockInfo groups
    var tracedBlocks = svg.selectAll('blockInfo')
        .data(preparedData.eventData)
        .enter().append('g').classed('blockInfo', true)

        // Draw blocks
        tracedBlocks.append('rect')
        .attr('class', function(d) { return 'tracedBlock block'+d.block_id} )
        .attr(getPositionAttribute('x', inverted), function(d) { return  xScale(d.prepend + d.x1) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })/*s[d.specie] */ 
        .attr(getPositionAttribute('y', inverted), function(d) { return yScale(d.specie) + d.y_gap; })
        .attr(getPositionAttribute('width', inverted), function(d) { return xScale(d.x2)-xScale(d.x1); })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), BLOCK_BASE_HEIGHT)
        .attr('fill', function(d) { return d.color }) //preparedData.colors[d.block_id]
        .on("click", function(d) {
            hideConnectionLines();
            if(d3.select(this).classed("clicked")){
                svg.selectAll("rect")
                    .style("opacity", 1)
                    .style("z-index", 10)
                    .classed("clicked", false);
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
    // --------
    // Draw blocks and connection lines
    // Lower blocks
    var STROKE_WIDTH = 6, LINE_BLOCK_DIFF = 10;

    var bottomLines = svg.selectAll('bottomLine')
        .data(preparedData.bottomLines)
        .enter().append('g').classed('bottomLine', true)
        .append('line')
        .attr("class", function(d) { return "horizontalBlock linesBlock linesBlockInfo" + d.block_id })
        .attr(getPositionAttribute('x1',inverted), function(d) { return xScale(d.x1 + d.prepend) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr(getPositionAttribute('x2',inverted), function(d) { return xScale(d.x2 + d.prepend) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr(getPositionAttribute('y1',inverted), function(d) { return yScale(d.specie)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF - STROKE_WIDTH/2; })
        .attr(getPositionAttribute('y2',inverted), function(d) { return yScale(d.specie)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF - STROKE_WIDTH/2; })
        .style("opacity", 0)
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', STROKE_WIDTH);


    // Upper blocks
    var upperLines = svg.selectAll('upperLine')
        .data(preparedData.upperLines)
        .enter().append('g').classed('upperLine', true)
        .append('line')
        .attr("class", function(d) { return "horizontalBlock linesBlock linesBlockInfo" + d.block_id })
        .attr(getPositionAttribute('x1',inverted), function(d) { return xScale(d.x1 + d.prepend) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr(getPositionAttribute('x2',inverted), function(d) { return xScale(d.x2 + d.prepend) + INTERCHROMOSOME_SPACE*(d.chromoIndex); })
        .attr(getPositionAttribute('y1',inverted), function(d) { return yScale(d.specie)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF + STROKE_WIDTH/2; })
        .attr(getPositionAttribute('y2',inverted), function(d) { return yScale(d.specie)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF + STROKE_WIDTH/2; })
        .style("opacity", 0)
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', STROKE_WIDTH);


    // Connection lines
    var connectionLines = svg.selectAll('connectLine')
        .data(preparedData.connectionLines)
        .enter().append('g').classed('connectionLine', true);

        connectionLines.append('line')
        .attr("class", function(d) { return "pairedLine linesBlock linesBlockInfo" + d.block_id })
        .attr(getPositionAttribute('x1', inverted), function(d) { return xScale(d.x1 + d.prependX) + INTERCHROMOSOME_SPACE*(d.chromoXIndex); })
        .attr(getPositionAttribute('x2', inverted), function(d) { return xScale(d.y1 + d.prependY) + INTERCHROMOSOME_SPACE*(d.chromoYIndex); })
        .attr(getPositionAttribute('y1', inverted), function(d) { return yScale(d.specieX)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .attr(getPositionAttribute('y2', inverted), function(d) { return yScale(d.specieY)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', 1);

        connectionLines.append('line')
        .attr("class", function(d) { return "pairedLine linesBlock linesBlockInfo" + d.block_id })
        .attr(getPositionAttribute('x1', inverted), function(d) { return xScale(d.x2 + d.prependX) + INTERCHROMOSOME_SPACE*(d.chromoXIndex); })
        .attr(getPositionAttribute('x2', inverted), function(d) { return xScale(d.y2 + d.prependY) + INTERCHROMOSOME_SPACE*(d.chromoYIndex); })
        .attr(getPositionAttribute('y1', inverted), function(d) { return yScale(d.specieX)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .attr(getPositionAttribute('y2', inverted), function(d) { return yScale(d.specieY)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', 1);

    var singleConnectionLines = svg.selectAll('singleConnectLine')
        .data(preparedData.singleConnectionLines)
        .enter().append('g').classed('singleConnectLine', true)
        .append('line')
        .attr("class", function(d) { return "singleLineBlock singleLineBlockInfo" + d.block_id })
        .attr(getPositionAttribute('x1', inverted), function(d) { return xScale(d.x1 + d.prependX) + INTERCHROMOSOME_SPACE*(d.chromoXIndex); })
        .attr(getPositionAttribute('x2', inverted), function(d) { return xScale(d.y1 + d.prependY) + INTERCHROMOSOME_SPACE*(d.chromoYIndex); })
        .attr(getPositionAttribute('y1', inverted), function(d) { return yScale(d.specieX)+BLOCK_BASE_HEIGHT+CHROMOSOME_BASELINE_HEIGHT+LINE_BLOCK_DIFF; })
        .attr(getPositionAttribute('y2', inverted), function(d) { return yScale(d.specieY)-BLOCK_BASE_HEIGHT-LINE_BLOCK_DIFF; })
        .style("opacity", 0)
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', 1);
    // DEBUG :: console.log("--- DEBUG6 ---"); console.log(bottomLines); console.log(upperLines); console.log(connectionLines);
    // --------
    // Draw labels

    var chromosomeLabels = svg.selectAll('chromosomeLabel')
        .data(preparedData.chromoLabels)
        .enter().append('g').classed('chromosomeLabel', true)
        .append('text')
        .attr('class', 'chromosomeLabelText')
        .attr(getPositionAttribute('x', inverted), function(d) { let factor = (!inverted) ? 1 : 0.5; return xScale(d.x) + CHROMO_LABEL_OFFSET*factor + INTERCHROMOSOME_SPACE*(d.index); })
        .attr(getPositionAttribute('y', inverted), function(d) { return yScale(d.specie) })
        .text(function(d) { return 'Chr ' + d.chromosome })
        //.attr("transform", function(d) { let offset = (d.x == 0) ? -1 : 1, newX =  xScale(d.x) + CHROMO_LABEL_OFFSET*offset; return "rotate(-45, " + newX + ", " + yScale(d.specie) + ")" });

    var speciesLabels = svg.selectAll('specieLabel')
        .data(species)
        .enter().append('g').classed('specieLabel', true)
        .append('text')
        .attr('class', 'specieLabelText')
        .attr('font-weight', 'bold')
        .attr('font-size', '2em')
        .attr(getPositionAttribute('x', inverted), SPECIES_LABEL_OFFSET_X)
        .attr(getPositionAttribute('y', inverted), function(d) { let factor = (!inverted) ? 1 : -1; return yScale(d) + SPECIES_LABEL_OFFSET_Y*factor })
        .text(function(d) { return d })
        .attr("transform", function(d) {
            if(!inverted) return "rotate(-90, " + SPECIES_LABEL_OFFSET_X + ", " + (yScale(d)+SPECIES_LABEL_OFFSET_Y) + ")"
            else return "translate(0,0)"
        });

    overlayOff();
    spinnerOff();
}

var N_SLICES = 20, MULTIPLIER=2, PREFIX_FACTOR = 1;
function prepareBlockTracerData(species, chromosomes, lengths, events, prepends){
    let baselineData = [], eventData = [], colors = [], bottomLines = [], upperLines = [], connectionLines = [], singleConnectionLines = [], chromoLabels = [];

    // Chromosome Labels
    Object.entries(prepends).map(function(specie_prepends){
        let specie = specie_prepends[0], chromos = chromosomes[species.indexOf(specie)], values = specie_prepends[1];
        for(i in values){ chromoLabels.push({'specie':specie, 'chromosome': chromos[i], 'x': values[i], 'index': i}) }
    });

    // Chromosome Baseline
    for(specieIndex in species){
        let specie = species[specieIndex],
            chromos = chromosomes[specieIndex],
            added_space = 0;
        for(chrIndex in chromos){
            let chr = chromos[chrIndex]
            curr_len = lengths[specie][chr]
            baselineData.push({'specie': specie, 'chromosome': chr, 'x1': added_space, 'x2': curr_len, 'index': parseInt(chrIndex)});
            added_space += curr_len
        }
    }

    // Colors
    let cmp_count = {}, color_count = {}, baseColors = [], combinationColorsList = [], baseColorIndex = {}, prevColorIndex = -1, prevCmpIndex = -1;;
    events.map(function (x) { return x[0].cmp_index}).forEach(function(x) { cmp_count[x] = (cmp_count[x] || 0)+1; color_count[x] = cmp_count[x]*PREFIX_FACTOR });

    for(key_val of Object.entries(cmp_count)){
        let currentColor = "#" + fullColorHex(R_color[baseColors.length%R_color.length], G_color[baseColors.length%R_color.length], B_color[baseColors.length%R_color.length]);
        baseColorIndex[key_val[0]] = baseColors.length;
        let combinationColors = tinycolor(currentColor).analogous(results = key_val[1]*MULTIPLIER, N_SLICES)
        baseColors.push(currentColor);
        combinationColorsList.push(combinationColors)
    }

    // EventData + Colors + Connection Lines
    for(eventIndex in events){
        let event = events[eventIndex];

        if(event[0].cmp_index != prevCmpIndex){ prevCmpIndex = event[0].cmp_index; prevColorIndex++; }
            
        let currentCmpIndex = prevColorIndex,
            comparisonColorIndex = color_count[event[0].cmp_index],
            eventsColor = combinationColorsList[prevColorIndex][comparisonColorIndex];
        eventsColor = (color_count[event[0].cmp_index] % 2 == 0) ? eventsColor.darken().toHexString() : eventsColor.saturate().toHexString(); color_count[event[0].cmp_index]++;

        for(blockInfoIndex in event){
            let block_info = event[blockInfoIndex]

            let specieXIndex = species.indexOf(block_info.info.spX), chrXIndex =  chromosomes[specieXIndex].indexOf(block_info.info.chrX),
                specieYIndex = species.indexOf(block_info.info.spY), chrYIndex =  chromosomes[specieYIndex].indexOf(block_info.info.chrY),
                x1 = block_info.overlap.x1, x2 = block_info.overlap.x2,
                y1 = block_info.overlap.y1, y2 = block_info.overlap.y2,
                chrX_y_gap = -BLOCK_BASE_HEIGHT, chrY_y_gap = -BLOCK_BASE_HEIGHT;

            let currentCond = (block_info.overlap.inverted == true),
                prevCond = (blockInfoIndex > 0) ? (event[blockInfoIndex-1].overlap.inverted == true) : false;

            if(prevCond){
                if(currentCond){ chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT; }
                else { chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT; chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT; }
            } else {
                if(currentCond){ chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT; }
            }


            eventData.push({
                'block_id': eventIndex, 'specie': block_info.info.spX, 'chromosome': block_info.info.chrX,
                'specieIndex': specieXIndex, 'chromoIndex': chrXIndex, 'color': eventsColor,
                'x1': x1, 'x2': x2, //'len': x2-x1,
                'prepend': prepends[block_info.info.spX][chrXIndex], 'y_gap': chrX_y_gap
            })

            eventData.push({
                'block_id': eventIndex, 'specie': block_info.info.spY, 'chromosome': block_info.info.chrY,
                'specieIndex': specieYIndex, 'chromoIndex': chrYIndex, 'color': eventsColor,
                'x1': y1, 'x2': y2, //'len': y2-y1,
                'prepend': prepends[block_info.info.spY][chrYIndex], 'y_gap': chrY_y_gap
            })

            bottomLines.push({
                'block_id': eventIndex, 'specie': block_info.info.spX, 'color': eventsColor,
                'specieIndex': specieXIndex, 'chromoIndex': chrXIndex,
                'x1': x1, 'x2': x2,
                'prepend': prepends[block_info.info.spX][chrXIndex]
            })

            upperLines.push({
                'block_id': eventIndex, 'specie': block_info.info.spY, 'color': eventsColor,
                'specieIndex': specieYIndex, 'chromoIndex': chrYIndex,
                'x1': y1, 'x2': y2,
                'prepend': prepends[block_info.info.spY][chrYIndex]
            });
            
            connectionLines.push({
                'block_id': eventIndex, 'color': eventsColor,
                'specieX': block_info.info.spX, 'chromoXIndex': chrXIndex,
                'specieY': block_info.info.spY, 'chromoYIndex': chrYIndex,
                'prependX': prepends[block_info.info.spX][chrXIndex], 'prependY': prepends[block_info.info.spY][chrYIndex],
                'x1': x1, 'x2': x2,
                'y1': (currentCond) ? y2 : y1, 'y2': (currentCond) ? y1 : y2
            });

            singleConnectionLines.push({
                'block_id': eventIndex, 'color': eventsColor,
                'specieX': block_info.info.spX, 'chromoXIndex': chrXIndex,
                'specieY': block_info.info.spY, 'chromoYIndex': chrYIndex,
                'prependX': prepends[block_info.info.spX][chrXIndex], 'prependY': prepends[block_info.info.spY][chrYIndex],
                'x1': x1 + (x2-x1)/2, 'y1': y1 + (y2-y1)/2
            })
        }
        //colors.push("#" + fullColorHex(R_color[eventIndex], G_color[eventIndex], B_color[eventIndex]));
    }

    blockTracerBaseConfig();

    return {'baselineData': baselineData, 'eventData': eventData, 'colors': combinationColorsList, 'bottomLines': bottomLines, 'upperLines': upperLines,
        'connectionLines': connectionLines, 'singleConnectionLines': singleConnectionLines, 'chromoLabels': chromoLabels};
}

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

function getPositionAttribute(attribute, inverted){
    if(!inverted) return attribute
    else { //width, height, x1, x2, x, y1, y2, y
        let ret;
        if(attribute.includes('x')) ret = attribute.replace('x','y')
        else if (attribute.includes('y')) ret = attribute.replace('y','x')
        else if (attribute.includes('width')) ret = attribute.replace('width','height')
        else if (attribute.includes('height')) ret = attribute.replace('height','width')
        return ret;
    }
}

// ---------------------
// --- Document Init ---
// ---------------------

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

$('#blocktracerView .btn').click(function() {
    $(this).addClass('active').siblings().removeClass('active');
});

// Show all connection linesbutton
$("#showConnectionLines").click(function(){
    var svg = d3.select(".blocktracer > svg");
    if(svg.empty()) showAlert("Warning", "Execute BlockTracer first", "danger");
    else if ($(this).children().attr('icon') == 'eye-open') showConnectionLines();
    else hideConnectionLines();
});
// Fit BlockTracer (Plabolize) button
$("#fitBlockTracer").click(function(){
    var svg = d3.select(".blocktracer > svg");
    if(svg.empty()) showAlert("Warning", "Execute BlockTracer first", "danger");
    else if($(this).children().attr('icon') == 'resize-full'){
        fitBlockTracer(); $(this).children().attr('icon', 'resize-small')
    } else {
        svg.attr('transform', null); $(this).children().attr('icon', 'resize-full')
    }

});

function blockTracerBaseConfig(){
    // Fit screen
    $("#fitBlockTracer").children().attr('icon','resize-full');
    // Connection lines
    $("#showConnectionLines").children().attr('icon', 'eye-open');
    document.getElementById('connectionLineText').innerHTML = "Show connection lines";
}

function showConnectionLines() {
    $("#showConnectionLines").children().attr('icon', 'eye-close');
    document.getElementById('connectionLineText').innerHTML = "Hide connection lines"

    let svg = d3.select(".blocktracer > svg");
    svg.selectAll("rect").filter(".tracedBlock").style("opacity", 1);
    svg = svg.selectAll('line');
    svg.filter(".pairedLine").style("opacity", 0);
    svg.filter(".singleLineBlock").style("opacity", 1);
    svg.filter(".horizontalBlock").style("opacity", 1);
}

function hideConnectionLines() {
    $("#showConnectionLines").children().attr('icon', 'eye-open');
    document.getElementById('connectionLineText').innerHTML = "Show connection lines"
    let svg = d3.select(".blocktracer > svg");
    svg.selectAll("rect").filter(".tracedBlock").style("opacity", 1);
    svg = svg.selectAll('line');
    svg.filter(".linesBlock").style("opacity", 0);
    svg.filter(".singleLineBlock").style("opacity", 0);
}

// Overlay by number behavior
function emptyChromosomesChecked(){
    var inputCheckbox = document.getElementById('emptyChromosomesCheck');

    if(inputCheckbox.checked){
        console.log("HIDE EMPTY CHROMOSOMES");// Hide empty
    }
    else{
        console.log("SHOW EMPTY CHROMOSOMES");// Show empty
    }
}

function fitBlockTracer(){
    var svg = $(".blocktracer > svg"),
        blocktracerDiv = $(".blocktracer");

	var bb=svg[0].getBBox();
	var bbx=bb.x
	var bby=bb.y
	var bbw=bb.width
	var bbh=bb.height
	//---center of graph---
	var cx=bbx+.5*bbw
	var cy=bby+.5*bbh
    //---create scale: ratio of desired width/height vs current width/height--
	var width_total = blocktracerDiv.width();
    var height_total = blocktracerDiv.height();

    var curr_width = svg.width();
    var curr_height = svg.height();

    var scaleX = width_total/curr_width; //--if height use myHeight/bbh--
    var scaleY = height_total/curr_height;
    if(scaleX < scaleY) scale=scaleX; else scale=scaleY
	//---move its center to target x,y --- translate("+transX+" "+transY+") 
	var transX=cx*(scale-1)
    var transY=cy*(scale-1)

	svg[0].setAttribute("transform","translate("+transX+","+transY+")scale("+scale+","+scale+")")
}