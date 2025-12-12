"""
Модели для калькулятора радиоактивных изотопов
"""

from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """Кастомная модель пользователя для системы расчета изотопов"""
    email = models.EmailField("email адрес", unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.email


class Isotope(models.Model):
    """Модель радиоактивного изотопа"""
    name = models.CharField(max_length=200, verbose_name="Название изотопа")
    description = models.TextField(verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    image_url = models.URLField(blank=True, null=True, verbose_name="URL изображения")
    
    half_life = models.FloatField(verbose_name="Период полураспада (лет)")
    atomic_mass = models.FloatField(verbose_name="Атомная масса")
    decay_type = models.CharField(max_length=100, verbose_name="Тип распада")
    application = models.TextField(verbose_name="Применение")
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Изотоп"
        verbose_name_plural = "Изотопы"


class IsotopeCalculationOrder(models.Model):
    """Модель заявки на расчет изотопов"""
    
    class OrderStatus(models.TextChoices):
        DRAFT = "DRAFT", "Черновик"
        DELETED = "DELETED", "Удалён"
        FORMED = "FORMED", "Сформирован"
        COMPLETED = "COMPLETED", "Завершён"
        REJECTED = "REJECTED", "Отклонён"
    
    status = models.CharField(
        max_length=10, 
        choices=OrderStatus.choices, 
        default=OrderStatus.DRAFT,
        verbose_name="Статус заявки"
    )
    
    creation_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    formation_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата формирования")
    completion_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата завершения")
    
    client = models.ForeignKey(CustomUser, on_delete=models.DO_NOTHING, related_name='isotope_orders', verbose_name="Клиент")
    moderator = models.ForeignKey(CustomUser, on_delete=models.DO_NOTHING, null=True, blank=True, related_name='moderated_isotope_orders', verbose_name="Модератор")
    
    time_elapsed = models.FloatField(default=0, verbose_name="Прошедшее время (лет)")
    total_activity = models.FloatField(null=True, blank=True, verbose_name="Суммарная активность")
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'status'],
                condition=models.Q(status='DRAFT'),
                name='unique_draft_per_client_isotope'  # ИЗМЕНИЛ ИМЯ ОГРАНИЧЕНИЯ
            )
        ]
        verbose_name = "Заявка на расчет изотопов"
        verbose_name_plural = "Заявки на расчет изотопов"
    
    def __str__(self):
        return f"Заявка на расчет изотопов № {self.id}"


class IsotopeCalculationItem(models.Model):
    """Модель элемента расчета (изотоп в заявке)"""
    isotope_order = models.ForeignKey(IsotopeCalculationOrder, on_delete=models.CASCADE, related_name='isotope_items', verbose_name="Заявка на расчет изотопов")
    isotope = models.ForeignKey(Isotope, on_delete=models.CASCADE, verbose_name="Изотоп")
    initial_amount = models.FloatField(default=1.0, verbose_name="Начальная масса (г)")
    remaining_activity = models.FloatField(null=True, blank=True, verbose_name="Остаточная активность (Бк)")
    
    class Meta:
        unique_together = ['isotope_order', 'isotope']
        verbose_name = "Элемент расчета изотопов"
        verbose_name_plural = "Элементы расчета изотопов"
    
    def __str__(self):
        return f"{self.isotope.name} в заявке {self.isotope_order.id}"