from __future__ import unicode_literals

from django.db import models

# Create your models here.

class Specie(models.Model):
    name = models.CharField(max_length=60, null=False)
    short_name = models.CharField(max_length=10, null=False)
    accesion_number = models.CharField(max_length=50, null=False, primary_key=True)

    def __str__(self):
        return self.name

class Chromosome(models.Model):
    specie = models.ForeignKey(Specie, on_delete=models.CASCADE)
    fasta = models.URLField(max_length=250)
    number = models.CharField(max_length=2,null=False)
    length = models.IntegerField(null=False)

    def __str__(self):
        return u'%s %s %s' % (self.specie, self.number, self.length)

class Comparison(models.Model):
    chromosome_x = models.ForeignKey(Chromosome, on_delete=models.CASCADE, related_name='chromosome_specie_X')
    chromosome_y = models.ForeignKey(Chromosome, on_delete=models.CASCADE, related_name='chromosome_specie_Y')
    score = models.FloatField(null=False)
    img = models.ImageField(max_length=500, null=False)
    csv = models.CharField(max_length=500, null=False)

    def __str__(self):
        return u'%s vs %s | Score :: %s' % (self.chromosome_x, self.chromosome_y, str(self.score))

class Annotation(models.Model):
    specie = models.ForeignKey(Specie, on_delete=models.CASCADE)
    gen_x = models.BigIntegerField(null=False)
    gen_y = models.BigIntegerField(null=False)
    #locus_tag = models.CharField(max_length=20)
    #db_xref = models.CharField(max_length=20)
    product = models.CharField(max_length=200, default="No data found.")
    note = models.CharField(max_length=200, default="No data found.")

    def __str__(self):
        return u'Specie: %s | %s:%s | Product: %s | Note: %s' % (self.specie, str(self.gen_x), str(self.gen_y), self.product, self.note)
        #return u'Specie: %s | %s:%s Locus: %s XRef: %s' % (self.specie, str(self.gen_x), str(self.gen_y), self.locus_tag, self.db_xref)
