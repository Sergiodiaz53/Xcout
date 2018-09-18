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

# Image Overlay
from PIL import Image
from os import listdir
from os.path import isfile, join
import re
import random

# Automatic Color Threshold
from sklearn.cluster import KMeans
import numpy as np

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def generateJSONComparisonFromSpecies(request):

    comparisons = request.GET.get('comparisons', '')
    comparisons = json.loads(comparisons)

    jsonChromosomeList = []
    auxChromosomeDict = {}

    for comparison in comparisons:
        inverted = False
        specieX = comparison["specieX"]
        specieY = comparison["specieY"]

        comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY)

        if not comparisons:
            inverted = True
            comparisons = Comparison.objects.all().filter(chromosome_x__specie__name=specieY, chromosome_y__specie__name=specieX)

        for comparison in comparisons:
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

            jsonChromosomeList.append(auxChromosomeDict.copy())

    return JsonResponse(json.dumps(jsonChromosomeList), safe=False)

def updateDBfromCSV(request):
    with open("images/test.csv") as f:
        reader = csv.reader(f, delimiter=',')
        next(reader, None)
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

    print("------------------ Done -------------------")

    return HttpResponse('OK', content_type="text/plain")

### Image Overlay ###
# Request
@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def createOverlayedImage(request):
    # Retrieve data from request
    specieX = request.GET.get('specieX', '')
    specieY = request.GET.get('specieY', '')
    chromosomeX = request.GET.get('chromosomeX', '')
    chromosomeY = request.GET.get('chromosomeY', '')
    threshold = request.GET.get('threshold', '')
    overlay_axis = 'X' if chromosomeX == 'Overlay' else 'Y'
    inverted = False
    #max_len_chromosome = False#True if request.GET.get('max_len_chromosome', '') == 'True' else False

    # Retrieve wanted comparison
    if overlay_axis != 'X':
        comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY, chromosome_x__number = chromosomeX)
    else:
        comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY, chromosome_y__number = chromosomeY)

    if not comparisons:
        inverted = True
        if overlay_axis != 'X' :
            comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieY, chromosome_y__specie__name = specieX, chromosome_y__number = chromosomeX)
        else:
            comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieY, chromosome_y__specie__name = specieX, chromosome_x__number = chromosomeY)

    print("---- DEBUG -----")
    print("specieX :: " + specieX)
    print("specieY :: " + specieY)
    print("chromosomeX :: " + chromosomeX)
    print("chromosomeY :: " + chromosomeY)
    print("threshold :: " + threshold)
    print("overlay_axis :: " + overlay_axis)
    print("inverted :: " + str(inverted))
    #print("max_len_chromosome :: " + str(max_len_chromosome))
    print("---- DEBUG -----")

    # Filter comparisons by threshold
    print(comparisons)

    cmp_data = []
    base_max_len = 0

    for comparison in comparisons:
        if comparison.score <= float(threshold):
            if((not inverted and overlay_axis == 'Y') or (inverted and overlay_axis == 'X')):
                tmp_len = comparison.chromosome_y.length; base_max_len = comparison.chromosome_x.length
            else:
                tmp_len = comparison.chromosome_x.length; base_max_len = comparison.chromosome_y.length

            cmp_info = (comparison.img.url[1:], tmp_len, comparison.csv)
            cmp_data.append(cmp_info)


    if((not inverted and overlay_axis == 'Y') or (inverted and overlay_axis == 'X')):
        BACKGROUND_INIT_W = 25
        BACKGROUND_END_H = 1000
    else:
        BACKGROUND_INIT_W = 0
        BACKGROUND_END_H = 965

    DIFF_W = PLOT_INIT_PIXEL-BACKGROUND_INIT_W

    # Sort comparison data
    cmp_data = sorted_properly(cmp_data)

    urls = [f[0] for f in cmp_data]
    seq_lengths = [f[1] for f in cmp_data]
    csvs = ['media/' + f[2] for f in cmp_data]

    # Check if URLS is EMPTY
    if(len(urls) == 0):
        # SEND ERROR
        return JsonResponse({'status':'false','message':'No selected comparisons found below the threshold'}, status=500)

    images_paths = urls
    max_len = max(seq_lengths)# if max_len_chromosome == True else sum(seq_lengths)
    colors = []
    
    """
    ### ------------------ IMAGE METHOD
    # Create new image
    background = transparent_background(images_paths[0])
    background = background.crop((BACKGROUND_INIT_W, BACKGROUND_INIT_H, BACKGROUND_END_W, BACKGROUND_END_H))

    #rgb = create_rgb_colors(len(urls)-1)
    i=0
    colors.append('#%02x%02x%02x' % (R_color[i], G_color[i], B_color[i]))

    for img_path in images_paths[1:]:
        current_img = transparent_background(img_path)
        current_img = current_img.crop((PLOT_INIT_PIXEL, PLOT_INIT_PIXEL, PLOT_MAX_PIXEL_W, PLOT_MAX_PIXEL_H))
        current_img = resize_crop(current_img, max_len, seq_lengths[i+1], overlay_axis, inverted)
        
        change_color_transparent_img(current_img, (R_color[i], G_color[i], B_color[i]))
        colors.append('#%02x%02x%02x' % (R_color[i], G_color[i], B_color[i]))
        i+=1
        
        background.paste(current_img, (DIFF_W, DIFF_H), current_img)
    
    # Base64 Encode Image
    buffered = BytesIO()
    background.convert("RGB").save(buffered, format = "PNG")
    img_str = base64.b64encode(buffered.getvalue())
    """
    
    ### ------------------ EVENTS METHOD
    csv_data = []
    max_len_x = 0
    max_len_y = 0

    for i, csv in enumerate(csvs):
        with open(csv,'r') as f:
            events = f.readlines()[2:-1]
            for event in events:
                # x1,y1,x2,y2,len,event
                items = event[:-1].split(',')
                csv_data.append({
                    'x1':items[0],
                    'y1':items[1],
                    'x2':items[2],
                    'y2':items[3],
                    'len':items[4],
                    'type':items[5],
                    'cmp':i,
                    'color': '#%02x%02x%02x' % (R_color[i], G_color[i], B_color[i])
                })
    print(csv_data)
    if((not inverted and overlay_axis == 'Y') or (inverted and overlay_axis == 'X')):
        max_len_x = base_max_len; max_len_y = max_len; base_axis = 'X'
    else:
        max_len_x = max_len; max_len_y = base_max_len; base_axis = 'Y'

    # Send Response
    response_data = {
        'urls': urls,
        'lengths': seq_lengths,
        'events': csv_data,
        'max_x': max_len_x,
        'max_y': max_len_y,
        'color': colors,
        #'img': str(img_str)[2:],
        'base_axis': base_axis
    }
    #response = HttpResponse(img_str, content_type="text/plain")
    response = JsonResponse(json.dumps(response_data), safe=False)
    return response

### Automatic Color Threshold ###
# Request
@api_view(['GET'])
@authentication_classes([])
@permission_classes([])

def automaticColorThreshold(request):
    comparisons = request.GET.get('comparisons', '')
    comparisons = json.loads(comparisons)

    score_list = []

    for comparison in comparisons:
        inverted = False
        specieX = comparison["specieX"]
        specieY = comparison["specieY"]

        db_comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY)

        if not db_comparisons:
            inverted = True
            db_comparisons = Comparison.objects.all().filter(chromosome_x__specie__name=specieY, chromosome_y__specie__name=specieX)

        score_list.extend([10,comp['score']] for comp in db_comparisons.values('score'))

    print(score_list)
    K_CLUSTERS = 3
    km = KMeans(n_clusters=K_CLUSTERS, max_iter=10).fit(score_list)
    centers = sorted(score for i, score in km.cluster_centers_)

    print('--- CENTERS ---')
    print(centers)
    red_threshold = centers[0]#(centers[0] + centers[1])/2
    green_threshold = centers[1]#(centers[2] + centers[3])/2
    suggested_thresholds = { 'red': red_threshold, 'green': green_threshold }

    """
    print('--- CLUSTERS ---')
    clusters = []
    for curr_k in range(K_CLUSTERS):
        indexes = [i for i, x in enumerate(km.labels_) if x == curr_k]
        clusters.append([score_list[i][1] for i in indexes])

    for cluster in clusters:
        print(cluster)

    print('--- THRESHOLDS ---')
    red_threshold = max(clusters[1])#(centers[0] + centers[1])/2
    green_threshold = centers[2]#(centers[2] + centers[3])/2

    print('--- LABELS ---')
    labels = km.predict(score_list)
    print(labels)
    """

    #return HttpResponse('OK')
    return JsonResponse(json.dumps(suggested_thresholds), safe=False)



###############
### Helpers ###
###############
# Constants
BACKGROUND_INIT_H = 50
BACKGROUND_END_W = 1000

PLOT_INIT_PIXEL = 60
PLOT_MAX_PIXEL_W = 970
PLOT_MAX_PIXEL_H = 925

DIFF_H = PLOT_INIT_PIXEL-BACKGROUND_INIT_H

R_color = [192, 41, 126, 241, 39, 142, 22, 62, 57, 128, 126, 174, 196, 68, 160, 80, 43, 185, 34, 96, 15, 173, 133, 68, 160, 80, 43, 185, 34, 96, 150, 98, 133, 44, 192, 41, 230, 39, 241, 142, 22, 174, 196, 68, 160, 80, 43, 185, 57, 128, 126, 174, 196]
G_color = [57, 128, 230, 196, 174, 68, 160, 80, 43, 185, 34, 96, 15, 173, 133, 44, 192, 41, 230, 39, 241, 142, 22, 174, 196, 68, 160, 80, 43, 185, 34, 179, 39, 241, 142, 22, 62, 57, 128, 126, 174, 196, 68, 160, 80, 43, 185, 34, 96, 15, 173, 133, 68]
B_color = [43, 185, 34, 15, 96, 173, 133, 44, 192, 41, 230, 39, 241, 142, 22, 62, 57, 128, 126, 174, 196, 68, 160, 15, 173, 133, 44, 192, 41, 230, 54, 23, 15, 173, 133, 44, 192, 41, 96, 15, 173, 133, 44, 192, 41, 230, 241, 142, 22, 62, 57, 128, 174]

# Functions
def transparent_background(img_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        if item[0] == 255 and item[1] == 255 and item[2] == 255:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    
    return img

def change_color_transparent_img(img_obj, rgb):
    new_data = []

    for item in img_obj.getdata():
        if item[3] != 0:
            new_data.append(rgb)
        else:
            new_data.append(item)
    
    img_obj.putdata(new_data)

def resize_crop(img_obj, max_len, curr_len, overlay_axis, inverted):
    current_size = img_obj.size
    if (not inverted and overlay_axis == 'Y') or (inverted and overlay_axis == 'X'):
        new_dim = curr_len * current_size[1] / max_len
        return img_obj.resize((current_size[0], int(new_dim)))
    else:
        new_dim = curr_len * current_size[0] / max_len
        return img_obj.resize((int(new_dim),current_size[1]))

def sorted_properly(l):
    convert = lambda text: int(text) if text.isdigit() else text
    alphanum_key = lambda key: [convert(c) for c in re.split('([0-9]+)', key)]
    return sorted(l, key = lambda val: alphanum_key(val[0]))

def create_rgb_colors(n):
  ret = []
  r = int(random.random() * 256)
  g = int(random.random() * 256)
  b = int(random.random() * 256)
  step = 256 / n
  for i in range(n):
    r += step
    g += step
    b += step
    r = int(r) % 256
    g = int(g) % 256
    b = int(b) % 256
    ret.append((r,g,b)) 
  return ret