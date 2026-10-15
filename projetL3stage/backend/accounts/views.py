from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin

from .models import Utilisateur
from .serializers import (
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    TechnicienResumeSerializer,
    UtilisateurSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # Utilisation de .filter().first() pour éviter les erreurs de doublons
        user = Utilisateur.objects.filter(email=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            send_mail(
                subject="Reinitialisation de votre mot de passe",
                message=f"Cliquez sur ce lien pour reinitialiser votre mot de passe : {reset_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
            )

        return Response(
            {"detail": "Si ce compte existe, un email a ete envoye."},
            status=status.HTTP_200_OK,
        )

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = Utilisateur.objects.get(pk=uid)
        except (Utilisateur.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Lien invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, data['token']):
            return Response(
                {"detail": "Lien invalide ou expire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data['new_password'])
        user.save()

        return Response(
            {"detail": "Mot de passe reinitialise avec succes."},
            status=status.HTTP_200_OK,
        )

class ListeTechniciensView(generics.ListAPIView):
    """Liste des techniciens, pour l'Admin (affectation de ticket)."""
    serializer_class = TechnicienResumeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Utilisateur.objects.filter(role='TECHNICIEN')