from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request,'webrepl/index.html')

def login(request):
    return render(request,'webrepl/login.html')

def welcome(request):
    return render(request,'webrepl/welcome.html')

def pairing(request):
    return render(request,'webrepl/pairing.html')