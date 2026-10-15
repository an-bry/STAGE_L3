# accounts/permissions.py
from rest_framework.permissions import BasePermission


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CLIENT'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsTechnicien(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'TECHNICIEN'