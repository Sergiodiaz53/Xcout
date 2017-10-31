from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from comparisonManager import functions

urlpatterns = [
        url(r'^comparison/', functions.generateJSONComparisonFromSpecies, name='generateJSONComparisonFromSpecies'),
        url(r'^updateDB/', functions.updateDBfromCSV, name='updateDBfromCSV'),
]