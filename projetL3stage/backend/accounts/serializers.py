import re
from rest_framework import serializers
from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'telephone', 'raison_sociale', 'specialite']



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Utilisateur
        fields = ['username', 'first_name', 'last_name', 'email', 'password', 'role', 'telephone', 'raison_sociale', 'specialite']

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Le nom d'utilisateur ne doit contenir que des lettres, chiffres et underscores."
            )
        if Utilisateur.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_first_name(self, value):
        if not re.match(r'^[A-Za-zÀ-ÿ\s\-]+$', value):
            raise serializers.ValidationError("Le prénom ne doit contenir que des lettres.")
        return value

    def validate_last_name(self, value):
        if not re.match(r'^[A-Za-zÀ-ÿ\s\-]+$', value):
            raise serializers.ValidationError("Le nom ne doit contenir que des lettres.")
        return value

    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_telephone(self, value):
        if value and not re.match(r'^[0-9+\s]+$', value):
            raise serializers.ValidationError("Le téléphone ne doit contenir que des chiffres.")
        return value

    def validate_raison_sociale(self, value):
        if value and any(char.isdigit() for char in value):
            raise serializers.ValidationError("La raison sociale ne doit pas contenir de chiffres.")
        return value

    def validate_specialite(self, value):
        if value and any(char.isdigit() for char in value):
            raise serializers.ValidationError("La spécialité ne doit pas contenir de chiffres.")
        return value

    def validate(self, data):
        role = data.get('role')
        if role == 'CLIENT':
            if data.get('specialite'):
                raise serializers.ValidationError({"specialite": "Un client ne doit pas avoir de spécialité."})
            if not data.get('raison_sociale'):
                raise serializers.ValidationError({"raison_sociale": "La raison sociale est obligatoire pour un client."})
        if role == 'TECHNICIEN':
            if data.get('raison_sociale'):
                raise serializers.ValidationError({"raison_sociale": "Un technicien ne doit pas avoir de raison sociale."})
            if not data.get('specialite'):
                raise serializers.ValidationError({"specialite": "La spécialité est obligatoire pour un technicien."})
        if role == 'ADMIN':
            if data.get('raison_sociale') or data.get('specialite'):
                raise serializers.ValidationError("Un admin ne doit avoir ni raison sociale ni spécialité.")
        return data

    def create(self, validated_data):
        user = Utilisateur(
            username=validated_data['username'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            role=validated_data['role'],
            telephone=validated_data.get('telephone'),
            raison_sociale=validated_data.get('raison_sociale'),
            specialite=validated_data.get('specialite'),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

class TechnicienResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'specialite']