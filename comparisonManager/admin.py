from django.contrib import admin
from comparisonManager.models import *

# Register your models here.


class ComparisonAdmin(admin.ModelAdmin):
    list_display = ('chromosome_x', 'chromosome_y')
    list_display_links = ('chromosome_x', 'chromosome_y')
    list_filter = ('chromosome_x', 'chromosome_y')
    ordering = ['chromosome_x']
    search_fields = ('chromosome_x', 'chromosome_y')
    list_per_page = 20

admin.site.register(Specie)
admin.site.register(Chromosome)
admin.site.register(Comparison, ComparisonAdmin)