from rest_framework import permissions

class IsModerator(permissions.BasePermission):
    """Разрешение для модераторов"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class IsOwnerOrModerator(permissions.BasePermission):
    """Разрешение для владельца или модератора"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Если проверяем саму заявку
        if hasattr(obj, 'client'):
            return obj.client == request.user
        # Если проверяем элемент заявки (изотоп)
        # БЫЛО: obj.calculation, СТАЛО: obj.isotope_order
        if hasattr(obj, 'isotope_order') and hasattr(obj.isotope_order, 'client'):
            return obj.isotope_order.client == request.user
        return False

class IsAuthenticatedOrReadOnlyForNonStaff(permissions.BasePermission):
    """Для не-модераторов: чтение доступно всем, запись только аутентифицированным"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated