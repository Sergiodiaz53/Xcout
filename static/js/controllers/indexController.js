/**
 * Created by Sergio on 4/10/17.
 */

// Side Menu controller //

// Comparison button
$("#addComparison").click(function(){
    var specieX = [],
        specieY = [];

    specieX.push($("#specieX").val());
    specieY.push($("#specieY").val());

    $('#comparisonList .specieX_name').each(function() {
        specieX.push($(this).html())
    });

    $('#comparisonList .specieY_name').each(function() {
        specieY.push($(this).html())
    });

    getFullComparisonOf(specieX, specieY)

});

//Slider cell size config
$('#itemSize_slider').bootstrapSlider({
	formatter: function(value) {
		return 'Current value: ' + value;
	},
    min: 6,
    max: 20,
    step: 1,
    value: itemSize,
    tooltip:"show",
});

//Slider color config
$('#Color_slider').bootstrapSlider({
	formatter: function(value) {
		return 'Red max: ' + value[0] + ' | Green max: ' + value[1];
	},
    min: 1,
    max: 100,
    step: 1,
    value: [colorValueLow*100,colorValueHigh*100],
    tooltip:"show",
    
});

//Slider threshold config
$('#threshold_slider').bootstrapSlider({
	formatter: function(value) {
		return 'Current value: ' + value;
	},
    min: 1,
    max: 100,
    step: 1,
    value: overlay_threshold*100,
    tooltip:"show",
});

// --- Slider behaviors ---

//Slider cell size config
$('#itemSize_slider').bootstrapSlider().on("slideStop", function(callback){
    itemSize = callback.value;
    cellSize = itemSize - 1;
    $("#addComparison").click();
});


//Slider color config
$('#Color_slider').bootstrapSlider().on("slideStop", function(callback){
    colorValueLow = callback.value[0]/100;
    colorValueHigh = callback.value[1]/100;
    $("#addComparison").click();
});

//Slider threshold config
$('#threshold_slider').bootstrapSlider().on("slideStop", function(callback){
    overlay_threshold = callback.value/100;
});


// --- Spinner functions ---

function spinnerOn(loadText){
    var spinner = document.getElementById("spinner");
    spinner.style.display = "block";

    $("#loadingtext").text(loadText);
}
function spinnerOff(){
    var spinner = document.getElementById("spinner");
    spinner.style.display = "none";
}
function overlayOn(){
    var overlay = document.getElementById("overlay");
    overlay.style.display = "block";
}
function overlayOff(){
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

// --- Add Comparison Behavior ---

var old_specieX = '', old_specieY = '';
function getValFromSpecieList(current_column){
    let current_change;
    if(current_column == "specieX"){
        current_change = $("#specieX option:selected").text();

        $('#specieY option[value=' + current_change + ']').attr('disabled', 'disabled').hide();
        try{ $('#specieY option[value=' + old_specieY + ']').removeAttr('disabled').show();  }
        catch(err){ console.log("Old specie = " + old_specieY); } old_specieY = current_change;
    }else{
        current_change = $("#specieY option:selected").text();

        $('#specieX option[value=' + current_change + ']').attr('disabled', 'disabled').hide();
        try{ $('#specieX option[value=' + old_specieX + ']').removeAttr('disabled').show(); }
        catch(err){ console.log("Old specie = " + old_specieX); } old_specieX = current_change;
    }
};

function newComparisonsButtonBehavior(){
    let curr_x = $("#specieX option:selected").text();
    let curr_y = $("#specieY option:selected").text();

    if(curr_x == curr_y){
        $('#addComparison').prop("disabled", true);
    }else{
        $('#addComparison').prop("disabled", false);
    }
}

$(document).ready(function(){
    newComparisonsButtonBehavior();
});

$('#specieX').on('change', function() {
    newComparisonsButtonBehavior();
});

$('#specieY').on('change', function() {
    newComparisonsButtonBehavior();
});