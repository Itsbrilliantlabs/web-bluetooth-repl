from django.urls import path
from . import views


urlpatterns = [
    path('',views.index, name='home'),
    path('v2',views.v2, name='v2'),
    path('login',views.login, name='login'),
    path('welcome',views.welcome, name='welcome'),
    path('pairing',views.pairing, name='pairing'),
]