"""Xcout URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Import the include() function: from django.conf.urls import url, include
    3. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static

urlpatterns = [
                  url(r'^xcout/', include('coreViewController.urls')),
                  url(r'^xcout/admin/', admin.site.urls),
                  url(r'^xcout/API/', include('comparisonManager.urls')),
                  url(r'^xcout/blocktracer/', include('blockTracer.urls')),
                  # url(r'^xcout/help/', ),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
