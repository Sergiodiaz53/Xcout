import csv
import os

from django.http import HttpResponse
from django.shortcuts import render
from django.core.files.storage import FileSystemStorage

from comparisonManager.models import *


def upload_blast_result(request):
    context = {}
    if request.method == 'POST':
        uploaded_file = request.FILES['blast_result']
        fss = FileSystemStorage()
        file_name = fss.save(uploaded_file.name, uploaded_file)
        url = fss.url(file_name)
        location = fss.location
        print(uploaded_file.name)
        print(uploaded_file.size)
        print(url)
        print(location)
        annotation_file_name = handle_blast_result(location, file_name, 'HOMSA')
        context['asset_url'] = fss.url(annotation_file_name)
        print(context['asset_url'])

    return render(request, 'upload_blast_result.html', context)


def handle_blast_result(location, file_name, species_name):
            #cambiar
            species = Specie.objects.get(name=species_name)

            #preparar la respuesta http en formato csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="annotations_of_' + file_name+ '"'

            csv_w = csv.writer(response)
            csv_w.writerow(['id_query', 'id_db', 'pos_blast_x1', 'pos_blast_x2', 'pos_gen_x1',
                            'pos_gen_x2', 'gene', 'gene_synonym', 'product', 'note'])

            with open(os.path.join(location, file_name), 'r') as result_file,\
                    open(os.path.join(location, 'annotations_of_' + file_name), 'w') as output_file:
                # Primera parte:
                # filtrar los resultados para que no se repitan los mismos trozos
                visited_positions = []
                results = []

                # lectura de cada csv
                csv_reader = csv.reader(result_file, delimiter=',')
                line_count = 0
                for row in csv_reader:
                    position = [row[8], row[9]]
                    print(position)
                    if position not in visited_positions:
                        print('no esta')
                        visited_positions.append(position)
                        #blast_res = BlastResult(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8],
                                                #row[9], row[10], row[11], row[12], row[13], row[14])
                        results.append([row[0], row[1], row[8], row[9]])

                    line_count += 1
                print(str(line_count) + ' processed lines.')

                # Segunda parte:
                # utilizar las posiciones filtradas para obtener las anotaciones contenidas
                # por cada resultado
                for result in results:
                    # obtenemos las anotaciones comprendidas entre ambas posiciones
                    annotations = Annotation.objects.all().filter(
                        species__name=species,
                        gen_x1__gte=result[2],
                        gen_x2__lte=result[3]
                    ).order_by('gen_x1')

                    # lo añadimos al csv junto con la info del resultado
                    for annotation in annotations:
                        row = '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s' % (result[0], result[1], result[2], result[3],
                                                                 annotation.gen_x1, annotation.gen_x2, annotation.gene,
                                                                 annotation.gene_synonym, annotation.product,
                                                                 annotation.note)
                        print(row)
                        output_file.write(row + '\n')
                        '''csv_w.writerow([result[0], result[1], result[2], result[3],
                                        annotation.gen_x1, annotation.gen_x2, annotation.gene, annotation.gene_synonym,
                                        annotation.product, annotation.note])
                        '''
                return 'annotations_of_' + file_name
