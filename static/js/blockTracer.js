/**
 * Created by Plabolo on 15/10/18.
 */

// Selection Checks
function selectionSpeciesCheck() {
    // Species selection check
    let list_species = getValuesOfDOMObjects(".blockTracerSpecie option:selected");
    return !hasDuplicates(list_species)
}

function selectionChromosomeCheck() {
    // Chromosome selection check
    let dict_values = getValuesOfDOMObjectsByParentKeyID("select.selectpicker option:selected");
    let chromosomes_check = true;
    for (key of Object.keys(dict_values)) {
        if (dict_values[key].includes("")) chromosomes_check = false;
    }
    if (Object.keys(dict_values).length != $(".blockTracerSpecie").length) chromosomes_check = false;
    return chromosomes_check;
}

function blockTracerButtonBehavior() {
    if (selectionSpeciesCheck() && selectionChromosomeCheck())
        $('#blockTracerButton').prop("disabled", false);
    else
        $('#blockTracerButton').prop("disabled", true);
}

// Create BlockTracerRow
var BLOCKTRACER_ID = 0;

function addNewblockTracerRow(id, erase = true) {
    BLOCKTRACER_ID = BLOCKTRACER_ID + 1;
    let newRow = document.createElement('div'),
        newSpecieSelectDiv = document.createElement('div'),
        newChromosomeSelectDiv = document.createElement('div'),
        newButtonDiv = document.createElement('div');

    newRow.className = 'blockTracerRow form-group row col-xs-12';
    newRow.id = "blockTracerRow" + BLOCKTRACER_ID;

    // Create Specie Selection
    newSpecieSelectDiv.className = 'col-xs-3';
    let newSpecieSelect = document.createElement('select');
    newSpecieSelect.id = "blocktracer" + BLOCKTRACER_ID;
    newSpecieSelect.className = "form-control blockTracerSpecie";
    let list_species = getValuesOfDOMObjects("#specieX option"), species_html = '';
    for (specie of list_species) {
        species_html += '<option value="' + specie + '">' + specie + '</option>';
    }
    newSpecieSelect.innerHTML = species_html;

    // Append Specie Selection
    newSpecieSelectDiv.appendChild(newSpecieSelect);
    newRow.appendChild(newSpecieSelectDiv);

    // Create Chromosome Selection
    newChromosomeSelectDiv.className = 'col-xs-6';
    newChromosomeSelectDiv.innerHTML = '<select id="blocktracer' + BLOCKTRACER_ID + '" multiple class="selectpicker" data-live-search="true" title="Select chromosomes..." data-actions-box="true">';

    // Append Chromosome Selection
    newRow.appendChild(newChromosomeSelectDiv);

    // Create and Append Buttons
    newButtonDiv.className = 'col-xs-3';
    newButtonDiv.innerHTML = '<button id="blocktracer' + BLOCKTRACER_ID + '" type="button" class="btn btn-info" onclick="addNewblockTracerRow(' + BLOCKTRACER_ID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="plus"></bs-glyphicon></button>';
    if (erase == true) newButtonDiv.innerHTML = newButtonDiv.innerHTML + '<button type="button" class="btn btn-warning" onclick="removeBlockTracerRow(' + BLOCKTRACER_ID + ')" data-toggle="tooltip" title="Add new BlockTracer selection" data-placement="bottom"><bs-glyphicon icon="minus"></bs-glyphicon></button>';

    newRow.appendChild(newButtonDiv);

    // --- Append at index
    document.querySelector('#blockTracerRow' + id).after(newRow);
    // Add behavior
    blockTracerSelectedSpecieBehavior("blocktracer" + BLOCKTRACER_ID);
    blockTracerButtonBehavior();
}

// Remove BlockTracerRow
function removeBlockTracerRow(id) {
    $('#blockTracerRow' + id).remove();
    blockTracerButtonBehavior();
}

// Clear all BlockTracerRow
function clearAllBlockTracerRow() {
    $(".blockTracerRow").remove();
    blockTracerButtonBehavior();
}

// Chromosome List Behavior
function chromosomeListBehavior(listChromosomes, blockTracerSpecieID) {
    data_string = "";
    for (chromosome of listChromosomes) {
        data_string += '<option value="' + chromosome + '">' + chromosome + '</option>'
    }
    $("select.selectpicker#" + blockTracerSpecieID).html(data_string);
    $("select.selectpicker#" + blockTracerSpecieID).selectpicker('refresh');
}

// Selected Specie Request Behavior
function blockTracerSelectedSpecieBehavior(blockTracerSpecieID, callback = $.noop) {
    $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/chromosomes",
        data: {
            'specie': $("#" + blockTracerSpecieID + " option:selected").text()
        },
        success: function (content) {
            list_chromosomes = JSON.parse(content).sort(naturalCompare);
            chromosomeListBehavior(list_chromosomes, blockTracerSpecieID);
            callback();
        }
    });
}

function changeSpecieAndChromosome(specieSelect, chromosomeSelect, specie, chromosome, blockTracerIndex, callback = $.noop) {
    let values = [];
    specieSelect.val(specie);
    blockTracerSelectedSpecieBehavior("blocktracer" + blockTracerIndex, function () {
        values = (chromosome != "Overlay") ? [chromosome] : CURRENT_OVERLAY.chromosome_numbers.map(x => x[1]);
        chromosomeSelect.selectpicker('val', values);
        callback();
    });
}

// Export selected overlay to blocktracer
function exportToBlockTracer(spX, chrX, spY, chrY) {
    // Check if LOCAL or SERVER
    let changeIndex = 0;
    if (SOURCE_OVERLAY == "SERVER") {
        // Server BlockTrace
        let blockTracerRows = [], specieSelects = [], chromosomeSelects = [];
        $(".blockTracerRow").each(function (i, d) {
            if (i == changeIndex || i == changeIndex + 1) blockTracerRows.push(d.id[d.id.length - 1])
        });

        for (blockTracerIndex in blockTracerRows) {
            let selects = $("select#blocktracer" + blockTracerIndex), specieSelect = $(selects[0]),
                chromosomeSelect = $(selects[1]);

            specieSelects.push(specieSelect);
            chromosomeSelects.push(chromosomeSelect);
            chromosomeSelect.selectpicker();

            if (blockTracerIndex == changeIndex) {
                changeSpecieAndChromosome(specieSelect, chromosomeSelect, spX, chrX, blockTracerIndex);
            }
            if (blockTracerIndex == changeIndex + 1) {
                changeSpecieAndChromosome(specieSelect, chromosomeSelect, spY, chrY, blockTracerIndex, function () {
                    $("a[href='#blockTracerSideMenu']").tab('show')
                });
            }
        }
    } else if (SOURCE_OVERLAY == "LOCAL") {
        alert('BlockTracer not implemented for Local files, yet.')
    }
}

function extractBlockTracerRowSpecie(rowElement) {
    return rowElement.children[0].children[0].value;
}

function extractBlockTracerRowsData() {
    let blockTracerRows = document.getElementsByClassName('blockTracerRow');
    let blockTracerSpecies = [];
    [].forEach.call(blockTracerRows, row => {
        blockTracerSpecies.push(extractBlockTracerRowSpecie(row))
    });

    let blockTracerChromosomes = getValuesOfDOMObjectsByParentKeyID("select.selectpicker option:selected");
    blockTracerChromosomes = Object.keys(blockTracerChromosomes).map(function (key) {
        return blockTracerChromosomes[key];
    });

    return [blockTracerSpecies, blockTracerChromosomes]
}

// ---------------------------
/* --- BlockTracer Main --- */
// ---------------------------

var BLOCK_TRACER_PARAMS = {'species': [], 'chromosomes': [], 'results': {}};

function executeBlockTracer() {

    hideAnnotationProduct();
    hideSelectedAnnotation();
    hideAnnotation();

    let data = extractBlockTracerRowsData();
    let species = data[0], chromosomes = data[1], emptyCheck = document.getElementById('emptyChromosomesCheck').checked;
    //console.log(data);

    overlayOn();
    spinnerOn("Tracing Blocks...");
    if (BLOCK_TRACER_PARAMS.species.toString() == species.toString() && BLOCK_TRACER_PARAMS.chromosomes.toString() == chromosomes.toString()) {
        let currSpecies = $.extend(true, [], BLOCK_TRACER_PARAMS.species),
            currChromosomes = $.extend(true, [], BLOCK_TRACER_PARAMS.chromosomes),
            currResults = $.extend(true, {}, BLOCK_TRACER_PARAMS.results);

        if (emptyCheck) emptyChromosomesCheck(currSpecies, currChromosomes, currResults.lengths, currResults.non_empty);
        // PAINT
        paintBlockTracer(currSpecies, currChromosomes, currResults.events, currResults.lengths, $("#verticalBT").hasClass('active'));
        $("#blockModalButton").prop('disabled', false);
        showAlert("Loaded", "BlockTracer succesfully finished", "info");
        generateBlockInfos();
    } else
        $.ajax({
            type: "POST",
            url: FORCE_URL + "/blocktracer/trace/",
            data: {
                'species': JSON.stringify(species),
                'chromosomes': JSON.stringify(chromosomes)
            },
            success: function (content) {
                results = JSON.parse(content);
                //console.log(results);
                BLOCK_TRACER_PARAMS = {
                    'species': $.extend(true, [], species),
                    'chromosomes': $.extend(true, [], chromosomes),
                    'results': $.extend(true, {}, results)
                };

                if (emptyCheck) emptyChromosomesCheck(species, chromosomes, results.lengths, results.non_empty);

                paintBlockTracer(species, chromosomes, results.events, results.lengths, $("#verticalBT").hasClass('active'));
                $("#blockModalButton").prop('disabled', false);
                showAlert("Loaded", "BlockTracer succesfully finished", "info");
                generateBlockInfos();
            }
        });
}

function emptyChromosomesCheck(species, chromosomes, lengths, non_empty) {
    let non_empty_list = [];
    //console.log("EMPTY-CHECK");

    for (resultsExists of non_empty) {
        let items = resultsExists.split(' - ');
        non_empty_list.push([items[0], items[1]]);
    }

    non_empty_items = non_empty_list.sort(function (a, b) {
        if (a[0] == b[0]) return chromosomes[species.indexOf(a[0])].indexOf(a[1]) - chromosomes[species.indexOf(b[0])].indexOf(b[1]);
        return species.indexOf(a[0]) - species.indexOf(b[0]);
    });

    for (spIndex in species) {
        let curr_specie = species[spIndex], curr_chromosomes = chromosomes[spIndex], new_chromosomes = [],
            curr_lengths = lengths[curr_specie], new_lengths = {};
        for (non_empty of non_empty_list) {
            if (non_empty[0] == curr_specie && curr_chromosomes.indexOf(non_empty[1]) != -1) {
                new_chromosomes.push(non_empty[1]);
                new_lengths[non_empty[1]] = curr_lengths[non_empty[1]];
            }
        }
        chromosomes[spIndex] = new_chromosomes;
        lengths[curr_specie] = new_lengths;
    }
}

// ---------------------------
/* --- BlockTracer Draw --- */
// ---------------------------

var INTERSPECIE_SPACE = 500;
var INTERCHROMOSOME_SPACE = 200;
var CHROMOSOME_BASELINE_HEIGHT = 5;
var BLOCK_BASE_HEIGHT = 30;
var BASELINE_EDGES_WIDTH = 5;
var CHROMO_LABEL_OFFSET = -50;
var SPECIES_LABEL_OFFSET_X = -60;
var SPECIES_LABEL_OFFSET_Y = 40;
var MINIMUM_CHROMOSOME_PIXELS = 800;

var selectedBlock, svgInverted, trace, currentBlockInfo;


function paintBlockTracer(species, chromosomes, events, lengths, inverted) {
    var MAX_SPECIES_LENGTHS = getSumOfDictValuesFromDict(lengths),
        //MAX_CHROMOSOME_LENGTH = getMaxOfDictValuesFromDict(lengths),
        LENGTH_PREPENDS = getArrayOfSumsFromDict(lengths),
        CHROMOSOMES_PER_SPECIE = Object.values(chromosomes).map(o => o.length),
        MAX_CHROMOSOME_PER_SPECIES = Math.max.apply(Math, Object.values(CHROMOSOMES_PER_SPECIE.map(function (o) {
            return o;
        }))),
        MAX_FULL_LENGTH = getMaxOfDictValuesFromDict({1: MAX_SPECIES_LENGTHS});

    //console.log("--- DEBUG1 ---"); console.log("MAX_SPECIES_LENGTHS", MAX_SPECIES_LENGTHS); console.log("LENGTH_PREPENDS", LENGTH_PREPENDS); console.log("CHROMOSOMES_PER_SPECIE", CHROMOSOMES_PER_SPECIE); console.log("MAX_CHROMOSOME_PER_SPECIES", MAX_CHROMOSOME_PER_SPECIES); console.log("MAX_FULL_LENGTH", MAX_FULL_LENGTH);

    var WIDTH = MAX_CHROMOSOME_PER_SPECIES * MINIMUM_CHROMOSOME_PIXELS, // (MAX_CHROMOSOME_PER_SPECIES*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 :
        HEIGHT = (species.length - 1) * INTERSPECIE_SPACE, //(species.length*MINIMUM_CHROMOSOME_PIXELS < 1000) ? 1000 :
        MARGINS = {
            top: 50,
            right: 30,
            bottom: 30,
            left: 100
        };

    var WIDTH = WIDTH - MARGINS.left - MARGINS.right,
        HEIGHT = HEIGHT - MARGINS.top - MARGINS.bottom;

    // Clear SVG
    var svg = d3.select(".blocktracer > svg");
    if (!svg.empty()) {
        svg.remove();
    }

    // -------- 
    // Scales
    //Set ColorScale
    var widthDomain = [0, MAX_FULL_LENGTH],
        widthRange = [0, WIDTH - (INTERCHROMOSOME_SPACE * MAX_CHROMOSOME_PER_SPECIES)],
        heightDomain = species,
        heightRange = [25, HEIGHT];

    //Set Scales
    var xScale = d3.scale.linear()
        .domain(widthDomain)
        .range(widthRange);
    var yScale = d3.scale.ordinal()
        .domain(heightDomain)
        .rangeBands(heightRange);

    //Set Axes
    var xAxis = d3.svg.axis()
        .scale((!inverted) ? xScale : yScale);
    var yAxis = d3.svg.axis()
        .scale((!inverted) ? yScale : xScale);

    // DEBUG :: console.log("--- DEBUG2 ---"); console.log(colorScale); console.log(xAxis); console.log(yAxis); //console.log(xScale); console.log(yScale);
    // --------
    // Draw SVG
    let svgWidth = WIDTH + MARGINS.left + MARGINS.right,
        svgHeight = HEIGHT + MARGINS.top + MARGINS.bottom;

    svg = d3.select('.blocktracer')
        .append("svg")
        .attr(getPositionAttribute('width', inverted), svgWidth)
        .attr(getPositionAttribute('height', inverted), svgHeight)
        .attr("class", 'blocktracer-svg')
        .append('g')
        .attr('transform', (!inverted) ? 'translate(' + MARGINS.left + ',' + MARGINS.top + ')' : 'translate(' + MARGINS.top + ',' + MARGINS.left + ')');

    // Setup data
    var preparedData = prepareBlockTracerData(species, chromosomes, lengths, events, LENGTH_PREPENDS);
    // DEBUG :: 
    //console.log("--- DEBUG3 ---"); console.log(preparedData);
    // ---
    // Draw chromosome lines
    var chromosomeBaseLines = svg.selectAll('chromoBase')
        .data(preparedData.baselineData)
        .enter().append('g').classed('chromoBase', true);

    chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function (d) {
            return xScale(d.x1) + INTERCHROMOSOME_SPACE * d.index;
        })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie);
        })
        .attr(getPositionAttribute('width', inverted), function (d) {
            return xScale(d.x2);
        })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT);

    // 3'-5'
    chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function (d) {
            return xScale(d.x1) + INTERCHROMOSOME_SPACE * d.index - BASELINE_EDGES_WIDTH;
        })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie) - CHROMOSOME_BASELINE_HEIGHT;
        })
        .attr(getPositionAttribute('width', inverted), function (d) {
            return BASELINE_EDGES_WIDTH;
        })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT * 2);

    // 5'-3'
    chromosomeBaseLines.append('rect')
        .attr('class', 'chromosomeBaseline')
        .attr(getPositionAttribute('x', inverted), function (d) {
            return xScale(d.x2) + xScale(d.x1) + INTERCHROMOSOME_SPACE * d.index;
        })/*s[d.specie]*/
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie);
        })
        .attr(getPositionAttribute('width', inverted), function (d) {
            return BASELINE_EDGES_WIDTH;
        })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), CHROMOSOME_BASELINE_HEIGHT * 2);

    // DEBUG :: console.log("--- DEBUG4 ---"); console.log(chromosomeBaseLines);
    // --------

    // Setup BlockInfo groups
    var tracedBlocks = svg.selectAll('blockInfo')
        .data(preparedData.eventData)
        .enter().append('g').classed('blockInfo', true);
    //console.log('tracedBlocks');
    //console.log(tracedBlocks);
    // Draw blocks
    tracedBlocks.append('rect')
        .attr('class', function (d) {
            return 'tracedBlock block' + d.block_id
        })
        .attr(getPositionAttribute('x', inverted), function (d) {
            return xScale(d.prepend + d.x1) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
            //paintAnnotation(tracedBlocks, d.specie, pos_x, yScale(d.specie) + d.y_gap, xScale(2713156), xScale(2813156));
            //return  pos_x;
        })/*s[d.specie] */
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie) + d.y_gap;
        })
        .attr(getPositionAttribute('width', inverted), function (d) {
            return xScale(d.x2) - xScale(d.x1);
        })/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), BLOCK_BASE_HEIGHT)
        .attr('fill', function (d) {
            return d.color
        }) //preparedData.colors[d.block_id]
        .on("click", function (d) {
            //========> ANNOTATION
            hideAnnotationProduct();
            hideConnectionLines();
            selectedBlock = d3.select(this);
            svgInverted = inverted;
            //
            if (d3.select(this).classed("clicked")) {
                svg.selectAll("rect")
                    .style("opacity", 1)
                    .style("z-index", 10)
                    .classed("clicked", false);

                //========> ANNOTATION
                d3.selectAll('#annotation_block').remove();
                hideAnnotation();
                hideSelectedAnnotation();
                hideAnnotationProduct()

            } else {
                d3.select(this).classed("clicked");
                var block_id = d.block_id;
                svg.selectAll("rect").filter(".tracedBlock")
                    .style("opacity", function (d2) {
                        return d2.block_id == block_id ? 1 : 0.3;
                    })
                    .style("z-index", function (d2) {
                        return d2.block_id == block_id ? 10 : 1
                    })
                    .classed("clicked", function () {
                        if (d3.select(this).style("opacity") == 1) return true;
                        else return false;
                    });

                svg.selectAll('line').filter(".linesBlock")
                    .style("opacity", function (d2) {
                        return d2.block_id == block_id ? 1 : 0;
                    })
                    .classed("clicked", function () {
                        if (d3.select(this).style("opacity") == 1) return true;
                        else return false;
                    });

                //========> ANNOTATION
                d3.selectAll('#annotation_block').remove();
                showAnnotation();
                resetPagination();
                let chromosome = selectedBlock[0][0].__data__.chromosome.toUpperCase();
                getAnnotationBetweenPaginated(d.specie, d.x1, d.x2, page_start, page_end, chromosome).done(function (response) {
                    appendInfo(d.specie, d.x1, d.x2, '#annotation-top');
                    populateTable(response, '#annotation-content');

                    $("#input-search").val(0);
                    showPageInfo(d.specie, d.x1, d.x2);
                });

                //console.log(getGapsCSV(d.specie, d.x1, d.x2));
                //console.log('Ocultando seleccion');
                hideSelectedAnnotation();
                //saveGapsCSV(d.specie, d.x1, d.x2);

                //paintGaps(d.x1, d.x2);

                trace = d3.selectAll('.tracedBlock.clicked');
                simplifyTrace();
                /*console.log('tracedBlocks');
                console.log(tracedBlocks);
                console.log('trace');
                console.log(trace);*/
                //console.log("--- DEBUG ANNO1 ---"); console.log("x1: ", d.x1); console.log("x2: ", d.x2); console.log("x2-x1: ", d.x2 -d.x1); console.log("specie: ", d.specie);
            }
        });

    // INICIO DE BLOQUE
    tracedBlocks.append('rect')
        .attr(getPositionAttribute('x', inverted), function (d) {
            /*console.log("--- DEBUG ANNO2 ---");
            console.log("BlockID: ", d.block_id);
            console.log("Starting point: ", xScale(d.prepend + d.x1) + INTERCHROMOSOME_SPACE*(d.chromoIndex));
            console.log("prepend: ", d.prepend);//Espacio acumulado de los anteriores cromosomas
            console.log("xScale: ", xScale(d.prepend + d.x1));
            console.log("without_xScale: ", d.prepend + d.x1);
            console.log("interchromosome_space: ",INTERCHROMOSOME_SPACE);
            console.log("chromoIndex:", (d.chromoIndex));*/
            return xScale(d.prepend + d.x1) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
        })/*s[d.specie] */
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie) + d.y_gap;
        })
        .attr(getPositionAttribute('width', inverted), 1)/*s[d.specie]*/
        .attr(getPositionAttribute('height', inverted), BLOCK_BASE_HEIGHT)
        .attr('fill', "black");
    // -------------------

    // DEBUG :: console.log("--- DEBUG5 ---"); console.log(tracedBlocks);
    // --------
    // Draw blocks and connection lines
    // Lower blocks
    var STROKE_WIDTH = 6, LINE_BLOCK_DIFF = 10;

    var bottomLines = svg.selectAll('bottomLine')
        .data(preparedData.bottomLines)
        .enter().append('g').classed('bottomLine', true)
        .append('line')
        .attr("class", function (d) {
            return "horizontalBlock linesBlock linesBlockInfo" + d.block_id
        })
        .attr(getPositionAttribute('x1', inverted), function (d) {
            return xScale(d.x1 + d.prepend) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
        })
        .attr(getPositionAttribute('x2', inverted), function (d) {
            return xScale(d.x2 + d.prepend) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
        })
        .attr(getPositionAttribute('y1', inverted), function (d) {
            return yScale(d.specie) + BLOCK_BASE_HEIGHT + CHROMOSOME_BASELINE_HEIGHT + LINE_BLOCK_DIFF - STROKE_WIDTH / 2;
        })
        .attr(getPositionAttribute('y2', inverted), function (d) {
            return yScale(d.specie) + BLOCK_BASE_HEIGHT + CHROMOSOME_BASELINE_HEIGHT + LINE_BLOCK_DIFF - STROKE_WIDTH / 2;
        })
        .style("opacity", 0)
        .style('stroke', function (d) {
            return d.color
        })
        .style('stroke-width', STROKE_WIDTH);


    // Upper blocks
    var upperLines = svg.selectAll('upperLine')
        .data(preparedData.upperLines)
        .enter().append('g').classed('upperLine', true)
        .append('line')
        .attr("class", function (d) {
            return "horizontalBlock linesBlock linesBlockInfo" + d.block_id
        })
        .attr(getPositionAttribute('x1', inverted), function (d) {
            return xScale(d.x1 + d.prepend) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
        })
        .attr(getPositionAttribute('x2', inverted), function (d) {
            return xScale(d.x2 + d.prepend) + INTERCHROMOSOME_SPACE * (d.chromoIndex);
        })
        .attr(getPositionAttribute('y1', inverted), function (d) {
            return yScale(d.specie) - BLOCK_BASE_HEIGHT - LINE_BLOCK_DIFF + STROKE_WIDTH / 2;
        })
        .attr(getPositionAttribute('y2', inverted), function (d) {
            return yScale(d.specie) - BLOCK_BASE_HEIGHT - LINE_BLOCK_DIFF + STROKE_WIDTH / 2;
        })
        .style("opacity", 0)
        .style('stroke', function (d) {
            return d.color
        })
        .style('stroke-width', STROKE_WIDTH);


    // Connection lines
    var connectionLines = svg.selectAll('connectLine')
        .data(preparedData.connectionLines)
        .enter().append('g').classed('connectionLine', true);

    connectionLines.append('line')
        .attr("class", function (d) {
            return "pairedLine linesBlock linesBlockInfo" + d.block_id
        })
        .attr(getPositionAttribute('x1', inverted), function (d) {
            return xScale(d.x1 + d.prependX) + INTERCHROMOSOME_SPACE * (d.chromoXIndex);
        })
        .attr(getPositionAttribute('x2', inverted), function (d) {
            return xScale(d.y1 + d.prependY) + INTERCHROMOSOME_SPACE * (d.chromoYIndex);
        })
        .attr(getPositionAttribute('y1', inverted), function (d) {
            return yScale(d.specieX) + BLOCK_BASE_HEIGHT + CHROMOSOME_BASELINE_HEIGHT + LINE_BLOCK_DIFF;
        })
        .attr(getPositionAttribute('y2', inverted), function (d) {
            return yScale(d.specieY) - BLOCK_BASE_HEIGHT - LINE_BLOCK_DIFF;
        })
        .style("opacity", 0)
        .style('stroke', function (d) {
            return d.color
        })
        .style('stroke-width', 1);

    connectionLines.append('line')
        .attr("class", function (d) {
            return "pairedLine linesBlock linesBlockInfo" + d.block_id
        })
        .attr(getPositionAttribute('x1', inverted), function (d) {
            return xScale(d.x2 + d.prependX) + INTERCHROMOSOME_SPACE * (d.chromoXIndex);
        })
        .attr(getPositionAttribute('x2', inverted), function (d) {
            return xScale(d.y2 + d.prependY) + INTERCHROMOSOME_SPACE * (d.chromoYIndex);
        })
        .attr(getPositionAttribute('y1', inverted), function (d) {
            return yScale(d.specieX) + BLOCK_BASE_HEIGHT + CHROMOSOME_BASELINE_HEIGHT + LINE_BLOCK_DIFF;
        })
        .attr(getPositionAttribute('y2', inverted), function (d) {
            return yScale(d.specieY) - BLOCK_BASE_HEIGHT - LINE_BLOCK_DIFF;
        })
        .style("opacity", 0)
        .style('stroke', function (d) {
            return d.color
        })
        .style('stroke-width', 1);

    var singleConnectionLines = svg.selectAll('singleConnectLine')
        .data(preparedData.singleConnectionLines)
        .enter().append('g').classed('singleConnectLine', true)
        .append('line')
        .attr("class", function (d) {
            return "singleLineBlock singleLineBlockInfo" + d.block_id
        })
        .attr(getPositionAttribute('x1', inverted), function (d) {
            return xScale(d.x1 + d.prependX) + INTERCHROMOSOME_SPACE * (d.chromoXIndex);
        })
        .attr(getPositionAttribute('x2', inverted), function (d) {
            return xScale(d.y1 + d.prependY) + INTERCHROMOSOME_SPACE * (d.chromoYIndex);
        })
        .attr(getPositionAttribute('y1', inverted), function (d) {
            return yScale(d.specieX) + BLOCK_BASE_HEIGHT + CHROMOSOME_BASELINE_HEIGHT + LINE_BLOCK_DIFF;
        })
        .attr(getPositionAttribute('y2', inverted), function (d) {
            return yScale(d.specieY) - BLOCK_BASE_HEIGHT - LINE_BLOCK_DIFF;
        })
        .style("opacity", 0)
        .style('stroke', function (d) {
            return d.color
        })
        .style('stroke-width', 1);
    // DEBUG :: console.log("--- DEBUG6 ---"); console.log(bottomLines); console.log(upperLines); console.log(connectionLines);
    // --------
    // Draw labels

    var chromosomeLabels = svg.selectAll('chromosomeLabel')
        .data(preparedData.chromoLabels)
        .enter().append('g').classed('chromosomeLabel', true)
        .append('text')
        .attr('class', 'chromosomeLabelText')
        .attr(getPositionAttribute('x', inverted), function (d) {
            let factor = (!inverted) ? 1 : 0.5;
            return xScale(d.x) + CHROMO_LABEL_OFFSET * factor + INTERCHROMOSOME_SPACE * (d.index);
        })
        .attr(getPositionAttribute('y', inverted), function (d) {
            return yScale(d.specie)
        })
        .text(function (d) {
            return 'Chr ' + d.chromosome
        });
    //.attr("transform", function(d) { let offset = (d.x == 0) ? -1 : 1, newX =  xScale(d.x) + CHROMO_LABEL_OFFSET*offset; return "rotate(-45, " + newX + ", " + yScale(d.specie) + ")" });

    var speciesLabels = svg.selectAll('specieLabel')
        .data(species)
        .enter().append('g').classed('specieLabel', true)
        .append('text')
        .attr('class', 'specieLabelText')
        .attr('font-weight', 'bold')
        .attr('font-size', '2em')
        .attr(getPositionAttribute('x', inverted), SPECIES_LABEL_OFFSET_X)
        .attr(getPositionAttribute('y', inverted), function (d) {
            let factor = (!inverted) ? 1 : -1;
            return yScale(d) + SPECIES_LABEL_OFFSET_Y * factor
        })
        .text(function (d) {
            return d
        })
        .attr("transform", function (d) {
            if (!inverted) return "rotate(-90, " + SPECIES_LABEL_OFFSET_X + ", " + (yScale(d) + SPECIES_LABEL_OFFSET_Y) + ")";
            else return "translate(0,0)"
        });

    overlayOff();
    spinnerOff();
}

var N_SLICES = 20, MULTIPLIER = 2, PREFIX_FACTOR = 1;

function prepareBlockTracerData(species, chromosomes, lengths, events, prepends) {
    let baselineData = [], eventData = [], bottomLines = [], upperLines = [], connectionLines = [],
        singleConnectionLines = [], chromoLabels = [];
    // Chromosome Labels
    Object.entries(prepends).map(function (specie_prepends) {
        let specie = specie_prepends[0],
            chromos = chromosomes[species.indexOf(specie)],
            values = specie_prepends[1];
        for (i in values) {
            chromoLabels.push({'specie': specie, 'chromosome': chromos[i], 'x': values[i], 'index': i})
        }
    });

    // Chromosome Baseline
    for (specieIndex in species) {
        let specie = species[specieIndex],
            chromos = chromosomes[specieIndex],
            added_space = 0;
        for (chrIndex in chromos) {
            let chr = chromos[chrIndex];
            curr_len = lengths[specie][chr];
            baselineData.push({
                'specie': specie,
                'chromosome': chr,
                'x1': added_space,
                'x2': curr_len,
                'index': parseInt(chrIndex)
            });
            added_space += curr_len
        }
    }

    // Colors

    // EventData + Colors + Connection Lines
    let blockID = 0;
    for (eventIndex in events) {
        let event = events[eventIndex];
        let currentColor = "#" + fullColorHex(R_color[eventIndex % R_color.length], G_color[eventIndex % R_color.length], B_color[eventIndex % R_color.length]);
        let combinationColors = tinycolor(currentColor).analogous(results = event.blocks.length * MULTIPLIER, N_SLICES);
        let colorPrefix = PREFIX_FACTOR * event.blocks.length;

        for (blockIndex in event.blocks) {
            let blocks = event.blocks[blockIndex],
                eventsColor = combinationColors[colorPrefix + parseInt(blockIndex)], modifier = blockIndex % 3;
            eventsColor = (modifier == 0) ? eventsColor.darken().toHexString() : eventsColor;
            eventsColor = (modifier == 1) ? eventsColor.lighten().toHexString() : eventsColor;
            eventsColor = (modifier == 2) ? eventsColor.saturate().toHexString() : eventsColor;

            for (blockInfoIndex in blocks) {
                let block_info = blocks[blockInfoIndex];

                let specieXIndex = species.indexOf(block_info.info.spX),
                    chrXIndex = chromosomes[specieXIndex].indexOf(block_info.info.chrX),
                    specieYIndex = species.indexOf(block_info.info.spY),
                    chrYIndex = chromosomes[specieYIndex].indexOf(block_info.info.chrY),
                    x1 = block_info.overlap.x1, x2 = block_info.overlap.x2,
                    y1 = block_info.overlap.y1, y2 = block_info.overlap.y2,
                    chrX_y_gap = -BLOCK_BASE_HEIGHT, chrY_y_gap = -BLOCK_BASE_HEIGHT;

                let currentCond = (block_info.overlap.inverted == true),
                    prevCond = (blockInfoIndex > 0) ? (blocks[blockInfoIndex - 1].overlap.inverted == true) : false;

                if (prevCond) {
                    if (currentCond) {
                        chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT;
                    } else {
                        chrX_y_gap = CHROMOSOME_BASELINE_HEIGHT;
                        chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT;
                    }
                } else {
                    if (currentCond) {
                        chrY_y_gap = CHROMOSOME_BASELINE_HEIGHT;
                    }
                }

                if (eventData.length == 0 || (eventData[eventData.length - 1].x1 != x1 && eventData[eventData.length - 1].x2 != x2))
                    eventData.push({
                        'block_id': blockID, 'specie': block_info.info.spX, 'chromosome': block_info.info.chrX,
                        'specieIndex': specieXIndex, 'chromoIndex': chrXIndex, 'color': eventsColor,
                        'x1': x1, 'x2': x2,
                        'prepend': prepends[block_info.info.spX][chrXIndex], 'y_gap': chrX_y_gap
                    });

                eventData.push({
                    'block_id': blockID, 'specie': block_info.info.spY, 'chromosome': block_info.info.chrY,
                    'specieIndex': specieYIndex, 'chromoIndex': chrYIndex, 'color': eventsColor,
                    'x1': y1, 'x2': y2,
                    'prepend': prepends[block_info.info.spY][chrYIndex], 'y_gap': chrY_y_gap
                });

                bottomLines.push({
                    'block_id': blockID, 'specie': block_info.info.spX, 'color': eventsColor,
                    'specieIndex': specieXIndex, 'chromoIndex': chrXIndex,
                    'x1': x1, 'x2': x2,
                    'prepend': prepends[block_info.info.spX][chrXIndex]
                });

                upperLines.push({
                    'block_id': blockID, 'specie': block_info.info.spY, 'color': eventsColor,
                    'specieIndex': specieYIndex, 'chromoIndex': chrYIndex,
                    'x1': y1, 'x2': y2,
                    'prepend': prepends[block_info.info.spY][chrYIndex]
                });

                connectionLines.push({
                    'block_id': blockID,
                    'color': eventsColor,
                    'specieX': block_info.info.spX,
                    'chromoXIndex': chrXIndex,
                    'specieY': block_info.info.spY,
                    'chromoYIndex': chrYIndex,
                    'prependX': prepends[block_info.info.spX][chrXIndex],
                    'prependY': prepends[block_info.info.spY][chrYIndex],
                    'x1': x1,
                    'x2': x2,
                    'y1': (currentCond) ? y2 : y1,
                    'y2': (currentCond) ? y1 : y2
                });

                singleConnectionLines.push({
                    'block_id': blockID,
                    'color': eventsColor,
                    'specieX': block_info.info.spX,
                    'chromoXIndex': chrXIndex,
                    'specieY': block_info.info.spY,
                    'chromoYIndex': chrYIndex,
                    'prependX': prepends[block_info.info.spX][chrXIndex],
                    'prependY': prepends[block_info.info.spY][chrYIndex],
                    'x1': x1 + (x2 - x1) / 2,
                    'y1': y1 + (y2 - y1) / 2
                })
            }
            blockID++;
        }
    }
    blockTracerBaseConfig();

    return {
        'baselineData': baselineData, 'eventData': eventData, 'bottomLines': bottomLines, 'upperLines': upperLines,
        'connectionLines': connectionLines, 'singleConnectionLines': singleConnectionLines, 'chromoLabels': chromoLabels
    };
}

function getArrayOfSumsFromDict(array_dict) {
    let ret = {};
    Object.entries(array_dict).map(function (key_val) {
        let tmp_list = [0], values = Object.values(key_val[1]);
        for (i in values) {
            if (i != 0) tmp_list.push(Object.values(key_val[1]).slice(0, i).reduce(function (a, b) {
                return a + b
            }));
        }
        ret[key_val[0]] = tmp_list;
    });
    return ret;
}

function getSumOfDictValuesFromDict(array_dict) {
    let sums = {};
    Object.entries(array_dict).map(function (key_val) {
        sums[key_val[0]] = Object.values(key_val[1]).reduce((a, b) => a + b)
    });
    return sums;
}

function getMaxOfDictValuesFromDict(array_dict) {
    let objects = [];
    Object.values(array_dict).map(function (array) {
        Object.values(array).map(o => objects.push(o))
    });
    return Math.max.apply(Math, Object.values(objects.map(function (o) {
        return o;
    })))
}

function getPositionAttribute(attribute, inverted) {
    if (!inverted) return attribute;
    else { //width, height, x1, x2, x, y1, y2, y
        let ret;
        if (attribute.includes('x')) ret = attribute.replace('x', 'y');
        else if (attribute.includes('y')) ret = attribute.replace('y', 'x');
        else if (attribute.includes('width')) ret = attribute.replace('width', 'height');
        else if (attribute.includes('height')) ret = attribute.replace('height', 'width');
        return ret;
    }
}

// ---------------------
// --- Document Init ---
// ---------------------

$(document).ready(function () {
    addNewblockTracerRow(BLOCKTRACER_ID, false);
    document.getElementById('blocktracer1').selectedIndex = 1;
    blockTracerSelectedSpecieBehavior("blocktracer0");
    blockTracerSelectedSpecieBehavior("blocktracer1");
});

// --- Document Changes ---
$(document).on('change', '.blockTracerSpecie', function () {
    blockTracerSelectedSpecieBehavior($(this).attr('id'));
    $('#blockTracerButton').prop("disabled", true);
});

$(document).on('changed.bs.select', 'select.selectpicker', function () {
    blockTracerButtonBehavior();
});

$('#blocktracerView .btn').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
});

// Show all connection linesbutton
$("#showConnectionLines").click(function () {
    var svg = d3.select(".blocktracer > svg");
    if (svg.empty()) showAlert("Warning", "Execute BlockTracer first", "danger");
    else if ($(this).children().attr('icon') == 'eye-open') showConnectionLines();
    else hideConnectionLines();
});
// Fit BlockTracer (Plabolize) button
$("#fitBlockTracer").click(function () {
    var svg = d3.select(".blocktracer > svg");
    if (svg.empty()) showAlert("Warning", "Execute BlockTracer first", "danger");
    else if ($(this).children().attr('icon') == 'resize-full') {
        fitBlockTracer();
        $(this).children().attr('icon', 'resize-small')
    } else {
        svg.attr('transform', null);
        $(this).children().attr('icon', 'resize-full')
    }

});
// blockModalButton
$('#blockModalButton').click(function () {
    let blockInfos = generateBlockInfos();
    generateBlockTable(blockInfos);
    generateSpecificZonesTable(blockInfos);
});

DOWNLOADABLE = {'traced': [], 'specific': []};
$("#downloadDataButton").click(function () {
    //console.log("TEST");
    let allBlocksActive = document.getElementById("allBlocks").classList.contains('active'),
        element = document.createElement('a'),
        filename = (allBlocksActive) ? "tracedBlocks.csv" : "specificZones.csv";
    data = (allBlocksActive) ? DOWNLOADABLE.traced : DOWNLOADABLE.specific;

    element.setAttribute('href', encodeDataToURI(data));
    element.setAttribute('download', filename);
    element.click();
});

$("#myModal").draggable({
    handle: ".modal-header"
});

function generateBlockInfos() {
    let blockInfos = [], blockID = 0;
    let events = BLOCK_TRACER_PARAMS.results.events;

    for (eventIndex in events) {
        let event = events[eventIndex];

        for (blockIndex in event.blocks) {
            let blocks = event.blocks[blockIndex];
            for (blockInfoIndex in blocks) {
                let block_info = blocks[blockInfoIndex];
                let x1 = block_info.overlap.x1, x2 = block_info.overlap.x2,
                    y1 = block_info.overlap.y1, y2 = block_info.overlap.y2;
                let currentCond = (block_info.overlap.inverted == true),
                    prevCond = (blockInfoIndex > 0) ? (blocks[blockInfoIndex - 1].overlap.inverted == true) : false;
                let strandX = 'f', strandY = 'f';

                if (prevCond) {
                    if (currentCond) {
                        strandX = 'f';
                        strandY = 'r'
                    } else {
                        strandX = 'r';
                        strandY = 'r';
                    }
                } else {
                    if (currentCond) {
                        strandY = 'r';
                    }
                }

                if (blockInfos.length == 0 || (blockInfos[blockInfos.length - 1].x1 != x1 && blockInfos[blockInfos.length - 1].x2 != x2))
                    blockInfos.push({
                        'block_id': blockID, 'specie': block_info.info.spX, 'chromosome': block_info.info.chrX,
                        'x1': x1, 'x2': x2, 'strand': strandX
                    });

                blockInfos.push({
                    'block_id': blockID, 'specie': block_info.info.spY, 'chromosome': block_info.info.chrY,
                    'x1': y1, 'x2': y2, 'strand': strandY
                })
            }
            blockID++;

            currentBlockInfo = blockInfos;
        }
    }
    return blockInfos;
}

function generateBlockTable(blockInfos, filter = "") {
    let modalBody = document.getElementById('blockInfoTableBody');
    let HTMLText = "";

    DOWNLOADABLE.traced = $.extend(true, [], blockInfos);
    for (block of blockInfos) {
        HTMLText += "<tr> <th>" + block.block_id + "</th> <td>" + block.specie + "</td> <td>" + block.chromosome + "</td> <td>" + block.x1 + "</td> <td>" + block.x2 + "</td> <th>" + block.strand + "</td> </tr>"
    }

    modalBody.innerHTML = HTMLText;
}

function generateSpecificZonesTable(blockInfos) {
    let modalBody = document.getElementById('specificZoneInfoTableBody');
    let HTMLText = "";
    let zoneInfos = generateSpecificZones(blockInfos);

    DOWNLOADABLE.specific = $.extend(true, [], zoneInfos);
    for (i in zoneInfos) {
        block = zoneInfos[i];
        HTMLText += "<tr> <th>" + i + "</th> <td>" + block.specie + "</td> <td>" + block.chromosome + "</td> <td>" + block.x + "</td> <td>" + block.y + "</td> </tr>"
    }

    modalBody.innerHTML = HTMLText;
}

function generateSpecificZones(blockInfos) {
    let specificBlocks = [], sps = BLOCK_TRACER_PARAMS.species.slice(0, 2),
        chrs = BLOCK_TRACER_PARAMS.chromosomes.slice(0, 2),
        sortedBlocks = [[], []], //[new Array(chrs[0].length), new Array(chrs[0].length)],
        filteredBlocks = blockInfos.filter(function (x) {
            return (x.specie == sps[0] || x.specie == sps[1])
        });

    for (i in filteredBlocks) {
        let currBlock = filteredBlocks[i], spIndex = (currBlock.specie == sps[0]) ? 0 : 1,
            chrIndex = chrs[spIndex].indexOf(currBlock.chromosome);
        sortedBlocks[spIndex][chrIndex] = sortedBlocks[spIndex][chrIndex] || [];
        sortedBlocks[spIndex][chrIndex].push({'x1': currBlock.x1, 'x2': currBlock.x2})
    }

    let lengths = [[], []];
    Object.entries(BLOCK_TRACER_PARAMS.results.lengths).slice(0, 2).forEach(function (x, i) {
        lengths[i] = Object.values(x[1])
    });

    for (spBlockIndex in sortedBlocks) {
        for (chrBlockIndex in sortedBlocks[spBlockIndex]) {
            let chrBlocks = sortedBlocks[spBlockIndex][chrBlockIndex];
            if (typeof chrBlocks != "undefined") {
                //chrBlocks.sort(function(a,b) { return (a.x1 < b.x1) ? -1 : 1 } )
                let tmpObj = chrBlocks.reduce((acc, c) => Object.assign(acc, {[c.x1]: c.x2}), {});
                sortedBlocks[spBlockIndex][chrBlockIndex] = Object.keys(tmpObj)
                    .map(s => ({'x1': parseInt(s), 'x2': tmpObj[s]}))
                    .sort((a, b) => a.x1 - b.x1);

                let currCoord = 0;
                for (blockInfoIndex in sortedBlocks[spBlockIndex][chrBlockIndex]) {
                    let blockInfo = sortedBlocks[spBlockIndex][chrBlockIndex][blockInfoIndex];
                    if (currCoord != blockInfo.x1)
                        specificBlocks.push({
                            'specie': sps[spBlockIndex],
                            'chromosome': chrs[spBlockIndex][chrBlockIndex],
                            'x': currCoord,
                            'y': blockInfo.x1
                        });
                    currCoord = blockInfo.x2;
                }
                if (currCoord != lengths[spBlockIndex][chrBlockIndex])
                    specificBlocks.push({
                        'specie': sps[spBlockIndex],
                        'chromosome': chrs[spBlockIndex][chrBlockIndex],
                        'x': currCoord,
                        'y': lengths[spBlockIndex][chrBlockIndex]
                    });
            }
        }
    }

    return specificBlocks;
}

function blockTracerBaseConfig() {
    // Fit screen
    $("#fitBlockTracer").children().attr('icon', 'resize-full');
    // Connection lines
    $("#showConnectionLines").children().attr('icon', 'eye-open');
    document.getElementById('connectionLineText').innerHTML = "Show connection lines";
}

function showConnectionLines() {
    $("#showConnectionLines").children().attr('icon', 'eye-close');
    document.getElementById('connectionLineText').innerHTML = "Hide connection lines";

    let svg = d3.select(".blocktracer > svg");
    svg.selectAll("rect").filter(".tracedBlock").style("opacity", 1);
    svg = svg.selectAll('line');
    svg.filter(".pairedLine").style("opacity", 0);
    svg.filter(".singleLineBlock").style("opacity", 1);
    svg.filter(".horizontalBlock").style("opacity", 1);
}

function hideConnectionLines() {
    $("#showConnectionLines").children().attr('icon', 'eye-open');
    document.getElementById('connectionLineText').innerHTML = "Show connection lines";
    let svg = d3.select(".blocktracer > svg");
    svg.selectAll("rect").filter(".tracedBlock").style("opacity", 1);
    svg = svg.selectAll('line');
    svg.filter(".linesBlock").style("opacity", 0);
    svg.filter(".singleLineBlock").style("opacity", 0);
}

// Overlay by number behavior
function emptyChromosomesChecked() {
    var inputCheckbox = document.getElementById('emptyChromosomesCheck');

    if (inputCheckbox.checked) {
        console.log("HIDE EMPTY CHROMOSOMES");// Hide empty
    } else {
        console.log("SHOW EMPTY CHROMOSOMES");// Show empty
    }
}

function fitBlockTracer() {
    var svg = $(".blocktracer > svg"),
        blocktracerDiv = $(".blocktracer");

    var bb = svg[0].getBBox();
    var bbx = bb.x;
    var bby = bb.y;
    var bbw = bb.width;
    var bbh = bb.height;
    //---center of graph---
    var cx = bbx + .5 * bbw;
    var cy = bby + .5 * bbh;
    //---create scale: ratio of desired width/height vs current width/height--
    var width_total = blocktracerDiv.width();
    var height_total = blocktracerDiv.height();

    var curr_width = svg.width();
    var curr_height = svg.height();

    var scaleX = width_total / curr_width; //--if height use myHeight/bbh--
    var scaleY = height_total / curr_height;
    if (scaleX < scaleY) scale = scaleX; else scale = scaleY;
    //---move its center to target x,y --- translate("+transX+" "+transY+")
    var transX = cx * (scale - 1);
    var transY = cy * (scale - 1);

    svg[0].setAttribute("transform", "translate(" + transX + "," + transY + ")scale(" + scale + "," + scale + ")")
}


// ANNOTATIONS =========================================================================

function showAnnotation() {
    if ($('#show-annotation-feature').find('input').is(':checked')) $('#annotation-sidebar-wrapper').show();
}

function hideAnnotation() {
    if ($('#show-annotation-feature').find('input').is(':checked')) $('#annotation-sidebar-wrapper').hide();
}

function getAnnotationFrom(species, gen_x1, gen_x2, chromosome) {
    return $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/annotation_between/",
        data: {
            species: species,
            gen_x1: gen_x1,
            gen_x2: gen_x2,
            chromosome: chromosome
        }
    });
}

function traceAnnotation(species, gen_x1, gen_x2, product, note, blocks) {
    $('#annotation-others').empty();

    // Set data for relative search
    let annotation_length = gen_x2 - gen_x1;
    let distance_block_annotation = 0;
    $.each(blocks[0], function (index, block) {
        if (block.__data__.specie === species) {
            // Distance between block start and annotation start
            distance_block_annotation = gen_x1 - block.__data__.x1;
            //console.log("specie: " + block.__data__.specie);
        }
    });

    $.each(blocks[0], function (index, block) {
        //console.log(index + ':' + block.__data__.specie);
        if (block.__data__.specie !== species) {
            // Use relative location
            let annotation_x1 = block.__data__.x1 + distance_block_annotation;
            let annotation_x2 = annotation_x1 + annotation_length;
            let chromosome = block.__data__.chromosome.toUpperCase();
            /*console.log('annotation_length: ' + annotation_length);
            console.log('distance_block_annotation: ' + distance_block_annotation);
            console.log('annotation_x1: ' + annotation_x1);
            console.log('annotation_x2: ' + annotation_x2);*/
            getAnnotationFrom(block.__data__.specie, annotation_x1, annotation_x2, chromosome).done(function (annotations) {
                let parsed = JSON.parse(annotations);
                /*
                console.log(':3 ==================');
                console.log('Annotations:', annotations);
                console.log('Length:', annotations.length);
                console.log('Size:', annotations.size);
                console.log('Annotations:', Array.isArray(annotations));
                console.log('==================');
                console.log('Annotations:', parsed);
                console.log('Length:', parsed.length);
                console.log('Size:', parsed.size);
                console.log('Annotations:', Array.isArray(parsed));*/
                if (Array.isArray(parsed) && parsed.length === 0) {
                    //console.log('No annotations found');
                    $('#annotation-others')
                        .append($('<p>')
                            .attr('id', 'annotation-species')
                            .attr('class', 'h4 text-center')
                            .append($('<small>')
                                .attr('class', 'text-muted')
                                .text('Species: '))
                            .append($('<span>')
                                .attr('class', 'block_species')
                                .text(block.__data__.specie))
                            .append($('<h5>')
                                .text('No annotations found')
                            ));
                } else {
                    let parsed = JSON.parse(annotations);
                    //Crear tabla
                    let newSpecieTableId = createSpeciesTable(block.__data__.specie, parsed.length, '#annotation-others');
                    console.log('------------->' + newSpecieTableId);
                    //poblar tabla
                    //newSpecieTableId = newSpecieTableId.replace('#annotation-selected-table ', '');
                    //console.log(newSpecieTableId);
                    populateTable(annotations, newSpecieTableId); // tiene que llevar # en el id

                    $.each(parsed, function (index, annotation) {
                        //console.log('block',block);
                        //console.log('$(block)',$(block));

                        paintAnnotation(block, svgInverted, annotation.gen_x1, annotation.gen_x2, annotation.product);
                    });
                }

            });

            /*let annotations = getAnnotationFrom(block.__data__.specie, gen_x1, gen_x2);
            console.log(annotations);
            $.each(annotations, function (index, annotation){
               paintAnnotation(block, svgInverted, annotation.gen_x1, annotation.gen_x2);
            });*/
        } else {
            //Selected block
            let gene = block.__data__.gene;
            gene = $('.highlight')[$('.highlight').length - 1].cells[3].innerHTML;
            let selected = {
                gen_x1,
                gen_x2,
                gene,
                product,
                note
            };
            let array = new Array(selected);


            console.log(block);
            console.log(array);
            console.log(JSON.stringify(array));


            populateTable(JSON.stringify(array), '#annotation-selected-table');
            $('#annotation-selected #annotation-species').empty()
                .append('<small class="text-muted">Species: </small>')
                .append('<span class="block_species">' + species + '</span>');
        }
    });
}

// LAZY LOADING - FOR PRINCIPAL SEARCH - DEPRECATED (but still works)===================================================
function getAnnotationBetweenPaginated(species, gen_x1, gen_x2, start, end, chromosome) {
    return $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/annotation_between_paginated/",
        data: {
            species: species,
            gen_x1: gen_x1,
            gen_x2: gen_x2,
            start: start,
            end: end,
            chromosome: chromosome
        }
    });
}

var PAGE_SIZE = 10;
var page_start = 0;
var page_end = PAGE_SIZE;

function resetPagination() {
    page_start = 0;
    page_end = PAGE_SIZE;
}

function nextAnnotationPage() {
    //console.log('===================\n-->\n ANTES - page_start: ' + page_start + ' page_end: ' + page_end);
    page_start += PAGE_SIZE;
    page_end += PAGE_SIZE;
    //console.log(' DESPU - page_start: ' + page_start + ' page_end: ' + page_end);

    let species = $(".block_species").html();
    let gen_x1 = parseInt($(".block_pos_x1").html());
    let gen_x2 = parseInt($(".block_pos_x2").html());
    let chromosome = selectedBlock[0][0].__data__.chromosome.toUpperCase();

    //$("#input-search").val(Math.ceil(page_start/PAGE_SIZE));
    //showPageInfo(species);
    //=============================================> TODO
    getAnnotationBetweenPaginated(species, gen_x1, gen_x2, page_start, page_end, chromosome).done(function (response) {
        //appendInfo(species, gen_x1, gen_x2);
        if ($.trim(response)) {// si no está vacio
            populateTable(response, '.annotation-table');
            getAnnotationsLength(species, gen_x1, gen_x2, chromosome).done(function (annotations_count) {
                if (page_start < 0) {
                    $("#input-search").val(Math.ceil((annotations_count / PAGE_SIZE) + Math.ceil(page_start / PAGE_SIZE)));
                } else if (Math.ceil(page_start / PAGE_SIZE) >= Math.ceil(annotations_count / PAGE_SIZE)) {
                    resetPagination()
                } else {
                    $("#input-search").val(Math.ceil(page_start / PAGE_SIZE));
                }
                showPageInfo(species, gen_x1, gen_x2);
                //console.log('NEXT: page_start: ' + page_start + ' page_end: ' + page_end);
            });
        } else {
            resetPagination()
        }

        //console.log('NEXT: page_start: ' + page_start + ' page_end: ' + page_end);
    });
}

function previousAnnotationPage() {
    //console.log('===================\n<--\n ANTES - page_start: ' + page_start + ' page_end: ' + page_end);
    page_start -= PAGE_SIZE;
    page_end -= PAGE_SIZE;
    //console.log(' DESPU - page_start: ' + page_start + ' page_end: ' + page_end);

    let species = $(".block_species").html();
    let gen_x1 = parseInt($(".block_pos_x1").html());
    let gen_x2 = parseInt($(".block_pos_x2").html());
    let chromosome = selectedBlock[0][0].__data__.chromosome.toUpperCase();

    getAnnotationBetweenPaginated(species, gen_x1, gen_x2, page_start, page_end, chromosome).done(function (response) {
        //appendInfo(species, gen_x1, gen_x2);
        if ($.trim(response)) {// si no está vacio
            populateTable(response, '.annotation-table');
            getAnnotationsLength(species, gen_x1, gen_x2, chromosome).done(function (annotations_count) {
                if (page_start < 0) {
                    $("#input-search").val(Math.ceil((annotations_count / PAGE_SIZE) + Math.ceil(page_start / PAGE_SIZE)));
                } else {
                    $("#input-search").val(Math.ceil(page_start / PAGE_SIZE));
                }
                showPageInfo(species, gen_x1, gen_x2);
                //console.log('PREVIOUS: page_start: ' + page_start + ' page_end: ' + page_end);
            });
        } else {
            resetPagination()
        }
    });
}

function getAnnotationsLength(species, gen_x1, gen_x2, chromosome) {
    return $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/annotation_count/",
        data: {
            species: species,
            gen_x1: gen_x1,
            gen_x2: gen_x2,
            chromosome: chromosome
        }
    });
}

function goToPage() {
    let species = $(".block_species").html();
    let gen_x1 = parseInt($(".block_pos_x1").html());
    let gen_x2 = parseInt($(".block_pos_x2").html());
    let page = parseInt($("#input-search").val());
    let current_page = parseInt($("#current-page").html());
    let chromosome = selectedBlock[0][0].__data__.chromosome.toUpperCase();
    //console.log('===================\nGOTO\n ANTES - page_start: ' + page_start + ' page_end: ' + page_end);

    getAnnotationsLength(species, gen_x1, gen_x2, chromosome).done(function (annotations_count) {
        let last_page = Math.ceil(annotations_count / PAGE_SIZE);

        //console.log('species: ' + species + ' gen_x1: ' + gen_x1 + ' gen_x2: ' + gen_x2 + ' page: ' + page + ' last_page: ' + last_page + ' annotation count: ' + annotations_count);
        //console.log('page: ' + page + ' current_page: ' + current_page);
        if ((page >= 0) && (page <= last_page) && (page !== current_page)) {
            page_start = page * PAGE_SIZE;
            page_end = (page * PAGE_SIZE) + PAGE_SIZE;
            //console.log('SEARCH: page_start: ' + page_start + ' page_end: ' + page_end);

            getAnnotationBetweenPaginated(species, gen_x1, gen_x2, page_start, page_end, chromosome).done(function (response) {
                //appendInfo(species, gen_x1, gen_x2);
                if ($.trim(response)) {// si no está vacio
                    showPageInfo(species, gen_x1, gen_x2);
                    populateTable(response, '.annotation-table');
                } else {
                    resetPagination();
                }
            });
        }
        //console.log(' DESPU - page_start: ' + page_start + ' page_end: ' + page_end);
    });


}

function showPageInfo(species, gen_x1, gen_x2) {
    let page = parseInt($("#input-search").val());
    let chromosome = selectedBlock[0][0].__data__.chromosome.toUpperCase();
    getAnnotationsLength(species, gen_x1, gen_x2, chromosome).done(function (annotations_count) {
        $('#current-page').text(page);
        $('#last-page').text(Math.ceil(annotations_count / PAGE_SIZE) - 1);
        //console.log('species: ' + species + ' page: ' + page + ' annotations_count: ' + annotations_count)
    });
}

// =======================================================================

// PAGINATION VERSION 2 ==================================================

var ALL_SELECTED_SPECIES_TAGS = [];

function showAnnotationProduct() {
    $('#annotation-product-sidebar-wrapper').show();
}

function hideAnnotationProduct() {
    $('#annotation-product-sidebar-wrapper').hide();
}

function getAnnotationProductPage(species, gen_x1, gen_x2, product, page, chromosome) {
    return $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/annotation_by_product/",
        data: {
            species: species,
            gen_x1: gen_x1,
            gen_x2: gen_x2,
            product: product,
            page_number: page,
            chromosome: chromosome
        }
    });
}

function loadAnnotationByProduct() {
    $('#product-search-name').empty().append('Results for: <b>\"' + $('#product-search')[0].value + '\"</b>');
    $('#annotation-product').empty();
    showAnnotationProduct();
    for (let i = 0; i < trace[0].length; i++) {
        let species = trace[0][i].__data__.specie;
        let div_id = "product-results-" + species;
        $("#annotation-product")
            .append($("<div>")
                .attr("id", div_id));
        div_id = "#" + div_id;
        createSpeciesTable(species, null, div_id);
        goToProductPage(species, 1);
    }
}

function goToProductPage(species, page) {
    // por cada nloque de la traza
    $.each(trace[0], function (index, block) {
        if (block.__data__.specie === species) {
            let gen_x1 = block.__data__.x1;
            let gen_x2 = block.__data__.x2;
            let product = $('#product-search')[0].value;
            let chromosome = block.__data__.chromosome.toUpperCase();
            //console.log(species, gen_x1, gen_x2, product, page);
            getAnnotationProductPage(species, gen_x1, gen_x2, product, page, chromosome).done(function (response) {

                d3.selectAll('#annotation_block.' + species).remove();

                let div_id = "#product-results-" + species;
                let table = div_id + " .annotation-table-" + species;
                let page_control = div_id + " #page-control-product";

                let parsed = JSON.parse(response);

                $(page_control).find('input')[0].value = page;
                $(page_control).find('#last-page').empty().append(parsed.num_pages);

                //pintar cada una de las anotaciones recibidas

                //obtener el indice de la especie
                //obtener el bloque con el indice anterior
                //para cada anotacion recibida
                //pintar anotacion

                /*console.log("es un " + species);
                console.log(parsed.object_list);
                console.log("block");
                console.log(block);
                console.log(index);*/
                $.each(parsed.object_list, function (index, annotation) {
                    paintAnnotation(block, svgInverted, annotation.gen_x1, annotation.gen_x2, annotation.product);
                });

                let unparsed = JSON.stringify(parsed.object_list);
                populateTable(unparsed, table);
            }).fail(function (event) {
                //console.log(event);
            });
        }
    });
}

function nextPage(element) {
    let div_id = $(element).parent().parent()[0].id;
    let species = div_id.split("-")[2];
    let current_page = parseInt($(element).parent().find("#search-container").find('input')[0].value);
    current_page++;
    goToProductPage(species, current_page);
}

function previousPage(element) {
    let div_id = $(element).parent().parent()[0].id;
    let species = div_id.split("-")[2];
    let current_page = parseInt($(element).parent().find("#search-container").find('input')[0].value);
    current_page--;
    goToProductPage(species, current_page);
}

function updateAllPages() {
    if ((trace === undefined) || (trace === null)) {
        return;
    }
    d3.selectAll('#annotation_block').remove();
    for (let i = 0; i < trace[0].length; i++) {
        try {
            let species = trace[0][i].__data__.specie;
            let page = parseInt($('.amazing-current-page')[i].value);
            goToProductPage(species, page);
            º
        } catch (e) {
            //console.error(e.message);
        }
    }
}

// =======================================================================

// SELECTED ANNOTATION ===================================================

function showSelectedAnnotation() {
    $('#annotation-selection-sidebar-wrapper').show();
}

function hideSelectedAnnotation() {
    $('#annotation-selection-sidebar-wrapper').hide();
    updateAllPages();
}

function createSpeciesTable(species, coincidences, div) {
    $(div).append($('<p>')
        .attr('id', 'annotation-species')
        .attr('class', 'h4 text-center')
        .append($('<small>')
            .attr('class', 'text-muted')
            .text('Species: '))
        .append($('<span>')
            .attr('class', 'block_species')
            .text(species))
    );

    // si es -1 son los controles de paginacion
    if (coincidences === null) {
        $(div).append($('<div>')
            .attr('id', 'page-control-product')
            .append($('<button>')
                .attr('id', 'menu-left')
                .attr('class', 'btn btn-info')
                .attr('onclick', 'previousPage(this)')
                .append($('<span>')
                    .attr('class', 'glyphicon glyphicon-chevron-left')))
            .append($('<div>')
                .attr('id', 'search-container')
                .attr('class', 'text-muted')
                .append($('<input>')
                    .attr('class', 'amazing-current-page')
                    .attr('type', 'number')
                    .attr('placeholder', 'Page')
                    .attr('name', 'search')
                    .attr('min', 0)
                    .attr('size', 4)
                    .keypress(function (event) {
                        if (event.key !== "Enter") {
                            return;
                        }
                        event.preventDefault();

                        let page = $(this)[0].value;
                        let div_id = $(this).parent().parent().parent()[0].id;
                        let species = div_id.split("-")[2];
                        goToProductPage(species, page);
                    }))
                .append(' of ')
                .append($('<span>')
                    .attr('id', 'last-page')))
            .append($('<button>')
                .attr('id', 'menu-right')
                .attr('class', 'btn btn-info')
                .attr('onclick', 'nextPage(this)')
                .append($('<span>')
                    .attr('class', 'glyphicon glyphicon-chevron-right')))
        );
    } else {
        $(div).append($('<p>')
            .attr('id', 'annotation-count')
            .attr('class', 'h4 text-center')
            .append($('<small>')
                .attr('class', 'text-muted')
                .text('Coincidences: '))
            .append($('<span>')
                .attr('class', 'block_coincidences')
                .text(coincidences))
        );
    }

    //let tableId = 'annotation-table-' + species;
    let tableClass = 'annotation-table-' + species;
    let tableId = div + " ." + tableClass;

    $(div).append($('<table>')
        //.attr('class', tableId)
        .attr('class', 'table table-sm table-bordered annotation-comparison-tables ' + tableClass)
        .append($('<thead>')
            .append($('<tr>')
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('Start'))
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('End'))
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('Length'))
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('Id'))
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('Product'))
                .append($('<th>')
                    .attr('scope', 'col')
                    .text('Note'))))
        .append($('<tbody>')));
    if (coincidences === null) {
        $(div).on('click', 'tbody tr', function () {
            let row = $(this);
            let current_species = row.parents(".annotation-comparison-tables").siblings("#annotation-species").children(".block_species").text();
            if (row.hasClass('highlight')) {
                row.removeClass('highlight');
                d3.selectAll('#annotation_block').remove();
            } else {
                d3.selectAll('#annotation_block').remove();
                row.addClass('highlight').siblings().removeClass('highlight');
                let gen_x1 = row.find('.gen_x1').html();
                let gen_x2 = row.find('.gen_x2').html();
                let product = row.find('.product').html();
                let note = row.find('.note').html();

                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

                let retrieved_block = getBlockFromTraceBySpecies(current_species);
                paintAnnotation(traceSelectedBlock, svgInverted, gen_x1, gen_x2, product);

                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

                //console.log('LETS TRACE=============================    ');
                //species = row.parentsUntil()[2].id.split("-")[2];
                traceAnnotation(current_species, gen_x1, gen_x2, product, note, trace);
                showSelectedAnnotation();
            }
        });
    }

    //return '#annotation-comparison-tables #' + tableId;
    return tableId;
}

var traceSelectedBlock;

function getBlockFromTraceBySpecies(species) {
    $.each(trace[0], function (index, block) {
        if (block.__data__.specie === species) {
            traceSelectedBlock = block;
            return block;
        }
    });
}

/**
 * Filters the trace, removing the shorter blocks of the same species
 */
function simplifyTrace() {
    let simplified_trace = trace[0];
    for (let i = 1; i < simplified_trace.length; i++) {
        if (simplified_trace[i].__data__.specie === simplified_trace[i - 1].__data__.specie) {
            // Compare CSB sizes
            let block1_size = Math.abs(simplified_trace[i - 1].__data__.x2 - simplified_trace[i - 1].__data__.x1);
            let block2_size = Math.abs(simplified_trace[i].__data__.x2 - simplified_trace[i].__data__.x1);
            if (block1_size > block2_size) {
                // If not hidden the annotations of the other CSB cannot be seen
                simplified_trace[i].style.opacity = 0;
                simplified_trace.splice(i, 1);
            } else {
                // If not hidden the annotations of the other CSB cannot be seen
                simplified_trace[i - 1].style.opacity = 0;
                simplified_trace.splice(i - 1, 1);
            }
        }
    }
    trace[0] = simplified_trace;
}

//==========================================================================

function populateTable(response, table) {
    //console.log('RESPONSE:');console.log(response);
    let tbody = $(table).find('tbody');
    tbody.empty();
    let parsed = JSON.parse(response);
    $.each(parsed, function (index) {
        //console.log('PARSED:');console.log(parsed);
        let data = parsed[index];
        //console.log('DATA:');console.log(data);
        let row = $('<tr>')
            //.attr('class', 'clickable-row')
            .append($('<th>')
                .attr('scope', 'row')
                .attr('class', 'gen_x1')
                .text(data.gen_x1))
            .append($('<th>')
                .attr('scope', 'row')
                .attr('class', 'gen_x2')
                .text(data.gen_x2))
            .append($('<td>')
                .attr('class', 'length')
                .text(data.gen_x2 - data.gen_x1))
            .append($('<td>')
                .attr('class', 'Id')
                .text(data.gene))
            .append($('<td>')
                .attr('class', 'product')
                .text(data.product))
            .append($('<td>')
                .attr('class', 'note')
                .text(data.note));
        tbody.append(row);
    });
}

function appendInfo(species, block_x1, block_x2, div) {
    $(div + ' #annotation-species').empty()
        .append('<small class="text-muted">Selected species: </small>')
        .append('<span class="block_species">' + species + '</span>');
    $(div + ' #annotation-fragment').empty()
        .append('<small class="text-muted">Fragment coordinates: </small>')
        .append('<span class="block_pos_x1">' + block_x1 + '</span>..<span class="block_pos_x2">' + block_x2 + '</span>');
}

var LAST_STRAND = '';
var LAST_SPECIES = '';

function paintAnnotation(block, inverted, gen_x1, gen_x2, product) {

    let strand = '';
    $.each(currentBlockInfo, function (index, blockInfo) {
        if ((blockInfo.block_id === block.__data__.block_id) && (blockInfo.specie === block.__data__.specie)) {
            //console.log(blockInfo.strand);
            strand = blockInfo.strand;

        }
    });

    /*if (!LAST_SPECIES.empty() && LAST_SPECIES!==block.__data__.specie){
        if (strand==='f' && LAST_STRAND==='r'){

        }
    }*/

    //console.log('----------------------------');
    /*
    if (strand === 'r') {
        console.log(block.__data__.block_id + ' - ' + block.__data__.specie + ' - ' + strand + ' - ' + product);
    } else if (strand === 'f') {
        console.log(block.__data__.block_id + ' - ' + block.__data__.specie + ' - ' + strand + ' - ' + product);
    }*/
    //console.log('----------------------------');

    // get annotation range
    //let gen_x1 = annotation.find('.gen_x1').html();
    //let gen_x2 = annotation.find('.gen_x2').html();
    //console.log('block----------------', block);
    // hay que comprobar si están invertidos

    let escalated_x1 = parseFloat(inverted ? block.attributes.y.value : block.attributes.x.value);
    let escalated_width = parseFloat(inverted ? block.attributes.height.value : block.attributes.width.value);
    let escalated_x2 = escalated_width + escalated_x1;
    let escalated_y = parseFloat(inverted ? block.attributes.x.value : block.attributes.y.value);

    /*
    console.log('escalated_x1', escalated_x1);
    console.log('escalated_x2', escalated_x2);
    console.log('escalated_width', escalated_width);
    console.log('escalated_y', escalated_y);
*/
    // ESCALADO
    // data bound to the DOM object(rect)
    let block_x1 = block.__data__.x1;
    let block_x2 = block.__data__.x2;


    /*
    console.log('block_x1', block_x1);
    console.log('block_x2', block_x2);
*/
    // scale annotation size to the block size
    let widthDomain = [block_x1, block_x2],
        widthRange = [escalated_x1, escalated_x2];

    let blockScale = d3.scale.linear()
        .domain(widthDomain)
        .range(widthRange);

    /*
    console.log('blockScale(gen_x1)', blockScale(gen_x1));
    console.log('gen_x1', gen_x1);
    console.log('gen_x2 - gen_x1', gen_x2 - gen_x1);
*/

    // lets invert the color for the annotation
    let inverted_color = invertColor(block.attributes.fill.value);
    //let inverted_color = 'red';

    // attach the annotation somewhere
    let parent = block.parentElement;
    //d3.select('.blockInfo').append('rect')
    if (strand === 'r') {
        //console.log('x1:escalated_x1 + blockScale(gen_x1)', escalated_x1 + blockScale(gen_x1));
        //console.log('x1:escalated_x1 + escalated_width - (blockScale(gen_x1) - escalated_x1)', escalated_x1 + escalated_width - (blockScale(gen_x1) - escalated_x1));
        //console.log('width:blockScale(gen_x2 - gen_x1)',blockScale(gen_x2 - gen_x1));
        //console.log('width:blockScale(gen_x2)-blockScale(gen_x1)', blockScale(gen_x2) - blockScale(gen_x1));

        let rect = d3.select(parent).append('rect')
            .attr('id', 'annotation_block')
            .attr('class', block.__data__.specie)
            //.attr(getPositionAttribute('x', inverted), function() { return  (escalated_x1 + blockScale(gen_x1)); })
            .attr(getPositionAttribute('x', inverted), function () {
                return escalated_x1 + escalated_width - (blockScale(gen_x1) - escalated_x1);
            })
            .attr(getPositionAttribute('y', inverted), function () {
                return escalated_y + 1.5;
            })
            //.attr(getPositionAttribute('width', inverted), function() { return  blockScale(gen_x2 - gen_x1); })
            .attr(getPositionAttribute('width', inverted), function () {
                return Math.abs(blockScale(gen_x2) - blockScale(gen_x1));
            })
            .attr(getPositionAttribute('height', inverted), BLOCK_BASE_HEIGHT - 3)
            .attr('fill', 'none')
            .attr('stroke', inverted_color)
            .attr('stroke-width', '2px')
            .append("svg:title")
            .text(gen_x1 + ':' + gen_x2 + ' - ' + product);
        //console.log('rect', rect);
    } else {
        //console.log('x1:blockScale(gen_x1)', blockScale(gen_x1));
        //console.log('width:Math.abs(blockScale(gen_x2)-blockScale(gen_x1))', Math.abs(blockScale(gen_x2) - blockScale(gen_x1)));

        let rect = d3.select(parent).append('rect')
            .attr('id', 'annotation_block')
            .attr('class', block.__data__.specie)
            //.attr(getPositionAttribute('x', inverted), function() { return  (escalated_x1 + blockScale(gen_x1)); })
            .attr(getPositionAttribute('x', inverted), function () {
                return blockScale(gen_x1);
            })
            .attr(getPositionAttribute('y', inverted), function () {
                return escalated_y + 1.5;
            })
            //.attr(getPositionAttribute('width', inverted), function() { return  blockScale(gen_x2 - gen_x1); })
            .attr(getPositionAttribute('width', inverted), function () {
                return Math.abs(blockScale(gen_x2) - blockScale(gen_x1));
            })
            .attr(getPositionAttribute('height', inverted), BLOCK_BASE_HEIGHT - 3)
            .attr('fill', 'none')
            .attr('stroke', inverted_color)
            .attr('stroke-width', '2px')
            .append("svg:title")
            .text(gen_x1 + ':' + gen_x2 + ' - ' + product);

        //console.log('rect', rect);
    }

    LAST_SPECIES = block.__data__.specie;
    LAST_STRAND = strand;
    //console.log('LAST: ' + LAST_SPECIES + ' ' + LAST_STRAND);
}

function paintGaps(gen_x1, gen_x2) {
    //console.log('AMO A PINTA');
    let block = selectedBlock[0][0];
    let species = block.__data__.specie;
    getAnnotationFrom(species, gen_x1, gen_x2, block.__data__.chromosome.toUpperCase()).done(function (response) {
        let parsed = JSON.parse(response);
        //console.log(response);
        let length = parsed.keys.length;
        let previous_x2 = -1;
        $.each(parsed, function (index, annotation) {
            let name = 'Gap #' + index;
            //console.log('name: ' + name + 'annotation:');
            //console.log(annotation);
            if (index === 0) {
                paintAnnotation(block, svgInverted, gen_x1, annotation.gen_x1, name);
                previous_x2 = annotation.gen_x2;
            } else if (index === (length - 1)) {
                paintAnnotation(block, svgInverted, annotation.gen_x1, gen_x2, name);
            } else {
                paintAnnotation(block, svgInverted, previous_x2, annotation.gen_x1, name);
                previous_x2 = annotation.gen_x2;
            }
        });
    });
}

function getGapsCSV(species, gen_x1, gen_x2) {
    return $.ajax({
        type: "GET",
        url: FORCE_URL + "/API/annotation_gaps_csv/",
        data: {
            species: species,
            gen_x1: gen_x1,
            gen_x2: gen_x2
        }
    });
}

function saveGapsCSV() {
    let block = selectedBlock[0][0];
    let species = block.__data__.specie;
    let gen_x1 = block.__data__.x1;
    let gen_x2 = block.__data__.x2;

    getGapsCSV(species, gen_x1, gen_x2).done(function (response) {
        let filename = species + '_' + gen_x1 + '_' + gen_x2 + '.csv';
        //console.log(filename);

        let blob = new Blob([response], {type: 'text/csv;charset=utf8'});
        let csvUrl = URL.createObjectURL(blob);
        //console.log(csvUrl);

        let link = document.createElement('a');
        document.body.appendChild(link);
        link.href = csvUrl;
        link.download = filename;
        link.click();
    });
}

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    return "#" + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

// Highlight row / remove rect / paint
$(document).ready(function () {
    $('#annotation-content').children('.annotation-table').on('click', 'tbody tr', function (event) {
        let row = $(this);
        if (row.hasClass('highlight')) {
            row.removeClass('highlight');
            d3.selectAll('#annotation_block').remove();
        } else {
            d3.selectAll('#annotation_block').remove();
            row.addClass('highlight').siblings().removeClass('highlight');
            let gen_x1 = row.find('.gen_x1').html();
            let gen_x2 = row.find('.gen_x2').html();
            let product = row.find('.product').html();
            let note = row.find('.note').html();
            paintAnnotation(selectedBlock[0][0], svgInverted, gen_x1, gen_x2, product);
            //console.log('LETS TRACE=============================    ');
            traceAnnotation(selectedBlock[0][0].__data__.specie, gen_x1, gen_x2, product, note, trace);
            showSelectedAnnotation();
        }
    });

    // Get the input field
    let input = document.getElementById("input-search");
    // Execute a function when the user releases a key on the keyboard
    input.addEventListener("keyup", function (event) {
        if (event.key !== "Enter") {
            return;
        }
        event.preventDefault();
        goToPage();
    });
});

