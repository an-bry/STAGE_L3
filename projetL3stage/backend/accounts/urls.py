from django.urls import path
from .views import (
    ListeTechniciensView,
    RegisterView,
    ProfilView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profil/', ProfilView.as_view(), name='profil'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('techniciens/', ListeTechniciensView.as_view(), name='liste_techniciens'),
]