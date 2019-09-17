from django.conf import settings
from django.conf.urls import url
from django.conf.urls.static import static

from comparisonManager import functions, views

urlpatterns = [
        url(r'^comparison/', functions.generateJSONComparisonFromSpecies, name='generateJSONComparisonFromSpecies'),
        url(r'^chromosomes/', functions.generateJSONChromosomesFromSpecie, name='generateJSONChromosomesFromSpecie'),
        url(r'^updateDB/', functions.updateDBfromCSV, name='updateDBfromCSV'),
        url(r'^overlay/', functions.createOverlayedImage, name="createOverlayedImage"),
        url(r'^color_threshold/', functions.automaticColorThreshold, name="automaticColorThreshold"),

        url(r'^annotation_between/', functions.generateJSONAnnotationFromSpecieBetweenPositions, name='generateJSONAnnotationFromSpecieBetweenPositions'),
        url(r'^load_annotations/', functions.loadAnnotations, name='loadAnnotations'),
        url(r'^annotation_between_paginated/', functions.generateJSONAnnotationFromSpecieBetweenPositionsPaginated, name='generateJSONAnnotationFromSpecieBetweenPositionsPaginated'),
        url(r'^annotation_count/', functions.getAnnotationsCount, name='getAnnotationsCount'),
        url(r'^annotation_gaps_csv/', functions.generateCSVAnnotationGaps, name='generateCSVAnnotationGaps'),

        url(r'^annotation_blast_csv/', functions.generateAnnotationsBlastResultsCSV, name='generateAnnotationsBlastResultsCSV'),
        url(r'^upload_blast_result/', views.upload_blast_result, name='uploadBlastResult')
]

if settings.DEBUG:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
