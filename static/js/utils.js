/**
 * Created by Sergio and Plabolo on 4/10/17.
 */

function showAlert(title, content, type) {
    $("#alertContainer").bootstrapAlert({
        type: type, // Optional, , default: 'info',  values: 'success', 'info', 'warning' or 'danger'
        dismissible: true, // Optional, default: true
        heading: title, // Optional, default: ''
        message: content,  // Required,
        clear: true // Optional, Clears the container, default: true
    });

    $(".alert").delay(2000).slideUp(200, function() {
        $(this).alert('close');
    });
}

function sortObject(o) {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

function naturalCompare(a, b) {
    var ax = [], bx = []; 
    if(a[0] == '[') a = 'ZZZZZZZZ' + a; if(b[0] == '[') b = 'ZZZZZZZZ' + b;

    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });

    while(ax.length && bx.length) {
        var an = ax.shift();
        var bn = bx.shift();
        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if(nn) return nn;
    }

    return ax.length - bx.length;
}

// --- DOM Behavior

function toggler(divId) {
    $("#" + divId).toggle();
}

function hider(divId){
    $("#" + divId).hide()
}

function collapser(divId){
    $("#" + divId).collapse()
}

function emptier(divId){
    $("#" + divId).html('');
}

function clearDivIdSVG(divId){
    let svg = d3.select("#" + divId + " > svg");
    if(!svg.empty()){
        svg.remove();
    }
}

// Database Image Url Parser
function imgUrlParser(img_url, base_axis){
    //         0    1  2     3        4  5  6
    //"media/HOMSA.Chr.1.fasta-MUSMU.Chr.1.fasta.mat.filt.png"
    let items = img_url.split('/')[1].split('.');

    if(base_axis == 'X')
        return [items[3].split('-')[1], items[5]]
        //return items[3].split('-')[1] + " - " + items[5]
    else
        return [items[0], items[2]]
        //return items[1] + " - " + items[2]

}

// Generate RGB
function rgb(r,g,b){
    return ("rgb("+r+","+g+","+b+")")
}

// Select label element from axis tick
function select_x_axis_label(d) {
    console.log(d3.select('.xaxis').selectAll('text'))
    return d3.select('.xaxis')
        .selectAll('text')
        .filter(function(x) { console.log(x); return x == d.specieX + " - " + d.chromosomeX_number; });
}

function select_y_axis_label(d) {
    return d3.select('.yaxis')
        .selectAll('text')
        .filter(function(x) { console.log(x); return x == d.specieY + " - " + d.chromosomeY_number; });
}

// Scale Event parameter
function scaleEventParam(scaled_len, event_param){
    return parseInt(event_param*scaled_len/1000)
}

// Number to scientific notation
function scientificNotation(x, f) {
    return Number.parseFloat(x).toExponential(f);
}

// Number to pairbase notation
function pairbaseNotation(x, f) {
    let pb = Number.parseFloat(x).toExponential(f);
    let current_exp = 1000;
    if(pb / current_exp < 1000) return (pb/current_exp).toFixed(f) + "Kbp"
    current_exp = current_exp * 1000
    if (pb / current_exp < 1000) return (pb/current_exp).toFixed(f) + "Mbp"
    current_exp = current_exp * 1000
    return (pb/current_exp).toFixed(frames) + "Gbp"
}

// --- DEBUG --- //
var tmp_test, tmp_var;