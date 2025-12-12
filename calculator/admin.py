from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Isotope, IsotopeCalculationOrder, IsotopeCalculationItem, CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['email']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

@admin.register(Isotope)
class IsotopeAdmin(admin.ModelAdmin):
    list_display = ['name', 'half_life', 'atomic_mass', 'decay_type', 'is_active']
    list_filter = ['is_active', 'decay_type']
    search_fields = ['name', 'description']
    list_editable = ['is_active']

@admin.register(IsotopeCalculationOrder)
class IsotopeCalculationOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'status', 'creation_date', 'time_elapsed']
    list_filter = ['status', 'creation_date']
    search_fields = ['client__email', 'client__username']
    readonly_fields = ['creation_date']

@admin.register(IsotopeCalculationItem)
class IsotopeCalculationItemAdmin(admin.ModelAdmin):
    # Обновили calculation -> isotope_order
    list_display = ['isotope_order', 'isotope', 'initial_amount', 'remaining_activity']
    list_filter = ['isotope_order__status']
    search_fields = ['isotope__name']