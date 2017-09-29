from __future__ import unicode_literals

from django.db import models

# Create your models here.

class Specie(models.Model):
    name = models.CharField(max_length=60, null=False)
    short_name = models.CharField(max_length=10, null=False)
    accesion_number = models.CharField(max_length=16, null=False, primary_key=True)

    def __str__(self):
        return self.name, self.shortname, self.accesion_number

class Chromosome(models.Model):
    specie = models.ForeignKey(Specie, on_delete=models.CASCADE)
    fasta = models.FileField()
    number = models.SmallIntegerField()

    def __str__(self):
        return self.specie, self.number

class Comparison(models.Model):
    chromosome_x = models.ForeignKey(Chromosome, on_delete=models.CASCADE, related_name='chromosome_specie_X')
    chromosome_y = models.ForeignKey(Chromosome, on_delete=models.CASCADE, related_name='chromosome_specie_Y')
    score = models.FloatField(null=False)
    img = models.ImageField()

    def __str__(self):
        return self.chromosome_x, self.chromosome_y, self.score, self.img




