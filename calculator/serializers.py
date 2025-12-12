from rest_framework import serializers
from .models import Isotope, IsotopeCalculationOrder, IsotopeCalculationItem, CustomUser
from django.contrib.auth.password_validation import validate_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class IsotopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Isotope
        fields = ['id', 'name', 'description', 'half_life', 'atomic_mass', 'decay_type', 'application', 'image_url', 'is_active']

class IsotopeCalculationItemSerializer(serializers.ModelSerializer):
    isotope = IsotopeSerializer(read_only=True)
    
    class Meta:
        model = IsotopeCalculationItem
        fields = '__all__'

class IsotopeCalculationOrderSerializer(serializers.ModelSerializer):
    # Обновили имя поля: isotope_items вместо calculation_items
    isotope_items = IsotopeCalculationItemSerializer(many=True, read_only=True)
    client = UserSerializer(read_only=True)
    moderator = UserSerializer(read_only=True)
    
    class Meta:
        model = IsotopeCalculationOrder
        fields = '__all__'