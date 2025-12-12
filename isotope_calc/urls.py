from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.authtoken.views import obtain_auth_token

from calculator import views
from calculator.api_views import IsotopeViewSet, IsotopeCalculationOrderViewSet, IsotopeCalculationItemViewSet, UserViewSet, login_view, logout_view

# Создаем router для API
router = DefaultRouter()
router.register(r'isotopes', IsotopeViewSet)
router.register(r'isotope-orders', IsotopeCalculationOrderViewSet)
router.register(r'isotope-order-items', IsotopeCalculationItemViewSet)
router.register(r'users', UserViewSet, basename='user')

# Swagger схема
schema_view = get_schema_view(
   openapi.Info(
      title="Isotope Calculator API",
      default_version='v1',
      description="API для расчета периода полураспада радиоактивных изотопов",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="admin@isotope.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # ----------------------------------------------------
    # --- 1. ВЕБ-МАРШРУТЫ (Web Routes) ---
    # ----------------------------------------------------
    
    # Главная страница / Список изотопов
    path('', views.isotopes_list, name='isotopes_list'),
    
    # Детали изотопа
    path('isotopes/<int:isotope_id>/', views.isotope_detail, name='isotope_detail'),
    
    # Добавление изотопа в расчет (заявку на расчет)
    path('calculation/add/<int:isotope_id>/', views.add_to_isotope_calculation, name='add_to_isotope_calculation'),
    
    # Удаление изотопа из расчета (заявки на расчет)
    path('calculation/remove/<int:item_id>/', views.delete_isotope_calculation_item, name='delete_isotope_calculation_item'),
    
    # Просмотр страницы расчета (заявки на расчет)
    path('calculation/<int:calculation_id>/', views.isotope_calculation_detail, name='isotope_calculation_detail'),
    
    # Обработка параметров расчета (кнопка "Рассчитать")
    path('calculation/<int:calculation_id>/process/', views.process_calculation, name='process_calculation'),
    
    # Удаление заявки на расчет
    path('calculation/<int:calculation_id>/delete/', views.delete_isotope_calculation, name='delete_isotope_calculation'),
    
    # ----------------------------------------------------
    # --- 2. СЛУЖЕБНЫЕ МАРШРУТЫ (Admin, Swagger, API) ---
    # ----------------------------------------------------
    
    path('admin/', admin.site.urls),
    
    # DRF аутентификация (ОБЯЗАТЕЛЬНО для Swagger!)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    
    # Swagger URLs
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Аутентификация
    path('api/auth/login/', login_view, name='api_login'),
    path('api/auth/logout/', logout_view, name='api_logout'),
    path('api/token/', obtain_auth_token, name='api_token'),
    
    # API URLs
    path('api/', include(router.urls)),
]