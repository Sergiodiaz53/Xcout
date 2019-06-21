from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from comparisonManager import functions

urlpatterns = [
        url(r'^comparison/', functions.generateJSONComparisonFromSpecies, name='generateJSONComparisonFromSpecies'),
        url(r'^chromosomes/', functions.generateJSONChromosomesFromSpecie, name='generateJSONChromosomesFromSpecie'),
        url(r'^updateDB/', functions.updateDBfromCSV, name='updateDBfromCSV'),
        url(r'^overlay/', functions.createOverlayedImage, name="createOverlayedImage"),
        url(r'^color_threshold/', functions.automaticColorThreshold, name="automaticColorThreshold"),
        # url(r'^annotation_test/', functions.generateJSONAnnotationFromSpecie, name='generateJSONAnnotationFromSpecie'),
        url(r'^annotation_between/', functions.generateJSONAnnotationFromSpecieBetweenPositions, name='generateJSONAnnotationFromSpecieBetweenPositions'),
        url(r'^load_annotations/', functions.loadAnnotations, name='loadAnnotations'),
        url(r'^annotation_between_paginated/', functions.generateJSONAnnotationFromSpecieBetweenPositionsPaginated, name='generateJSONAnnotationFromSpecieBetweenPositionsPaginated'),
]
