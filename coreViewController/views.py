from django.shortcuts import render
from comparisonManager.models import *

def index (request):

    chromosomes = Specie.objects.all()

    return render(request, 'index.html', {'chromosomes' : chromosomes })