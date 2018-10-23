from django.shortcuts import render
from comparisonManager.models import *
from django.http import JsonResponse
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes, permission_classes
import json
import os

# Create your views here.
def test(request):
    return HttpResponse(request, '')

########################
### BlockTracer Main ###
########################

# Request
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])

def trace(request):
    species = json.loads(request.POST.get('species', ''))
    chromosomes = json.loads(request.POST.get('chromosomes', ''))

    # Retrieve Chromosomes Lengths
    lengths_dict = {}
    for index, specie in enumerate(species):
        specie_dict = {}
        for chromosome in chromosomes[index]:
            db_query = Chromosome.objects.all().filter(specie__name=specie, number=chromosome).first()
            specie_dict[chromosome] = db_query.length
        lengths_dict[specie] = specie_dict
        

    # Retrieve all CSV names
    events_steps = []
    inverted_steps = []
    for index, specieX in enumerate(species[:-1]):
        inverted = False
        specieY = species[index+1]
        current_step = []
        for chromosome in chromosomes[index]:
            db_comparisons = Comparison.objects.all().filter(chromosome_x__specie__name=specieX, chromosome_x__number=chromosome, chromosome_y__specie__name=specieY, chromosome_y__number__in=chromosomes[index+1])
        
            if not db_comparisons:
                inverted = True
                db_comparisons = Comparison.objects.all().filter(chromosome_x__specie__name=specieY, chromosome_x__number__in=chromosomes[index+1], chromosome_y__specie__name=specieX, chromosome_y__number__in=chromosome)
            
            current_step.extend(db_comparisons)

        inverted_steps.append(inverted)
        events_steps.append(current_step)
        
    # Generate list of file lists (Combine)
    #print(events_steps)
    #print(inverted)
    l_comparison_list = [[events] for events in events_steps[0]]
    inverted_list = []
    for i, current_step in enumerate(events_steps[1:]):
        tmp_list = []
        inverted = (inverted_steps[i] and inverted_steps[i-1])
        #print(inverted)
        for current_event in current_step:
            for index, comparison_list in enumerate(l_comparison_list):
                #print(comparison_list[-1])
                evaluation = (not inverted and comparison_list[-1].chromosome_y == current_event.chromosome_x) \
                    or (inverted and comparison_list[-1].chromosome_x == current_event.chromosome_y)
                #print(evaluation)
                if evaluation:
                    new_list = [comparison_list[-1], current_event]
                    tmp_list.append(new_list)


        l_comparison_list = tmp_list
    
    print("################")
    print("N Combination :: " + str(len(l_comparison_list)))
    print("################")

    # Execute BlockTracer
    outputs = [];#'file_ID\ttraced_block\toriginal_block\n'

    for comparison_list in l_comparison_list:
        files = ['media/' + comparison.csv for comparison in comparison_list]
        first_overlapped_blocks = obtain_blocks(files[0], 0, get_comparison_name(files[0]))
        blocks_traced = recursive_overlap_checking(files, 1, first_overlapped_blocks, first_overlapped_blocks, comparison_list)
        outputs.extend(blocks_traced)

    #print(outputs)
    jsonResponseDict = {'events': clear_duplicate_events(outputs),
        'lengths' : lengths_dict}
    
    return JsonResponse(json.dumps(jsonResponseDict ), safe=False)

###################
### BlockTracer ###
###################
import copy

def check_inversion(event):
    if int(event[0]) > int(event[2]):
        event[0], event[2] = event[2], event[0]
    return event

def overlapped(block_a, block_b):
    return int(block_a[1]) <= int(block_b[2]) and int(block_b[0]) <= int(block_a[3])

def overlap_coefficient(block_a, block_b):
    x1 = int(block_a[0])
    x2 = int(block_a[2])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
    y1 = int(block_b[1])
    y2 = int(block_b[3])
    if (min(x2, y2) < max (x1, y1)):
        return 0 #not overlaped
    return 100 * (min(x2, y2) - max(x1, y1)) / min(x2-x1, y2-y1)

def get_comparison_name(path):
    path = path.split('/')
    return path[-1]

def scale(block):
    new_block = copy.deepcopy(block)
    for i in range(4):
        length_index = 6 if i % 2 == 1 or i == 4 else 7
        new_block[i] = str(int(int(block[i]) / block[length_index] * 1000))
    return new_block

def unscale(block):
    new_block = copy.deepcopy(block)                                                                                                                                                                                                                                            
    for i in range(4):
        length_index = 6 if i % 2 == 1 or i == 4 else 7
        new_block[i] = str(int(int(block[i]) * block[length_index] / 1000))
    return new_block

def obtain_blocks(file, index, name):
    events = []
    file_events = [line.rstrip('\n') for line in open(file)]
    length_x = int(file_events[0].split(',')[0])
    length_y = int(file_events[0].split(',')[1])
    event_list = file_events[2:-1]
    for line in event_list:
        event = line.split(",")
        event = check_inversion(event)
        event.append(length_x)
        event.append(length_y)
        event.append(name)
        event = unscale(event)
        events.append(event)
    return events

def extract_block_info(block):
    inv = True if 'inv' in block[5] else False
    return {'x1': block[0], 'y1': block[1], 'x2': block[2], 'x3': block[3], 'inverted': inv}

def compare_blocks(base_block, new_blocks_list):
    blocks = []
    original_blocks = []
    for block in new_blocks_list:
        original_block = copy.deepcopy(block)
        if overlap_coefficient(base_block, block) > 80:
            # Take only the overlapped part
            if int(base_block[1]) > int(block[0]):
                block[1] = str(int(block[1]) + ((int(base_block[1]) - int(block[0]))*block[7]//block[6]))
                block[0] = base_block[1]
            if int(base_block[3]) < int(block[2]):
                block[3] = str(int(block[3]) - ((int(block[2]) - int(base_block[3]))*block[7]//block[6]))
                block[2] = base_block[3]
            # Blocks that are inversions of inverted transposition need y coordinates to be swapped
            if 'inv' in block[5]:
                block[1], block[3] = block[3], block[1]
                original_block[1], original_block[3] = original_block[3], original_block[1]
            block[4] = abs(int(block[1]) - int(block[3]))
            blocks.append(block)
            original_blocks.append(original_block)
    return blocks, original_blocks

def recursive_overlap_checking(files, index, current_overlapped_blocks, current_original_blocks, comparisons, traced_block_infos = [], prev_blocks_traced = [], min_depth = 1):
    blocks_traced = []#copy.deepcopy(prev_blocks_traced)
    comparison = comparisons[index-1]
    comparison_info = {'spX': comparison.chromosome_x.specie.name, 'chrX': comparison.chromosome_x.number, \
        'spY': comparison.chromosome_y.specie.name, 'chrY': comparison.chromosome_y.number}
    
    if index >= min_depth:
        # Search for new blocks of at least the minimum depths
        for i in range(len(current_overlapped_blocks)):
            overlapped_block = extract_block_info(current_overlapped_blocks[i][:-1])
            original_block = extract_block_info(current_original_blocks[i][:-1])
            current_block = {'info': comparison_info, 'overlap': overlapped_block, 'original': original_block}

            # Append BlockInfo to Current BlockTraced
            current_block_traced = copy.deepcopy(traced_block_infos)
            current_block_traced.append(current_block)

            # Append Current BlockTraced to BlocksTraced (result)
            blocks_traced.append(current_block_traced)
    if index < len(files):
        # Search for new blocks in next comparisons
        new_name = get_comparison_name(files[index])
        new_comparison_blocks = obtain_blocks(files[index], index, new_name)
        for i in range(len(current_overlapped_blocks)):
            new_blocks, new_original_blocks = compare_blocks(current_overlapped_blocks[i], new_comparison_blocks)
            if new_blocks != []:
                overlapped_block = extract_block_info(current_overlapped_blocks[i][:-1])
                original_block = extract_block_info(current_original_blocks[i][:-1])
                current_block = {'info': comparison_info, 'overlap': overlapped_block, 'original': original_block}

                # Create new 'traced_block_infos'
                new_traced_block_info = copy.deepcopy(traced_block_infos)
                new_traced_block_info.append(current_block)
                blocks_traced.extend(recursive_overlap_checking(files, index+1, new_blocks, new_original_blocks, comparisons, new_traced_block_info))
        return blocks_traced
    else:
        return blocks_traced

def clear_duplicate_events(events):
    clean_l = []
    for event in events:
        if event not in clean_l:
            clean_l.append(event)

    return clean_l
"""

M Listas de Ficheros de Comparaciones
    N Ficheros de Comparaciones
        traced_block_infos = [] # List_BlockTraced
            por cada 'arbol' creado, append 1 'BlockTraced' a la lista List_BlockTraced
                BlockTraced = []
                por cada 'BlockTraced' hay K<=N 'BlockInfo'
                    BlockInfo = {	'comparison_info': [species1, species2, chromosome1, chromosome2],
                        'original_block': [x_start, y_start, x_end, y_end, name, inversion],
                        'traced_block': [x_start, y_start, x_end, y_end, name, inversion]}
"""