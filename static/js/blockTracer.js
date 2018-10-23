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

function getSumOfDictValuesFromDict(array_list){
    let sums = {}
    Object.entries(array_list).map(function(key_val){ sums[key_val[0]] = Object.values(key_val[1]).reduce( (a, b) => a + b) });
    return sums;
}

function getMaxOfDictValuesFromDict(array_list){
    let objects = []
    Object.values(array_list).map(function(array){ Object.values(array).map( o => objects.push(o) ) })
    return Math.max.apply(Math, Object.values( objects.map(function(o) { return o; }) ))
}

var INTERSPECIE_SPACE = 200;
var INTERCHROMOSOME_SPACE = 50;
var CHROMOSOME_BASELINE_HEIGHT = 10;

function paintBlockTracer(species, chromosomes, events, lengths){
    var MAX_SPECIES_LENGTHS = getSumOfDictValuesFromDict(lengths);
    var MAX_CHROMOSOME_LENGTH = getMaxOfDictValuesFromDict(lengths);
    var CHROMOSOMES_PER_SPECIE = Object.values(chromosomes).map( o => o.length);
    var MAX_CHROMOSOME_PER_SPECIES = Math.max.apply(Math, Object.values( CHROMOSOMES_PER_SPECIE.map(function(o) { return o; }) ));
    var MAX_FULL_LENGTH = getMaxOfDictValuesFromDict({1: MAX_SPECIES_LENGTHS});
    var MINIMUM_CHROMOSOME_PIXELS = 300;
    // DEBUG :: 
    console.log("--- DEBUG1 ---"); console.log(MAX_SPECIES_LENGTHS); console.log(MAX_CHROMOSOME_LENGTH); console.log(CHROMOSOMES_PER_SPECIE); console.log(MAX_CHROMOSOME_PER_SPECIES); console.log(MAX_FULL_LENGTH);
    
    var WIDTH = (MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 : MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS
        HEIGHT = (species.length*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 : species.length*MINIMUM_CHROMOSOME_PIXELS,
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
    var xScale= d3.scale.linear()
        .domain([0, MAX_FULL_LENGTH])
        .range([0, WIDTH - (INTERCHROMOSOME_SPACE*MAX_CHROMOSOME_PER_SPECIES) ]);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    //Set yScale
    var yScale = d3.scale.ordinal()
        .domain(species)
        .rangeBands([0, HEIGHT]);

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
        .attr("width", WIDTH + MARGINS.left + MARGINS.right)
        .attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
        .attr("class", 'blocktracer-svg')
        .append('g')
        .attr('transform', 'translate(' + MARGINS.left + ',' + MARGINS.top + ')');

    // Draw chromosome lines
    var chromosomeBaseData = generateChromosomeBaselineData(species, chromosomes, lengths);

    var chromosomeBaseLines = svg.selectAll('rect')
        .data(chromosomeBaseData)
        .enter().append('g').append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr('x', function(d) { console.log(xScale(d.x1)); return  xScale(d.x1)+ INTERCHROMOSOME_SPACE*d.index; })/*s[d.specie]*/
        .attr('y', function(d) { return yScale(d.specie); })
        .attr('width', function(d) { console.log(xScale(d.x2)); return xScale(d.x2); })/*s[d.specie]*/
        .attr('height', CHROMOSOME_BASELINE_HEIGHT);
    
    // DEBUG :: 
    console.log("--- DEBUG3 ---"); console.log(chromosomeBaseData); console.log(chromosomeBaseLines);
    // ---
    // Draw event blocks
}

function generateChromosomeBaselineData(species, chromosomes, lengths){
    let ret = [];
    for(specieIndex in species){
        let specie = species[specieIndex],
            chromos = chromosomes[specieIndex],
            added_space = 0;
        
        for(chrIndex in chromos){
            let chr = chromos[chrIndex]
            curr_len = lengths[specie][chr]
            ret.push({'specie': specie, 'x1': added_space, 'x2': curr_len, 'index': parseInt(chrIndex)});
            added_space += curr_len
        }
    }
    return ret;
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