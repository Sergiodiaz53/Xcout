// --- Check for Browser Compatibility --- //
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    } else {
    alert('The File APIs are not fully supported in this browser.');
}

// Input LocalFile behavior
var fileInput = document.getElementById("file-input");
var local_data = {
    pngs: [], events: [], index: ''
}
var index_csv;

fileInput.addEventListener('change', function() {    
    for(file of fileInput.files){
        extension = file.name.split('.');

            if(extension[extension.length-1] == 'png') local_data.pngs.push(file);
            else if(extension[extension.length-1] == 'txt' && extension[extension.length-2] == 'events') local_data.events.push(file);
            else if(extension[extension.length-1] == 'csv')local_data.index = file;
    }

    // If index exists...
    if(local_data.index instanceof File){
        readLocalFile(local_data.index);
    }
}, false);

// Use Filesystem API to obtain image data from File and load it in the HTML
function loadLocalImage(imageFile){
    let reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
            // Render thumbnail.
            string = "<img style='height: 100%; width: 100%; object-fit: contain' src='" +
                e.target.result + "' title='" +  escape(theFile.name) + "'/>"
            $("#comparisonPreview").html(string);
        };
    })(imageFile);

    // Read in the image file as a data URL.
    reader.readAsDataURL(imageFile);
}

// Use Filesystem API to read text from File and create JSON
function readLocalFile(textFile){
    var reader = new FileReader();
  
    reader.onload = function(e) {
        console.log("READING :: " + textFile.name);
        index_csv = this.result.split('\n');
    };
    reader.onloadend = function(e){
        let local_comparison_data = storeLocalComparison(index_csv);
        addLocalComparisonToComparisonList(local_comparison_data.localX, local_comparison_data.localY);
        visualizeFullComparisonFromJSON([], local_comparison_data.comparisonJson)
        fileInput.value = '';
        document.getElementById("loadLocal").click();
    }
    reader.readAsText(textFile);

}

// Process index csv into local JSON
function storeLocalComparison(lines){
    var localComparisonJSON = [],
        localSpeciesX, localSpeciesY;

    for(let i = 1; i < lines.length; i++){
        // 0    1    2    3    4     5         6           7    8       9
        //SpX, SpY, IDX, IDY, IMG, CHNumberX, CHNumberY, Score, LenX, LenY
        let items = lines[i].split(',');
        try{
        let auxSpecieX = "[L]" + items[0].split('.')[0],
            auxSpecieY = "[L]" + items[1].split('.')[0],
            auxChrNumX = items[5],
            auxChrNumY = items[6],
            auxScore = items[7],
            auxImg = items[4];
        
        localComparisonJSON.push({
            'specieX': auxSpecieX,
            'specieY': auxSpecieY,
            'chromosomeX_number': auxChrNumX,
            'chromosomeY_number': auxChrNumY,
            'score': auxScore,
            'img': auxImg,
        })
        } catch(err) { /* Ignore */ }
    }

    localSpeciesX = localComparisonJSON[0].specieX;
    localSpeciesY = localComparisonJSON[0].specieY;
    LOCAL_COMPARISON = localComparisonJSON;
    LOCAL_LOADED = true;

    return {'comparisonJson': localComparisonJSON, 'localX': localSpeciesX, 'localY': localSpeciesY};
}

// Add Comparison to Comparison Table/List
function addLocalComparisonToComparisonList(specieX, specieY){
    var newRow = "<tr><td class='specieX_name'>"+specieX+"</td><td>vs</td><td class='specieY_name'>"+specieY+"</td><td><button class='btn btn-md btn-danger glyphicon glyphicon-remove removeButton'></button></td>'";

    //If comparison doesn't exists, add it.
    if(!$('#comparisonList tr > td:contains('+specieX+') + td:contains(vs) + td:contains('+specieY+')').length) $("#comparisonList").find("tbody").append(newRow)

    $(".removeButton").click(function(){
        $(this).closest("tr").remove();
        let species = getLoadedSpecies();
        let tmp_comparison = [];

        for(i in LOCAL_COMPARISON){
            if(LOCAL_COMPARISON[i].specieX != specieX && LOCAL_COMPARISON[i].specieY != specieY)
                tmp_comparison.push(LOCAL_COMPARISON[i])
        }

        LOCAL_COMPARISON = tmp_comparison.slice(0);
        getFullComparisonOf(species.specieX, species.specieY)
    });
}

function getLoadedSpecies(){
    var specieX = [],
        specieY = [];

    $('#comparisonList .specieX_name').each(function() {
        specieX.push($(this).html())
    });

    $('#comparisonList .specieY_name').each(function() {
        specieY.push($(this).html())
    });

    return {'specieX': specieX, 'specieY': specieY};
}

function localSpecieCheck(specieName){
    return (specieName.split(']').length > 1) ? true : false;
}

// --
var SERVER_LOADED = false, SERVER_COMPARISON = []; 
var LOCAL_LOADED = false, LOCAL_COMPARISON = [];