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