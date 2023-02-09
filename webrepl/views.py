from django.shortcuts import render
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

def login(request):
    return render(request,'webrepl/login.html')

def welcome(request):
    return render(request,'webrepl/welcome.html')

def pairing(request):
    return render(request,'webrepl/pairing.html')