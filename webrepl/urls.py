from django.urls import path
from . import views


urlpatterns = [
    path('',views.index, name='home'),
    path('login',views.login, name='login'),
    path('welcome',views.welcome, name='welcome'),
    path('pairing',views.pairing, name='pairing'),
]