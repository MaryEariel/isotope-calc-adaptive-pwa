from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, permission_classes, api_view, authentication_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
# Импортируем новые названия моделей
from .models import Isotope, IsotopeCalculationOrder, IsotopeCalculationItem, CustomUser
# Импортируем новые названия сериализаторов
from .serializers import IsotopeSerializer, IsotopeCalculationOrderSerializer, IsotopeCalculationItemSerializer, UserSerializer
from .permissions import IsModerator, IsOwnerOrModerator
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django_filters import rest_framework as filters

class IsotopeFilter(filters.FilterSet):
    half_life_min = filters.NumberFilter(field_name='half_life', lookup_expr='gte')
    half_life_max = filters.NumberFilter(field_name='half_life', lookup_expr='lte')
    atomic_mass_min = filters.NumberFilter(field_name='atomic_mass', lookup_expr='gte')
    atomic_mass_max = filters.NumberFilter(field_name='atomic_mass', lookup_expr='lte')
    
    class Meta:
        model = Isotope
        fields = ['decay_type', 'is_active']

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['email', 'password'],
        properties={
            'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email пользователя'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Пароль'),
        }
    ),
    responses={
        200: openapi.Response('Успешная аутентификация', UserSerializer),
        401: 'Неверные учетные данные'
    }
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """POST аутентификация пользователя"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    user = authenticate(request, username=email, password=password)
    if user is not None:
        login(request, user)
        
        return Response({
            "message": "Успешная аутентификация",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff
            }
        })
    else:
        return Response(
            {"error": "Неверные учетные данные"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """POST деавторизация пользователя"""
    logout(request)
    return Response({"message": "Успешный выход из системы"})

class IsotopeViewSet(viewsets.ModelViewSet):
    queryset = Isotope.objects.filter(is_active=True)
    serializer_class = IsotopeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = IsotopeFilter
    search_fields = ['name', 'application']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsModerator]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

class IsotopeCalculationOrderViewSet(viewsets.ModelViewSet):
    """ViewSet для заявок на расчет изотопов"""
    queryset = IsotopeCalculationOrder.objects.all()
    serializer_class = IsotopeCalculationOrderSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'complete']:
            permission_classes = [IsModerator]
        elif self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset().exclude(status='DELETED')
        if not self.request.user.is_staff:
            queryset = queryset.filter(client=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
    
    @swagger_auto_schema(
        operation_description="Завершение заявки модератором",
        responses={
            200: IsotopeCalculationOrderSerializer,
            403: 'Нет прав для завершения заявки'
        }
    )
    @action(detail=True, methods=['put'], permission_classes=[IsModerator])
    def complete(self, request, pk=None):
        """Завершение заявки модератором"""
        order = self.get_object()
        order.status = IsotopeCalculationOrder.OrderStatus.COMPLETED
        order.completion_date = timezone.now()
        order.moderator = request.user
        order.save()
        
        return Response({
            "message": "Заявка завершена",
            "order": IsotopeCalculationOrderSerializer(order).data
        })
    
    @swagger_auto_schema(
        operation_description="Получение заявок текущего пользователя",
        responses={200: IsotopeCalculationOrderSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        if request.user.is_staff:
            orders = IsotopeCalculationOrder.objects.exclude(status='DELETED')
        else:
            orders = IsotopeCalculationOrder.objects.filter(client=request.user).exclude(status='DELETED')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

class IsotopeCalculationItemViewSet(viewsets.ModelViewSet):
    """ViewSet для элементов расчета (изотопов в заявке)"""
    queryset = IsotopeCalculationItem.objects.all()
    serializer_class = IsotopeCalculationItemSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrModerator]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            # БЫЛО: calculation__client, СТАЛО: isotope_order__client
            queryset = queryset.filter(isotope_order__client=self.request.user)
        return queryset

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_description="Регистрация нового пользователя",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['username', 'email', 'password'],
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING),
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            200: 'Пользователь успешно зарегистрирован',
            400: 'Ошибка валидации'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """POST регистрация нового пользователя"""
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        
        if not username or not password or not email:
            return Response(
                {"error": "Username, email и password обязательны"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if CustomUser.objects.filter(username=username).exists():
            return Response(
                {"error": "Пользователь с таким username уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "Пользователь с таким email уже существует"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        return Response({
            "message": "Пользователь успешно зарегистрирован",
            "user": UserSerializer(user).data
        })
    
    @swagger_auto_schema(
        operation_description="Получение информации о текущем пользователе",
        responses={200: UserSerializer}
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """GET полей пользователя"""
        return Response(UserSerializer(request.user).data)