/**
 * Created by Sergio on 4/10/17.
 */

function showAlert(title, content, type) {
    $("#alertContainer").bootstrapAlert({
        type: 'success', // Optional, , default: 'info',  values: 'success', 'info', 'warning' or 'danger'
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