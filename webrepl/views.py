from django.shortcuts import render
from django.http import HttpResponse
import requests
from allauth.socialaccount.models import SocialAccount
# from django.contrib import messages
# Create your views here.

def index(request):
    social_acc = None
    if request.user.is_authenticated:
        social_acc = SocialAccount.objects.filter(user=request.user).first()

    context  = {
        "social_acc" : social_acc
    }
    return render(request,'webrepl/index.html', context)

def v2(request):
    social_acc = None
    if request.user.is_authenticated:
        social_acc = SocialAccount.objects.filter(user=request.user).first()

    context  = {
        "social_acc" : social_acc
    }
    return render(request,'webrepl/index_bkp.html', context)

def login(request):
    return render(request,'webrepl/login.html')

def welcome(request):
    return render(request,'webrepl/welcome.html')

def pairing(request):
    return render(request,'webrepl/pairing.html')

def firmware_load(request):
    url = request.GET.get('url',None)
    if url:
        req = requests.get(url)
        return HttpResponse(req.content, content_type="application/zip")
    else:
        return HttpResponse('Bad Request',status=400)