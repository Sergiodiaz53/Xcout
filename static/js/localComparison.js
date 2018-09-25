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
    var local_comparison_data;
    
    for(file of fileInput.files){
        extension = file.name.split('.');

            if(extension[extension.length-1] == 'png') local_data.pngs.push(file);
            else if(extension[extension.length-1] == 'txt' && extension[extension.length-2] == 'events') local_data.events.push(file);
            else if(extension[extension.length-1] == 'csv')local_data.index = file;
    }

    // If index exists...
    if(local_data.index instanceof File){
        readLocalFile(local_data.index);
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
function readLocalFile(textFile){
    var reader = new FileReader();
  
    reader.onload = function(e) {
        console.log("READING :: " + textFile.name);
        index_csv = this.result.split('\n');
    };
    reader.onloadend = function(e){
        local_comparison_data = storeLocalComparison(index_csv);
        addLocalComparisonToComparisonList(local_comparison_data.localX, local_comparison_data.localY);
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

        let auxSpecieX = items[0],
            auxSpecieY = items[1],
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
    }
    localSpeciesX = [...new Set(localComparisonJSON.map(item => item.specieX))];
    localSpeciesY = [...new Set(localComparisonJSON.map(item => item.specieY))];

    return {'comparisonJson': localComparisonJSON, 'localX': localSpeciesX, 'localY': localSpeciesY};
}

// Add Comparison to Comparison Table/List
function addLocalComparisonToComparisonList(localX, localY){
    var newRow = "<tr><td class='local_specieX_name'>"+specieX+"</td><td>vs</td><td class='local_specieY_name'>"+specieY+"</td><td><button class='btn btn-md btn-danger glyphicon glyphicon-remove removeButton'></button></td>'";

    //If comparison doesn't exists, add it.
    if(!$('#comparisonList tr > td:contains('+specieX+') + td:contains(vs) + td:contains('+specieY+')').length) $("#comparisonList").find("tbody").append(newRow)

    $(".removeButton").click(function(){
        $(this).closest("tr").remove();
/*
        var specieX = [],
            specieY = [];

        $('#comparisonList .specieX_name').each(function() {
            specieX.push($(this).html())
        });

        $('#comparisonList .specieY_name').each(function() {
            specieY.push($(this).html())
        });

        getFullComparisonOf(specieX, specieY)*/
    });
}
/*

            auxChromosomeDict["specieX"] = specieX
            auxChromosomeDict["specieY"] = specieY
            if(not inverted):
                auxChromosomeDict["chromosomeX_number"] = comparison.chromosome_x.number
                auxChromosomeDict["chromosomeY_number"] = comparison.chromosome_y.number
            else:
                auxChromosomeDict["chromosomeX_number"] = comparison.chromosome_y.number
                auxChromosomeDict["chromosomeY_number"] = comparison.chromosome_x.number

            auxChromosomeDict["score"] = comparison.score
            auxChromosomeDict["img"] = comparison.img.url
#  0    1    2    3    4     5         6           7    8       9
# SpX, SpY, IDX, IDY, IMG, CHNumberX, CHNumberY, Score, LenX, LenY
for row in reader:
            ### SPECIES --
            # Specie X
            n_sp_x = row[0].split('.')[0]
            print("##### SPECIE ##### " + n_sp_x)
            check_sp_x = Specie.objects.filter(name = n_sp_x).count()
            if check_sp_x > 0:
                spX = Specie.objects.get(name = n_sp_x)
                print("-- ALREDY EXISTS --")
            else:
                # ShortName
                sn_x = ''
                for sp_x_name in n_sp_x.split('_'):
                    sn_x += sp_x_name[0]
                # AN: ID-X
                id_x = row[2].split(':',2)[-1]
                spX = Specie.objects.create(name=n_sp_x,short_name=sn_x.upper(),accesion_number=id_x)
                spX.save()

            print("### ADDED ### " + n_sp_x)

            # Specie Y
            n_sp_y = row[1].split('.')[0]
            print("##### SPECIE ##### " + n_sp_y)
            check_sp_y = Specie.objects.filter(name = n_sp_y).count()
            if check_sp_y > 0:
                spY = Specie.objects.get(name = n_sp_y)
                print("-- ALREDY EXISTS --")
            else:
                # ShortName
                sn_y = ''
                for sp_y_name in n_sp_y.split('_'):
                    sn_y += sp_y_name[0]
                # AN: ID-Y
                id_y = row[3].split(':',2)[-1]
                spY = Specie.objects.create(name=n_sp_y,short_name=sn_y.upper(),accesion_number=id_y)
                spY.save()

            print("### ADDED ### " + n_sp_y)

            ### CHROMOSOMES --
            # Chr X - nCX
            n_chr_x = row[5]
            print("##### CHROMOSOME ##### " + n_chr_x)
            check_chr_x = Chromosome.objects.filter(specie=spX, number=n_chr_x).count()
            if check_chr_x > 0:
                chrX = Chromosome.objects.get(specie=spX, number=n_chr_x)
                print("-- ALREDY EXISTS --")
            else:
                len_x = int(row[8])
                chrX = Chromosome.objects.create(specie=spX, fasta='www.test.com', number=n_chr_x, length=len_x)
                chrX.save()

            print("### ADDED ### " + n_chr_x)
            # Chr Y - nCY
            n_chr_y = row[6]
            print("##### CHROMOSOME ##### " + n_chr_y)
            check_chr_y = Chromosome.objects.filter(specie=spY, number=n_chr_y).count()
            if check_chr_y > 0:
                chrY = Chromosome.objects.get(specie=spY, number=n_chr_y)
                print("-- ALREDY EXISTS --")
            else:
                len_y = int(row[9])
                chrY = Chromosome.objects.create(specie=spY, fasta='www.test.com', number=n_chr_y, length=len_y)
                chrY.save()

            print("### ADDED ### " + n_chr_y)
            ### COMPARISON --
            # Image
            img_name = row[4]
            csv_name = img_name.rsplit('.', 2)[0] + ".events.txt"
            print("##### IMAGE ##### " + img_name)
            check_img = Comparison.objects.filter(chromosome_x=chrX, chromosome_y=chrY).count()
            if check_img > 0:
                # Image Exists alredy
                img_comp = Comparison.objects.get(chromosome_x=chrX, chromosome_y=chrY)
                print("-- ALREDY EXISTS --")
            else:
                current_score = row[7]
                os.rename("images/"+img_name, "media/"+img_name)
                os.rename("images/"+csv_name, "media/"+csv_name)
                comp = Comparison.objects.create(chromosome_x=chrX, chromosome_y=chrY, score=current_score, img=img_name, csv=csv_name)
                comp.save()


            print("### ADDED ### " + img_name)
*/