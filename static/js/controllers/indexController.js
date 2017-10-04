/**
 * Created by Sergio on 4/10/17.
 */

$("#addComparison").click(function(){
    var specieX = $("#specieX").val();
    var specieY = $("#specieY").val();

    getFullComparisonOf(specieX, specieY)

});