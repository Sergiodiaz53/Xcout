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
    img = models.ImageField(max_length=500)

    def __str__(self):
        return u'%s vs %s | Score :: %s' % (self.chromosome_x, self.chromosome_y, str(self.score))




