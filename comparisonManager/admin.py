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


class AnnotationAdmin(admin.ModelAdmin):
    list_display = ('species', 'gen_x1', 'gen_x2', 'strand', 'gene', 'gene_synonym', 'product', 'note')
    list_display_links = ('species', 'gen_x1', 'gen_x2', 'gene', 'gene_synonym', 'strand', 'product', 'note')
    list_filter = ('species', 'strand')
    ordering = ['species']
    # search_fields = ('species', 'strand')
    list_per_page = 20


admin.site.register(Specie)
admin.site.register(Chromosome)
admin.site.register(Comparison, ComparisonAdmin)
admin.site.register(Annotation, AnnotationAdmin)
