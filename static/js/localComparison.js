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
        readLocalComparisonCSVFile(local_data.index);
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
function readLocalComparisonCSVFile(textFile){
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
        let auxSpecieX = "[L] " + items[0].split('.')[0],
            auxSpecieY = "[L] " + items[1].split('.')[0],
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
    localComparisonJSON = (LOCAL_COMPARISON.length > 0) ? localComparisonJSON.concat(LOCAL_COMPARISON) : localComparisonJSON;
    LOCAL_COMPARISON = localComparisonJSON;
    LOCAL_LOADED = true;

    return {'comparisonJson': localComparisonJSON, 'localX': localSpeciesX, 'localY': localSpeciesY};
}

// ------

// Add Comparison to Comparison Table/List
function addLocalComparisonToComparisonList(specieX, specieY){
    var newRow = "<tr><td class='specieX_name'>"+specieX+"</td><td>vs</td><td class='specieY_name'>"+specieY+"</td><td><button class='btn btn-md btn-danger glyphicon glyphicon-remove removeButton'></button></td>'";

    //If comparison doesn't exists, add it.
    if(!$('#comparisonList tr > td:contains('+specieX+') + td:contains(vs) + td:contains('+specieY+')').length) $("#comparisonList").find("tbody").append(newRow)

    $(".removeButton").click(function(){
        $(this).closest("tr").remove();
        let species = getLoadedSpecies();
        let tmpComparison = [];

        for(i in LOCAL_COMPARISON){
            if(LOCAL_COMPARISON[i].specieX != specieX && LOCAL_COMPARISON[i].specieY != specieY)
                tmpComparison.push(LOCAL_COMPARISON[i])
        }

        LOCAL_COMPARISON = tmpComparison.slice(0);
        clearSidemenuSelection
        getFullComparisonOf(species.specieX, species.specieY);
    });
}

function localSpecieCheck(specieName){
    return (specieName.split(']').length > 1) ? true : false;
}

// --
var SERVER_LOADED = false, SERVER_COMPARISON = []; 
var LOCAL_LOADED = false, LOCAL_COMPARISON = [];

// -- Overlay

// Obtain Events info
function readLocalEvents(specieX, specieY, chromosomeX, chromosomeY, overlay_threshold, data_string){
    // LOCAL COMPARISON MAX NUMBER BEHAVIOR
    let eventsFiles = [], overlay_axis = (chromosomeX == 'Overlay') ? 'X' : 'Y';
    local_events = []; local_lengths = [];// Clear global
    CURRENT_OVERLAY_INFORMATION = {
        'sp_x': specieX,
        'sp_y': specieY,
        'chr_x': chromosomeX,
        'chr_y': chromosomeY,
        'data_string': data_string,
    }; SOURCE_OVERLAY="LOCAL";

    let filtered_comparisons = LOCAL_COMPARISON.filter(function(comp){
        return filterComparisonDatum(comp, specieX, specieY, chromosomeX, chromosomeY, overlay_axis, overlay_threshold)
    });

    if(OVERLAY_NUMBER_MAX!="0")
        filtered_comparisons = filtered_comparisons.sort(function(a,b){ 
            return (a.score < b.score) ? -1 : 1
        }).splice(0, OVERLAY_NUMBER_MAX);

    for(curr_comp of filtered_comparisons){
        let curr_img = curr_comp.img.split('.'); curr_img.splice(-2);
        curr_img = curr_img.join('.');

        let current_file = local_data.events.find(function(eventsFile){
            let curr_events = eventsFile.name.split('.'); curr_events.splice(-2);
            curr_events = curr_events.join('.');
            return (curr_events == curr_img)
        });

        // If file exists exists...
        if(current_file instanceof File) eventsFiles.push(current_file);
    }
    if(eventsFiles.length > 0){
        readLocalEventsFile(eventsFiles, 0, overlay_axis, filtered_comparisons, data_string);
    }else{
        console.log('ERROR - No local comparisons found below threshold');
        showAlert("Error", "No local comparisons found below threshold", "danger");
    }
}

var local_events = [], local_lengths = [];
function readLocalEventsFile(eventsFiles, index, overlayAxis, filteredComparisons, dataString){
    var reader = new FileReader();

    if(index >= eventsFiles.length){ // Finished
        let max_x = Math.max.apply(Math, local_lengths.map(function(o) { return o.x; })),
            max_y = Math.max.apply(Math, local_lengths.map(function(o) { return o.y; })),
            base_axis = (overlayAxis == 'X') ? 'Y' : 'X',
            lengths = (base_axis == 'X') ?
                [...new Set(local_lengths.map(item => item.y))] :
                [...new Set(local_lengths.map(item => item.x))],
            urls = [...new Set(filteredComparisons.map(item => item.img))],
            chromosome_numbers = [...new Set(urls.map(url => imgUrlParser(url, base_axis)))],
            colors = Array.apply(null, {length: eventsFiles.length}).map(Number.call, Number).
                map(index => "#" + fullColorHex(R_color[index], G_color[index], B_color[index]));
        
        CURRENT_OVERLAY = {
            'events': local_events, 
            'max_x': max_x,
            'max_y': max_y,
            'lengths': lengths,
            'base_axis': base_axis,
            'chromosome_numbers': chromosome_numbers,
            'colors': colors
        };
        overlayComparisonEvents(local_events, max_x, max_y, lengths, base_axis, chromosome_numbers, colors)
        $("#comparisonData").html(dataString);
        shower("comparisonInfo");
        $("#collapseOverlay").collapse("show");
    }
    else{
        var currFile = eventsFiles[index];

        reader.onload = function(e) {
            lines = this.result.split('\n');
            header = lines.shift(); lines.shift(); lines.pop(); lines.pop();
            let lengths = header.split(',');

            for(line of lines){
                let items = line.split(','),
                    curr_event = {
                    'x1':items[0],
                    'y1':items[1],
                    'x2':items[2],
                    'y2':items[3],
                    'len':items[4],
                    'cmp':index,
                    'color': '#' + fullColorHex(R_color[index], G_color[index], B_color[index])
                };

                if(!filterEvent(curr_event)) local_events.push(curr_event);
            }
            local_lengths.push({'x': parseInt(lengths[0]), 'y': parseInt(lengths[1])});

        };
        reader.onloadend = function(e){
            readLocalEventsFile(eventsFiles, index+1, overlayAxis, filteredComparisons, dataString);
        }

        reader.readAsText(currFile);
    }
}

// Filter Local Datum
function filterComparisonDatum(comparison, specieX, specieY, chromosomeNumberX, chromosomeNumberY, overlayAxis, overlayThreshold){
    let threshold_check = (OVERLAY_NUMBER_MAX=="0") ? overlayThreshold : 1

    if(overlayAxis == 'X')
        return (comparison.specieX == specieX) && (comparison.specieY == specieY) &&
            (comparison.chromosomeY_number == chromosomeNumberY) && (comparison.score <= threshold_check)
    else
        return (comparison.specieX == specieX) && (comparison.specieY == specieY) &&
            (comparison.chromosomeX_number == chromosomeNumberX) && (comparison.score <= threshold_check)
}

function filterEvent(event){
    return (event.x1 == '0' && event.y1 == '0' && event.x2 == '0' && event.y2 == '0')
}