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
    species = models.ForeignKey(Specie, on_delete=models.CASCADE)
    #chromosome = models.ForeignKey(Chromosome, on_delete=models.CASCADE)
    chromosome = models.CharField(max_length=500, default="Unknown")
    gen_x1 = models.BigIntegerField(null=False)
    gen_x2 = models.BigIntegerField(null=False)
    strand = models.IntegerField(null=False, default=1)
    gene = models.CharField(max_length=500, default="Unknown")
    gene_synonym = models.CharField(max_length=500, default="Unknown")
    product = models.CharField(max_length=500, default="Unknown")
    note = models.CharField(max_length=500, default="Unknown")

    def __str__(self):
        return u'Species: %s | Chr: %s | %s:%s(%s) | Gene: %s (Synonym: %s) Product: %s | Note: %s' % \
               (self.species, self.chromosome, str(self.gen_x1), str(self.gen_x2), str(self.strand), self.gene, self.gene_synonym,
                self.product, self.note)
        #return u'Species: %s | %s:%s Locus: %s XRef: %s' % (self.specie, str(self.gen_x1), str(self.gen_x2), self.locus_tag, self.db_xref)
