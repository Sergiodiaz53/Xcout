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
    console.log(data)
    $.ajax({
        type:"POST",
        url:FORCE_URL+"/blocktracer/trace/",
        data: {
            'species': JSON.stringify(data[0]),
            'chromosomes' : JSON.stringify(data[1])
        },
        success: function(content) {
            results = JSON.parse(content); console.log(results)

            // PAINT
        }
    });
}


// ---------------------------

// --- Document Init ---
$(document).ready(function(){
    addNewblockTracerRow(BLOCKTRACER_ID, false);
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