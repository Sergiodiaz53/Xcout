$(document).ready(function(){
   $('form').on('submit', function(event){
       $('#progressBar').removeClass('progress-bar-info').attr('aria-valuenow', 0).css('width', '0%').text('0%');
       event.preventDefault();
       let formData = new FormData($('form')[0]); // Solo hay un form asi que cojo el [0]

       $.ajax({
           xhr: function(){
               var xhr = new window.XMLHttpRequest();
               xhr.upload.addEventListener('progress', function(e){
                   if (e.lengthComputable){
                       console.log('Bytes loaded: ' + e.loaded);
                       console.log('Total size: ' + e.total);
                       console.log('Percentage uploaded: ' + e.loaded/e.total);

                       let percent = Math.round((e.loaded / e.total) * 100);

                       $('#progressBar').attr('aria-valuenow', percent).css('width', percent + '%').text(percent + '%');
                   }
               });
               return xhr;
           },
           type: 'POST',
           url: 'http://localhost:8000/xcout/API/upload_blast_result/', // CAMBIAR
           data: formData,
           processData: false,
           contentType: false,
           success: function(){
                $('#progressBar').addClass('progress-bar-success').text('File uploaded!');
                //view.render()
           }
       });
   });
});