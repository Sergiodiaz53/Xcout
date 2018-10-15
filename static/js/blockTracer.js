/**
 * Created by Plabolo on 15/10/18.
 */
/*
$('.blockTracerSpecie').on('change', function() {
    let list_species = getValuesOfDOMObjects(".blockTracerSpecie option:selected");
    //$().each(function() {list_species.push(this.value)})
    console.log(list_species)
    if(hasDuplicates(list_species)){
        $('#blockTracerButton').prop("disabled", true);
    }else{
        $('#blockTracerButton').prop("disabled", false);
    }
    blockTracerSelectedSpecieBehavior($(this).attr('id'));
    //Selected specie behavior
});*/

function addNewblockTracerRow(id){
    console.log("ADD NEW ROW :: " + id);
    let currentID = id+1//"blocktracer"+$('.blockTracerRow').length,
        newRow = document.createElement('div'),
        newSpecieSelectDiv = document.createElement('div'),
        newChromosomeSelectDiv = document.createElement('div'),
        newButtonDiv = document.createElement('div');

    newRow.className = 'blockTracerRow form-group row col-xs-12';
    
    newSpecieSelectDiv.className = 'col-xs-3';
    let newSpecieSelect = document.createElement('select');
    newSpecieSelect.id = "blocktracer" + currentID;
    newSpecieSelect.className = "form-control blockTracerSpecie";
    let list_species = getValuesOfDOMObjects("#specieX option"), species_html = '';
    for(specie of list_species){
        species_html += '<option value="' + specie + '">' + specie + '</option>';
    }
    newSpecieSelect.innerHTML = species_html

    newSpecieSelectDiv.appendChild(newSpecieSelect);
    newRow.appendChild(newSpecieSelectDiv);

    newChromosomeSelectDiv.className = 'col-xs-6';
    newChromosomeSelectDiv.innerHTML = '<select id="blocktracer' + currentID + '" class="selectpicker" data-live-search="true" title="Select chromosomes..." data-actions-box="true">'
    let newChromosomeSelect = document.createElement('select');
    newChromosomeSelect.id = currentID;

    newChromosomeSelectDiv.appendChild(newChromosomeSelect);
    newRow.appendChild(newChromosomeSelectDiv);

    newButtonDiv.className = 'col-xs-3';
    newButtonDiv.innerHTML = '<button id="blocktracer' + currentID + '" type="button" class="btn btn-info" onclick="addNewblockTracerRow(' + currentID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="plus"></bs-glyphicon></button>'
        + '<button type="button" class="btn btn-warning" onclick="removeBlockTracerRow(' + currentID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="minus"></bs-glyphicon></button>';
    
    newRow.appendChild(newButtonDiv);
    
    // --- Append at index
    newRow.appendAfter(document.getElementsByClassName("blockTracerRow")[id]);
    blockTracerSelectedSpecieBehavior("blocktracer" + currentID)
}

function removeBlockTracerRow(id){
    console.log("REMOVE ID :: " + id);
}

function chromosomeListBehavior(listChromosomes, blockTracerSpecieID){
    data_string = ""
    for(chromosome of listChromosomes){
        data_string+='<option value="' + chromosome + '">' + chromosome + '</option>'
    }
    $("select.selectpicker#" + blockTracerSpecieID).html(data_string);
}

function blockTracerSelectedSpecieBehavior(blockTracerSpecieID){
    console.log(blockTracerSpecieID)
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

function exportToBlockTracer(spX, chrX, spY, chrY){
    console.log("Export to BLOCKTRACER"); console.log(spX); console.log(chrX); console.log(spY); console.log(chrY);
    // Check if LOCAL or SERVER
    // Server BlockTrace
    if(SOURCE_OVERLAY == "SERVER"){
        console.log("SERVER")
    }
    else if (SOURCE_OVERLAY == "LOCAL"){
        console.log("LOCAL")
    }
    // Local BlockTrace

}


function executeBlockTracer(){
    console.log(executeBlockTracer)
}

// --- Document Init ---
$(document).ready(function(){
    console.log("READY");
    blockTracerSelectedSpecieBehavior("blocktracer0");
/*
    $(document).on('change', '.blockTracerSpecie', function() {
        let list_species = getValuesOfDOMObjects(".blockTracerSpecie option:selected");
        //$().each(function() {list_species.push(this.value)})
        console.log(list_species)
        if(hasDuplicates(list_species)){
            $('#blockTracerButton').prop("disabled", true);
        }else{
            $('#blockTracerButton').prop("disabled", false);
        }
        blockTracerSelectedSpecieBehavior($(this).attr('id'));
        //Selected specie behavior
    });
    */
});