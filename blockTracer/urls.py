from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from blockTracer import views

urlpatterns = [
        url(r'^test/', views.test, name='test'),
        url(r'^trace/', views.trace, name='trace'),
]