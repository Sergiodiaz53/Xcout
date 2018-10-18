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
    print(events_steps)
    print(inverted)
    l_comparison_list = [[events] for events in events_steps[0]]

    for i, current_step in enumerate(events_steps[1:]):
        tmp_list = []
        inverted = (inverted_steps[i] and inverted_steps[i-1])
        print(inverted)
        for current_event in current_step:
            for comparison_list in l_comparison_list:
                print(comparison_list[-1])
                evaluation = (not inverted and comparison_list[-1].chromosome_y == current_event.chromosome_x) \
                    or (inverted and comparison_list[-1].chromosome_x == current_event.chromosome_y)
                print(evaluation)
                if evaluation:
                    new_list = [comparison_list[-1], current_event]
                    tmp_list.append(new_list)

        l_comparison_list = tmp_list
    
    print("################")
    print("N Combination :: " + str(len(l_comparison_list)))
    print("################")

    # Execute BlockTracer
    outputs = 'file_ID\ttraced_block\toriginal_block\n'

    for comparison_list in l_comparison_list:
        files = ['media/' + comparison.csv for comparison in comparison_list]

        current_blocks = obtain_blocks(files[0], 0, get_comparison_name(files[0]))
        recursive_overlap_checking(files, 1, current_blocks, current_blocks, outputs, '', 2)

    print(outputs)
    print(OUTPUT_TEST)
    jsonResponseList = [outputs]
    
    return JsonResponse(json.dumps(jsonResponseList), safe=False)

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
    for i in range(5):
        length_index = 6 if i % 2 == 1 or i == 4 else 7
        new_block[i] = str(int(int(block[i]) / block[length_index] * 1000))
    return new_block

def unscale(block):
    new_block = copy.deepcopy(block)                                                                                                                                                                                                                                            
    for i in range(5):
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
    print(events)
    return events

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

OUTPUT_TEST = ""
def recursive_overlap_checking(files, index, current_blocks, current_original_blocks, output_file, traced_block_info, min_depth):
    global OUTPUT_TEST
    if index >= min_depth:
        for i in range(len(current_blocks)):
            print("test1")
            new_string = str(traced_block_info)
            new_string += str(index-1) + '\t' + str(scale(current_blocks[i])[:-1]) + '\t' + str(scale(current_original_blocks[i])[:-1]) + '\n\n'
            print(new_string)
            OUTPUT_TEST += new_string
    if index < len(files):
        print("test2")
        new_name = get_comparison_name(files[index])
        new_comparison_blocks = obtain_blocks(files[index], index, new_name)
        #if no blocks have been found, stop all posible combinations
        for i in range(len(current_blocks)):
            new_blocks, new_original_blocks = compare_blocks(current_blocks[i], new_comparison_blocks)
            if new_blocks != []:
                recursive_overlap_checking(files, index + 1, new_blocks, new_original_blocks, output_file, traced_block_info + str(index-1) + '\t' + str(scale(current_blocks[i])[:-1]) + '\t' + str(scale(current_original_blocks[i])[:-1]) + '\n', min_depth)
    

"""
import argparse
parser = argparse.ArgumentParser(description='Process chromeister csv in order to find coincidences.')
parser.add_argument('input_filename', type = str, nargs = 1, help = 'Input filename containing paths to matrix files')
parser.add_argument('output_filename', type = str, nargs = 1, help = 'Output filename')
parser.add_argument('--min_depth', default = -1, type = int, nargs = 1, help = 'Blocks minimum depth. Default value is the number of filenames in the input file.')
args = parser.parse_args()

input_filename = args.input_filename[0]
output = args.output_filename[0]
min_depth = args.min_depth[0]

files = [line.rstrip('\n') for line in open(input_filename)]
output_file = open(output, 'a')
output_file.write('file_ID\ttraced_block\toriginal_block\n')
if min_depth == -1:
    min_depth = len(files)
current_blocks = obtain_blocks(files[0], 0, get_comparison_name(files[0]))
recursive_overlap_checking(files, 1, current_blocks, current_blocks, output_file, '', min_depth)
"""