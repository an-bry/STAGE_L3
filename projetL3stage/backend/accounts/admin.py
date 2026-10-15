from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


class UtilisateurAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']

    fieldsets = UserAdmin.fieldsets + (
        ('Informations métier', {'fields': ('role', 'telephone', 'raison_sociale', 'specialite')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations métier', {'fields': ('role', 'telephone', 'raison_sociale', 'specialite')}),
    )


admin.site.register(Utilisateur, UtilisateurAdmin)