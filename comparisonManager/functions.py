from comparisonManager.models import *
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes, permission_classes
import json


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def generateJSONComparisonFromTwoSpecies(request):
    specieX = request.GET.get('specieX', '')
    specieY = request.GET.get('specieY', '')
    comparisons = Comparison.objects.all().filter(chromosome_x__specie__name = specieX, chromosome_y__specie__name = specieY)

    jsonChromosomeList = []
    auxChromosomeDict = {}
    for comparison in comparisons:
        auxChromosomeDict["specieX"] = specieX
        auxChromosomeDict["chromosomeX_number"] = comparison.chromosome_x.number
        auxChromosomeDict["specieY"] = specieY
        auxChromosomeDict["chromosomeY_number"] = comparison.chromosome_y.number
        auxChromosomeDict["score"] = comparison.score
        auxChromosomeDict["img"] = comparison.img.url
        jsonChromosomeList.append(auxChromosomeDict.copy())

    return JsonResponse(json.dumps(jsonChromosomeList), safe=False)

