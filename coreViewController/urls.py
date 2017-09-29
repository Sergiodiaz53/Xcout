from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from coreViewController import views

urlpatterns = [
        url(r'^$', views.index, name='index'),
]