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

    getFullComparisonOf(specieX, specieY);
});

// Load local button
$("#loadLocal").click(function(){
    collapser("collapseLocal"); //  data-toggle="collapse" data-target="#collapseLocal"
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
    var svg = d3.select(".heatmap > svg");
    if($(this).children().attr('icon') == 'resize-full'){
        fitToScreen(); $(this).children().attr('icon', 'resize-small')
    } else {
        svg.attr('transform', null); $(this).children().attr('icon', 'resize-full')
    }
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
    itemSize = callback.value; cellSize = itemSize - 1;

    let species = getLoadedSpecies();
    getFullComparisonOf(species.specieX, species.specieY);
});


//Slider color config
$('#color_slider').bootstrapSlider().on("slideStop", function(callback){
    colorValueLow = callback.value[0]/100; colorValueHigh = callback.value[1]/100;

    let species = getLoadedSpecies();
    getFullComparisonOf(species.specieX, species.specieY);
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


$('#specieX').on('change', function() {
    newComparisonsButtonBehavior();
});

$('#specieY').on('change', function() {
    newComparisonsButtonBehavior();
});

// Show tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip({'hover': 'focus'})
    $('#numberChromosomes').tooltip({'hover': 'focus', 'title': 'Number of Chromosomes to Overlay'})
    $('#numberChromosomesCheck').tooltip({'hover': 'focus', 'title': 'Adjust threshold by number of Chromosomes to Overlay'})
})

// Functionalities navigation bar
$('.nav.navbar-tabs > li').on('click', function(e) {
    $('.nav.navbar-nav > li').removeClass('active');
    $(this).addClass('active');
});

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