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

### BlockTracer Main ###
# Request
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])

def trace(request):
    print(request.POST)
    species = json.loads(request.POST.get('species', ''))
    chromosomes = json.loads(request.POST.get('chromosomes', ''))

    print(species)
    print(chromosomes)

    jsonResponseList = [species, chromosomes]
    
    return JsonResponse(json.dumps(jsonResponseList), safe=False)

### BlockTracer ###
"""
import argparse
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

def recursive_overlap_checking(files, index, current_blocks, current_original_blocks, output_file, traced_block_info, min_depth):
    if index >= min_depth:
        for i in range(len(current_blocks)):
            output_file.write(traced_block_info)
            output_file.write(str(index-1) + '\t' + str(scale(current_blocks[i])[:-1]) + '\t' + str(scale(current_original_blocks[i])[:-1]) + '\n\n')
    if index < len(files):
        new_name = get_comparison_name(files[index])
        new_comparison_blocks = obtain_blocks(files[index], index, new_name)
        for i in range(len(current_blocks)):
            new_blocks, new_original_blocks = compare_blocks(current_blocks[i], new_comparison_blocks)
            if new_blocks != []:
                recursive_overlap_checking(files, index + 1, new_blocks, new_original_blocks, output_file, traced_block_info + str(index-1) + '\t' + str(scale(current_blocks[i])[:-1]) + '\t' + str(scale(current_original_blocks[i])[:-1]) + '\n', min_depth)
     
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