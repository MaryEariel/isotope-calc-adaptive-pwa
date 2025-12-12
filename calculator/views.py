"""
Веб-представления для калькулятора изотопов
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.db import transaction, connection
from django.http import HttpResponse, Http404
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import Isotope, IsotopeCalculationOrder, IsotopeCalculationItem
from django.contrib.auth import get_user_model

CustomUser = get_user_model()


def calculate_remaining_activity(isotope, initial_amount, time_elapsed):
    """Расчет остаточной активности по формуле: A = A0 * (1/2)^(t/T)"""
    half_life = isotope.half_life
    remaining_activity = initial_amount * (0.5) ** (time_elapsed / half_life)
    return remaining_activity


def get_user_isotope_calculation_data(user):
    """Получение данных о заявке пользователя на расчет изотопов"""
    if not user or not user.is_authenticated:
        return None, 0, None
    
    draft_order = IsotopeCalculationOrder.objects.filter(
        client=user, 
        status=IsotopeCalculationOrder.OrderStatus.DRAFT
    ).first()
    
    if draft_order:
        items_count = draft_order.isotope_items.count()
        calculation_id = draft_order.id
        return draft_order, items_count, calculation_id
    
    return None, 0, None


def isotopes_list(request):
    """Главная страница со списком активных изотопов"""
    isotope_search_query = request.GET.get('isotope_search', '')  # ИЗМЕНИЛ 'search' -> 'isotope_search'
    isotopes = Isotope.objects.filter(is_active=True).order_by('name')
    
    if isotope_search_query:  # ИЗМЕНИЛ переменную
        isotopes = isotopes.filter(name__icontains=isotope_search_query)
    
    current_calculation, items_count, current_calculation_id = get_user_isotope_calculation_data(request.user)

    context = {
        'isotopes': isotopes,
        'isotope_search_query': isotope_search_query,  # ИЗМЕНИЛ ключ
        'isotopes_in_calculations_count': items_count,
        'current_calculation_id': current_calculation_id,
        'user': request.user,
    }
    return render(request, 'services.html', context)


def isotope_detail(request, isotope_id):
    """Страница деталей изотопа"""
    isotope = get_object_or_404(Isotope, id=isotope_id)
    return render(request, 'service_detail.html', {'isotope': isotope})


@login_required
def add_to_isotope_calculation(request, isotope_id):
    """Добавление изотопа в заявку на расчет пользователя"""
    if request.method == 'POST':
        isotope = get_object_or_404(Isotope, id=isotope_id, is_active=True)
        user = request.user
        
        with transaction.atomic():
            draft_order, _, _ = get_user_isotope_calculation_data(user)
            
            if not draft_order:
                draft_order = IsotopeCalculationOrder.objects.create(
                    client=user, 
                    status=IsotopeCalculationOrder.OrderStatus.DRAFT
                )

            item, created = IsotopeCalculationItem.objects.get_or_create(
                isotope_order=draft_order,
                isotope=isotope,
                defaults={'initial_amount': 1.0}
            )
            
            if not created:
                messages.warning(request, f"Изотоп {isotope.name} уже есть в вашей заявке на расчет.")
            else:
                messages.success(request, f"Изотоп {isotope.name} добавлен в заявку на расчет.")
        
        return redirect('isotopes_list')

    return redirect('isotopes_list')


@login_required
def isotope_calculation_detail(request, calculation_id):
    """Детали и расчет заявки пользователя на расчет изотопов"""
    calculation = get_object_or_404(IsotopeCalculationOrder, id=calculation_id, client=request.user)

    if request.method == 'POST':
        time_elapsed_str = request.POST.get('time_elapsed', '0')
        initial_amounts = request.POST.getlist('initial_amount')
        item_ids = request.POST.getlist('item_id')
        
        try:
            time_elapsed = float(time_elapsed_str)
            if time_elapsed < 0:
                raise ValueError("Время не может быть отрицательным.")
        except ValueError:
            messages.error(request, "Некорректное значение для времени.")
            return redirect('isotope_calculation_detail', calculation_id=calculation_id)

        calculation.time_elapsed = time_elapsed
        calculation.total_activity = 0
        
        calculation_items = calculation.isotope_items.all()
        
        # Обновление начальной массы и расчет активности
        with transaction.atomic():
            for item_id_str, initial_amount_str in zip(item_ids, initial_amounts):
                try:
                    item_id = int(item_id_str)
                    initial_amount = float(initial_amount_str)
                    if initial_amount <= 0:
                        raise ValueError("Начальная масса должна быть положительной.")
                except ValueError:
                    messages.error(request, "Некорректное значение начальной массы.")
                    return redirect('isotope_calculation_detail', calculation_id=calculation_id)
                
                item = get_object_or_404(IsotopeCalculationItem, id=item_id, isotope_order=calculation)
                item.initial_amount = initial_amount
                
                # Расчет
                item.remaining_activity = calculate_remaining_activity(
                    item.isotope, 
                    item.initial_amount, 
                    calculation.time_elapsed
                )
                
                item.save()
                
            # Пересчет общей активности
            total_activity = sum(
                item.remaining_activity 
                for item in calculation_items 
                if item.remaining_activity is not None
            )
            calculation.total_activity = total_activity
            calculation.save()

            messages.success(request, "Расчет активности изотопов выполнен успешно.")
        
        return redirect('isotope_calculation_detail', calculation_id=calculation_id)
    
    # GET запрос
    calculation_items = calculation.isotope_items.select_related('isotope').all()
    total_activity = None
    
    for item in calculation_items:
        if item.remaining_activity is not None:
            if total_activity is None:
                total_activity = 0
            total_activity += item.remaining_activity
    
    current_calculation, items_count, current_calculation_id = get_user_isotope_calculation_data(request.user)
    
    context = {
        'calculation': calculation,
        'isotope_items': calculation_items,
        'total_activity': total_activity,
        'isotopes_in_calculations_count': items_count,
        'current_calculation_id': current_calculation_id,
        'user': request.user,
    }
    return render(request, 'order.html', context)


@login_required
def delete_isotope_calculation(request, calculation_id):
    """Логическое удаление заявки на расчет изотопов через SQL UPDATE"""
    if request.method == 'POST':
        calculation = get_object_or_404(IsotopeCalculationOrder, id=calculation_id, client=request.user)
        
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE calculator_isotopecalculationorder SET status = 'DELETED' WHERE id = %s AND client_id = %s",
                [calculation_id, request.user.id]
            )
        
        messages.success(request, "Заявка на расчет изотопов успешно удалена")
        return redirect('isotopes_list')
    
    return redirect('isotope_calculation_detail', calculation_id=calculation_id)


@login_required
def delete_isotope_calculation_item(request, item_id):
    """Удаление изотопа из заявки на расчет"""
    if request.method == 'POST':
        item = get_object_or_404(IsotopeCalculationItem, id=item_id, isotope_order__client=request.user)
        calculation_id = item.isotope_order.id
        item.delete()
        messages.success(request, "Изотоп удален из заявки на расчет.")
        return redirect('isotope_calculation_detail', calculation_id=calculation_id)
        
    return redirect('isotopes_list')


@login_required
def process_calculation(request, calculation_id):
    """Обработка параметров расчета (кнопка 'Рассчитать') - устаревший метод, теперь объединен в isotope_calculation_detail"""
    return redirect('isotope_calculation_detail', calculation_id=calculation_id)