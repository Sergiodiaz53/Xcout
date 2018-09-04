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


//Slider cell size
$('#itemSize_slider').bootstrapSlider({
	formatter: function(value) {
		return 'Current value: ' + value;
	},
    min: 6,
    max: 16,
    step: 1,
    value: itemSize,
    tooltip:"show",
});

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