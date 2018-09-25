/**
 * Created by Sergio and Plabolo on 4/10/17.
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
    checkSpeciesTable();
});

// Auto Threshold (Plabolize) button
$("#autoThreshold").click(function(){
    plabolize();

    function plabolize(){
        getScoresThreshold()
    }
});

// Fit to Screen (Plabolize) button
$("#fitScreen").click(function(){
    fitToScreen();
});

//Slider cell size config
$('#itemSize_slider').bootstrapSlider({
	formatter: function(value) {
		return 'Current value: ' + value;
	},
    min: 6,
    max: 25,
    step: 1,
    value: itemSize,
    tooltip:"show",
});

//Slider color config
$('#color_slider').bootstrapSlider({
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
$('#color_slider').bootstrapSlider().on("slideStop", function(callback){
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

// Check if specieX and specieY are different, else block add button
function newComparisonsButtonBehavior(){
    let curr_x = $("#specieX option:selected").text();
    let curr_y = $("#specieY option:selected").text();

    if(curr_x == curr_y){
        $('#addComparison').prop("disabled", true);
    }else{
        $('#addComparison').prop("disabled", false);
    }
}

// Disable configuration button if species table is empty
function checkSpeciesTable(){
    var rowCount = $('#comparisonList table tbody tr').length;
    if(rowCount < 1){
        $("#collapseConfig").collapse("hide");
        $('#configButton').attr('disabled','disabled');
    } else
        $('#configButton').removeAttr('disabled');
}

// --- Document Init ---
$(document).ready(function(){
    // Make species different as default
    try{
        document.getElementById('specieY').selectedIndex=1;
    } catch(err){
        console.log("Cannot change index");
        newComparisonsButtonBehavior();
    }

    checkSpeciesTable();
});

$('#specieX').on('change', function() {
    newComparisonsButtonBehavior();
});

$('#specieY').on('change', function() {
    newComparisonsButtonBehavior();
});