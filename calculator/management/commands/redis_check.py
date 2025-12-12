from django.core.management.base import BaseCommand
import redis
import json
import time

class Command(BaseCommand):
    help = 'Найти пользователей в сессиях Redis'
    
    def handle(self, *args, **options):
        try:
            # Подключаемся к Redis
            r = redis.Redis(host='redis', port=6379, db=1, decode_responses=True)
            
            print("Подключение к Redis... ✓")
            
            # Очищаем старые тестовые сессии
            old_keys = r.keys('session:test_*')
            if old_keys:
                r.delete(*old_keys)
            
            # Создаем тестовые сессии с разными форматами
            timestamp = int(time.time())
            test_sessions = [
                (f'session:test_user1_{timestamp}', json.dumps({'username': 'admin', 'email': 'admin@test.com'})),
                (f'session:test_user2_{timestamp}', json.dumps({'username': 'ivan', 'email': 'ivan@test.com'})),
                (f'session:test_user3_{timestamp}', json.dumps({'username': 'maria', 'email': 'maria@test.com'})),
                (f'session:test_admin2_{timestamp}', json.dumps({'username': 'admin', 'email': 'admin@test.com'})),
            ]
            
            print("Создаю тестовые сессии...")
            for key, data in test_sessions:
                r.setex(key, 300, data)  # TTL 5 минут
                print(f"  ✓ {key}")
            
            print("\n" + "=" * 50)
            print("ВЫПОЛНЯЮ LUA-СКРИПТ...")
            print("=" * 50)
            
            # ПРОСТОЙ РАБОЧИЙ Lua-скрипт
            lua_script = """
            -- Получаем все сессии
            local keys = redis.call('KEYS', 'session:test_*')
            local results = {}
            
            for i, key in ipairs(keys) do
                local data = redis.call('GET', key)
                if data then
                    -- Добавляем в результаты ключ и данные
                    table.insert(results, key .. " -> " .. data)
                    
                    -- Пробуем найти username разными способами
                    -- Способ 1: Ищем в JSON
                    local username = string.match(data, '\\"username\\"%s*:%s*\\"([^\\"]+)\\"')
                    if username then
                        table.insert(results, "   Найден пользователь: " .. username)
                    end
                end
            end
            
            return results
            """
            
            # Выполняем Lua-скрипт
            result = r.eval(lua_script, 0)
            
            if result:
                print("\nРЕЗУЛЬТАТЫ LUA-СКРИПТА:")
                print("-" * 40)
                for line in result:
                    print(line)
                print("-" * 40)
            else:
                print("Lua-скрипт не вернул результаты")
            
            # Теперь другой Lua-скрипт для группировки по пользователям
            print("\n" + "=" * 50)
            print("ГРУППИРОВКА ПО ПОЛЬЗОВАТЕЛЯМ:")
            print("=" * 50)
            
            lua_group_script = """
            local keys = redis.call('KEYS', 'session:test_*')
            local users = {}
            
            for i, key in ipairs(keys) do
                local data = redis.call('GET', key)
                if data then
                    -- Ищем username (экранированные кавычки!)
                    local username = string.match(data, '\\\\"username\\\\"%s*:%s*\\\\"([^\\\\"]+)\\\\"')
                    if not username then
                        -- Пробуем без экранирования
                        username = string.match(data, '"username"%s*:%s*"([^"]+)"')
                    end
                    
                    if username then
                        if not users[username] then
                            users[username] = {}
                        end
                        table.insert(users[username], key)
                    end
                end
            end
            
            return users
            """
            
            users = r.eval(lua_group_script, 0)
            
            if users:
                print("\nНАЙДЕННЫЕ ПОЛЬЗОВАТЕЛИ:")
                print("-" * 40)
                for username, sessions in users.items():
                    print(f"\n👤 {username}")
                    print(f"   📊 Сессий: {len(sessions)}")
                    for session in sessions:
                        print(f"   🔑 {session}")
                print("-" * 40)
                print(f"\nВсего пользователей: {len(users)}")
            else:
                print("Пользователи не найдены")
                
        except Exception as e:
            print(f"Ошибка: {e}")
            import traceback
            traceback.print_exc()