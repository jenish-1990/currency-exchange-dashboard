from django.urls import path

from dashboard import views

urlpatterns = [
    path('rates/', views.rates),
    path('currencies/', views.currencies),
]
