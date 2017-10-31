from comparisonManager.models import *
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes, permission_classes
from django.http import HttpResponse
import json
import os

from .models import *
from django.http import HttpResponse
from django.core.files.images import ImageFile
import csv

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def generateJSONComparisonFromSpecies(request):

    comparisons = request.GET.get('comparisons', '')
    comparisons = json.loads(comparisons)

    jsonChromosomeList = []
    auxChromosomeDict = {}

    for comparison in comparisons:
        specieX = comparison["specieX"]
        specieY = comparison["specieY"]

        comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY)

        if not comparisons:
            comparisons = Comparison.objects.all().filter(chromosome_x__specie__name=specieY, chromosome_y__specie__name=specieX)

        for comparison in comparisons:
            auxChromosomeDict["specieX"] = specieX
            auxChromosomeDict["chromosomeX_number"] = comparison.chromosome_x.number
            auxChromosomeDict["specieY"] = specieY
            auxChromosomeDict["chromosomeY_number"] = comparison.chromosome_y.number
            auxChromosomeDict["score"] = comparison.score
            auxChromosomeDict["img"] = comparison.img.url
            jsonChromosomeList.append(auxChromosomeDict.copy())

    return JsonResponse(json.dumps(jsonChromosomeList), safe=False)

def updateDBfromCSV(request):
    with open("images/test.csv") as f:
        reader = csv.reader(f, delimiter=',')
        next(reader, None)
        #  0    1    2    3    4     5         6           7
        # SpX, SpY, IDX, IDY, IMG, CHNumberX, CHNumberY, Score

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
                chrX = Chromosome.objects.create(specie=spX, fasta='www.test.com', number=n_chr_x)
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
                chrY = Chromosome.objects.create(specie=spY, fasta='www.test.com', number=n_chr_y)
                chrY.save()

            print("### ADDED ### " + n_chr_y)
            ### COMPARISON --
            # Image
            img_name = row[4]
            print("##### IMAGE ##### " + img_name)
            check_img = Comparison.objects.filter(chromosome_x=chrX, chromosome_y=chrY).count()
            if check_img > 0:
                # Image Exists alredy
                img_comp = Comparison.objects.get(chromosome_x=chrX, chromosome_y=chrY)
                print("-- ALREDY EXISTS --")
            else:
                current_score = row[7]
                os.rename("images/"+img_name, "media/"+img_name)
                comp = Comparison.objects.create(chromosome_x=chrX, chromosome_y=chrY, score=current_score, img=img_name)
                comp.save()


            print("### ADDED ### " + img_name)
    print("------------------ Done -------------------")

    return HttpResponse('OK', content_type="text/plain")