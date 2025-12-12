# fix_minio_docker.py
from minio import Minio

def fix_minio_access():
    # Используем имя сервиса minio вместо localhost
    client = Minio(
        "minio:9000",  # ← ИЗМЕНИЛИ ЗДЕСЬ
        access_key="minioadmin",
        secret_key="minioadmin",
        secure=False
    )
    
    bucket_name = "isotopes"
    
    try:
        # Проверяем существует ли bucket
        if not client.bucket_exists(bucket_name):
            print("❌ Bucket 'isotopes' не существует!")
            print("Создайте bucket через MinIO Console: http://localhost:9001")
            return
        
        # Устанавливаем политику публичного доступа
        policy = """
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::isotopes/*"]
                }
            ]
        }
        """
        
        client.set_bucket_policy(bucket_name, policy)
        print("✅ Публичный доступ настроен для bucket 'isotopes'")
        
        # Проверяем что работает
        print("✅ Проверьте доступ: http://localhost:9000/isotopes/carbon-14.jpg")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print("📋 Решение: Настройте доступ через MinIO Console: http://localhost:9001")

if __name__ == "__main__":
    fix_minio_access()