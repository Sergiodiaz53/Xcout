from django.shortcuts import render
from comparisonManager.models import *

def index (request):
    chromosomes = Specie.objects.all()
    return render(request, 'index.html', {'chromosomes' : chromosomes })

def contact(request):
    return render(request, 'contact.html')

def help(request):
    return render(request, 'help.html')

#=========================================================


def test(request):
    return render(request, 'test_annotation.html')
