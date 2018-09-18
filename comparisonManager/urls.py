from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from comparisonManager import functions

urlpatterns = [
        url(r'^comparison/', functions.generateJSONComparisonFromSpecies, name='generateJSONComparisonFromSpecies'),
        url(r'^updateDB/', functions.updateDBfromCSV, name='updateDBfromCSV'),
        url(r'^overlay/', functions.createOverlayedImage, name="createOverlayedImage"),
        url(r'^color_threshold/', functions.automaticColorThreshold, name="automaticColorThreshold"),
]