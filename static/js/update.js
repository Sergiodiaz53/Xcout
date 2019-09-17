$(document).ready(function(){
   $('form').on('submit', function(event){
       event.preventDefault();
       var formData = new FormData($('form')[0]);

       $.ajax({
           xhr: function(){
               var xhr = new window.XMLHttpRequest();
               xhr.upload.addEventListener('progress', function(e){
                   if (e.lengthComputable){
                       console.log(e.loaded);
                       console.log(e.total);
                       console.log(e.loaded/e.total);
                   }
               });
               return xhr;
           },
           type: 'POST',
           url: '',
           data: formData,
           processData: false,
           contentType: false,
           success: function(){
               alert('File uploaded');
           }
       });
   });
});