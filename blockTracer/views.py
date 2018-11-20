from django.shortcuts import render
from comparisonManager.models import *
from django.http import JsonResponse
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes, permission_classes
import json
import os

import copy

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
    empty_check = request.POST.get('emptyCheck', '')

    non_emtpy_species_chromo = set()

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
        
    # print(inverted_steps); print(events_steps)
    # Generate list of file lists (Combine)
    l_comparison_list = [[events] for events in events_steps[0]]
    inverted_list = []
    for i, current_step in enumerate(events_steps[1:]):
        tmp_list = []
        inverted = inverted_steps[i+1] # To fix inverted, add invert function to Comparison class and if inverted invert, then add.
        for current_event in current_step:
            for index, comparison_list in enumerate(l_comparison_list):
                evaluation = (not inverted and comparison_list[-1].chromosome_y == current_event.chromosome_x) \
                    or (inverted and comparison_list[-1].chromosome_y == current_event.chromosome_y)
                if evaluation:
                    new_list = copy.deepcopy(comparison_list); new_list.append(current_event)
                    tmp_list.append(new_list)

        l_comparison_list = tmp_list
    
    print("################")
    print("N Combination :: " + str(len(l_comparison_list)))
    print("################")

    # Execute BlockTracer
    outputs = []
    for i, comparison_list in enumerate(l_comparison_list):
        files = ['media/' + comparison.csv for comparison in comparison_list]
        first_overlapped_blocks = obtain_blocks(files[0], 0, get_comparison_name(files[0]))
        blocks_traced = recursive_overlap_checking(files, 1, first_overlapped_blocks, first_overlapped_blocks, comparison_list)
        outputs.append({'cmp_info': i, 'blocks': blocks_traced})

    outputs = sorted(clear_repeated_events( clear_duplicate_events(outputs)), key = lambda o: -1 if len(o['blocks']) == 0 else len(o['blocks'][0]) )
    
    for bt in outputs:
        blocks = bt.get('blocks')
        if len(blocks) > 0:
            blocks = [b for b in blocks[0]]
            for bi in blocks:
                curr_info = bi['info']
                non_emtpy_species_chromo.add(curr_info['spX'] + " - " + curr_info['chrX']); non_emtpy_species_chromo.add(curr_info['spY'] + " - " + curr_info['chrY'])

        jsonResponseDict = {'events': outputs,
            'lengths' : lengths_dict, 'non_empty': list(non_emtpy_species_chromo)}

        return JsonResponse(json.dumps(jsonResponseDict), safe=False)

###################
### BlockTracer ###
###################

def check_inversion(event):
    if event[0] > event[2]:
        event[0], event[2] = event[2], event[0]
    if event[1] > event[3]:
        event[1], event[3] = event[3], event[1]
    return event

def get_comparison_name(path):
    path = path.split('/')
    return path[-1]

def scale(block):
    new_block = copy.deepcopy(block)
    for i in range(4):
        length_index = -2 if i % 2 == 1 or i == 4 else -1
        new_block[i] = int(block[i] / block[length_index] * 1000)
    return new_block

def unscale(block):
    new_block = copy.deepcopy(block)                                                                                                                                                                                                                                            
    for i in range(4):
        length_index = -2 if i % 2 == 1 or i == 4 else -1
        new_block[i] = int(block[i] * block[length_index] / 1000)
    return new_block

def obtain_blocks(file, index, name):
    events = []
    file_events = [line.rstrip('\n') for line in open(file)]
    length_x = int(file_events[0].split(',')[0])
    length_y = int(file_events[0].split(',')[1])
    event_list = file_events[2:-1]
    if len(event_list) == 1:
        event = event_list[0].split(",")
        if int(event[0]) == 0 and int(event[1]) == 0 and int(event[2]) == 0 and int(event[3]) == 0:
            return []
    for line in event_list:
        event = line.split(",")
        event[:4] = [int(coord) for coord in event[:4]]
        event = check_inversion(event)
        event.append(name)
        event.append(length_x)
        event.append(length_y)
        event = unscale(event)
        events.append(event)
    return events

def extract_block_info(block):
    inv = True if 'inv' in block[5] else False
    return {'x1': block[1], 'y1': block[0], 'x2': block[3], 'y2': block[2], 'inverted': inv}

def overlapped(block_a, block_b):
    return block_a[1] <= block_b[2] and block_b[0] <= block_a[3]

def overlap_coefficient(block_a, block_b):
    x1 = block_a[0]
    x2 = block_a[2]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    y1 = block_b[1]
    y2 = block_b[3]
    if y2 < y1:
        y1, y2 = y2, y1
    if (min(x2, y2) <= max (x1, y1)):
        return 0 #not overlaped
    return 100 * (min(x2, y2) - max(x1, y1)) / min(x2-x1, y2-y1)

def compare_blocks(base_block, new_blocks_list):
    blocks = []
    original_blocks = []
    for new_block in new_blocks_list:
        # Take only the overlapped part of the block if overlap
        if overlap_coefficient(base_block, new_block) > 95:
            original_block = copy.deepcopy(new_block)
            cut_block = copy.deepcopy(new_block)
            scale_index = 0; factor = 1
            if 'inv' in cut_block[5]:
                scale_index = scale_index+2
                factor = -1*factor
            # Left Edge
            lb1 = new_block[3]-new_block[1]; lb2 = new_block[2]-new_block[0]
            if base_block[0] > new_block[1]:
                d1 = base_block[0] - new_block[1]
                scaling = int( d1 * lb2/lb1 )
                cut_block[0+scale_index] = new_block[0+scale_index] + factor*scaling
                cut_block[1] = base_block[0]
            # Right Edge
            if base_block[2] < new_block[3]:
                d2 = new_block[3] - base_block[2]
                scaling = int( d2 * lb2/lb1 )
                cut_block[2-scale_index] = new_block[2-scale_index] - factor*scaling
                cut_block[3] = base_block[2]
            blocks.append(cut_block)
            original_blocks.append(original_block)
    
    return blocks, original_blocks

def recursive_overlap_checking(files, index, current_overlapped_blocks, current_original_blocks, comparisons, traced_block_infos = [], prev_blocks_traced = [], min_depth = 1, cmp_index=0):
    blocks_traced = []#copy.deepcopy(prev_blocks_traced)
    comparison = comparisons[index-1]
    comparison_info = {'spX': comparison.chromosome_x.specie.name, 'chrX': comparison.chromosome_x.number, \
        'spY': comparison.chromosome_y.specie.name, 'chrY': comparison.chromosome_y.number}
    
    if index >= min_depth:
        # Search for new blocks of at least the minimum depths
        for i in range(len(current_overlapped_blocks)):
            overlapped_block = extract_block_info(current_overlapped_blocks[i])
            #original_block = extract_block_info(current_original_blocks[i])
            current_block = {'info': comparison_info, 'overlap': overlapped_block}#, 'original': original_block}

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
                #original_block = extract_block_info(current_original_blocks[i][:-1])
                current_block = {'info': comparison_info, 'overlap': overlapped_block}#, 'original': original_block}

                # Create new 'traced_block_infos'
                new_traced_block_info = copy.deepcopy(traced_block_infos)
                new_traced_block_info.append(current_block)

                # Remove previous block
                try:
                    r_index = blocks_traced.index(new_traced_block_info)
                    del blocks_traced[r_index]
                except:
                    pass
                # Add new blocks
                new_blockstraced = recursive_overlap_checking(files, index+1, new_blocks, new_original_blocks, comparisons, traced_block_infos=new_traced_block_info, cmp_index=cmp_index)
                blocks_traced.extend(new_blockstraced)

        return blocks_traced
    else:
        return blocks_traced

def clear_duplicate_events(events):
    clean_l = []
    all_blocks = [block.get("blocks") for block in events]

    for i, event in enumerate(events):
        curr_clean = [clear_block.get("blocks") for clear_block in clean_l]
        if all_blocks[i] not in curr_clean:
            clean_l.append(event)

    return clean_l

def clear_repeated_events(events):
    clean_l = []
    all_blocks = [block.get("blocks") for block in events]

    for i, block_traced in enumerate(events):
        b_keep = True
        for j, block_traced_2 in enumerate(events):
            if all_blocks[i] != all_blocks[j]:
                b_contained = check_contained_blocktraced(all_blocks[i], all_blocks[j])
                if b_contained is True:
                    b_keep = False
                    break
        if b_keep is True:
            clean_l.append(block_traced)

    return clean_l

def check_contained_blocktraced(block1, block2):
    infos_1 = [info for info in block1]
    infos_2 = [info for info in block2]
    index = len(infos_1)-1; index_2 = len(infos_2)-1

    if index > len(infos_2)-1:
        return False
    elif index <= 0:
        return True

    #print("----");print(infos_1); print(infos_2)
    index = index_2 if index > index_2 else index
    info_1 = infos_1[index]
    info_2 = infos_2[index]
    ret = True if info_1 == info_2 else False

    return ret

def stripe_block_traced(event, key='overlap'):
    ret = event[-1][key].values()
    return set(ret)

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