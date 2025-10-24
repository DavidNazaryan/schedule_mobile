"""
Улучшенная система аутентификации и авторизации для Telegram Mini App
"""

import hashlib
import hmac
import json
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
from dataclasses import dataclass
from enum import Enum

from fastapi import HTTPException, Request, Depends
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64

from .auth import TelegramUser, UserRole, TelegramAuth
from .roles import Permission, role_manager
from .roles import UserRole as RolesUserRole
from .database import db_manager


class AuthStatus(Enum):
    """Статусы аутентификации"""
    SUCCESS = "success"
    FAILED = "failed"
    EXPIRED = "expired"
    INVALID_DATA = "invalid_data"
    USER_NOT_FOUND = "user_not_found"


@dataclass
class AuthResult:
    """Результат аутентификации"""
    status: AuthStatus
    user: Optional[TelegramUser] = None
    message: str = ""
    session_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class EnhancedTelegramAuth(TelegramAuth):
    """Улучшенная аутентификация для Telegram Mini App"""
    
    def __init__(self, bot_token: str):
        super().__init__(bot_token)
        self.session_timeout = timedelta(hours=24)  # Сессии действуют 24 часа
    
    def authenticate_user(self, init_data: str, ip_address: Optional[str] = None) -> AuthResult:
        """Аутентифицирует пользователя через Telegram WebApp"""
        try:
            # Проверяем данные Telegram
            user = self.verify_telegram_data(init_data)
            if not user:
                return AuthResult(
                    status=AuthStatus.INVALID_DATA,
                    message="Не удалось проверить данные от Telegram"
                )
            
            # Проверяем, существует ли пользователь в системе
            existing_user = db_manager.get_user(user.id)
            print(f"[ENHANCED AUTH DEBUG] User ID: {user.id}")
            print(f"[ENHANCED AUTH DEBUG] Existing user found: {existing_user is not None}")
            if existing_user:
                print(f"[ENHANCED AUTH DEBUG] Existing user role: {existing_user.role}")
                print(f"[ENHANCED AUTH DEBUG] Existing user group: {existing_user.group_id}")
            if existing_user:
                # Обновляем информацию о пользователе
                existing_user.first_name = user.first_name
                existing_user.last_name = user.last_name
                existing_user.username = user.username
                existing_user.photo_url = user.photo_url
                existing_user.language_code = getattr(user, 'language_code', None)
                
                # Обновляем last_seen
                db_manager.update_last_seen(user.id)
                
                # Логируем вход
                db_manager.log_audit(
                    user.id, 
                    "user_login", 
                    "auth", 
                    f"User logged in from {ip_address or 'unknown IP'}",
                    ip_address
                )
                
                return AuthResult(
                    status=AuthStatus.SUCCESS,
                    user=existing_user,
                    message="Успешная аутентификация",
                    session_token=self._generate_session_token(existing_user),
                    expires_at=datetime.now() + self.session_timeout
                )
            else:
                # Новый пользователь - создаем запись
                user.status = "active"
                user.created_at = datetime.now().isoformat()
                user.last_seen = datetime.now().isoformat()
                
                # Сохраняем в базу данных
                db_manager.add_user(user)
                
                # Логируем регистрацию
                db_manager.log_audit(
                    user.id,
                    "user_registered",
                    "auth",
                    f"New user registered from {ip_address or 'unknown IP'}",
                    ip_address
                )
                
                return AuthResult(
                    status=AuthStatus.SUCCESS,
                    user=user,
                    message="Новый пользователь зарегистрирован",
                    session_token=self._generate_session_token(user),
                    expires_at=datetime.now() + self.session_timeout
                )
                
        except Exception as e:
            return AuthResult(
                status=AuthStatus.FAILED,
                message=f"Ошибка аутентификации: {str(e)}"
            )
    
    def _generate_session_token(self, user: TelegramUser) -> str:
        """Генерирует токен сессии"""
        session_data = {
            "user_id": user.id,
            "role": user.role.value,
            "group_id": user.group_id,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + self.session_timeout).isoformat()
        }
        
        # Шифруем данные сессии
        session_json = json.dumps(session_data)
        iv = b'\x00' * 16
        cipher = Cipher(algorithms.AES(self.secret_key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        # Дополняем данные
        padding_length = 16 - (len(session_json) % 16)
        padded_data = session_json.encode() + bytes([padding_length] * padding_length)
        
        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        return base64.b64encode(encrypted_data).decode()
    
    def verify_session_token(self, token: str) -> Optional[TelegramUser]:
        """Проверяет токен сессии и возвращает пользователя"""
        try:
            # Расшифровываем токен
            encrypted_data = base64.b64decode(token)
            iv = b'\x00' * 16
            cipher = Cipher(algorithms.AES(self.secret_key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
            
            # Убираем дополнение
            padding_length = decrypted_data[-1]
            session_json = decrypted_data[:-padding_length].decode()
            
            session_data = json.loads(session_json)
            
            # Проверяем срок действия
            expires_at = datetime.fromisoformat(session_data['expires_at'])
            if datetime.now() > expires_at:
                return None
            
            # Получаем пользователя из базы данных
            user = db_manager.get_user(session_data['user_id'])
            if not user:
                return None
            
            # Проверяем, что данные не изменились
            if (user.role.value != session_data['role'] or 
                user.group_id != session_data.get('group_id')):
                return None
            
            return user
            
        except Exception:
            return None


class AuthorizationManager:
    """Менеджер авторизации"""
    
    def __init__(self):
        self.auth = EnhancedTelegramAuth("8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA")
    
    @staticmethod
    def _normalize_role(role: Any) -> RolesUserRole:
        """Приводит роль пользователя к перечислению из roles.py."""
        if isinstance(role, RolesUserRole):
            return role
        if hasattr(role, "value"):
            value = role.value
        else:
            value = role
        if isinstance(value, RolesUserRole):
            return value
        if isinstance(value, str):
            return RolesUserRole(value)
        raise ValueError(f"Неизвестное значение роли: {role}")

    def check_permission(self, user: TelegramUser, permission: Permission) -> bool:
        """Проверяет разрешение пользователя"""
        from .roles import check_permission
        role = self._normalize_role(user.role)
        return check_permission(role, permission)
    
    def check_group_access(self, user: TelegramUser, group_id: str, action: str) -> bool:
        """Проверяет доступ к группе"""
        role = self._normalize_role(user.role)
        if action == "view":
            from .roles import can_user_view_group_schedule
            return can_user_view_group_schedule(role, group_id, user.group_id)
        elif action == "edit":
            from .roles import can_user_edit_group_schedule
            return can_user_edit_group_schedule(role, group_id, user.group_id)
        elif action == "manage":
            from .roles import can_user_manage_group
            return can_user_manage_group(role, group_id, user.group_id)
        return False
    
    def get_user_permissions(self, user: TelegramUser) -> Dict[str, bool]:
        """Получает все разрешения пользователя"""
        from .roles import get_user_permissions
        role = self._normalize_role(user.role)
        return get_user_permissions(role)
    
    def can_promote_user(self, current_user: TelegramUser, target_user: TelegramUser, new_role: UserRole) -> bool:
        """Проверяет, может ли пользователь назначить роль другому пользователю"""
        from .roles import can_promote_to_role
        role = self._normalize_role(current_user.role)
        target_role = new_role
        if not isinstance(target_role, RolesUserRole):
            target_role = RolesUserRole(target_role.value if hasattr(target_role, "value") else target_role)
        return can_promote_to_role(role, target_role)
    
    def get_available_roles_for_promotion(self, current_user: TelegramUser) -> List[UserRole]:
        """Получает роли, которые может назначить пользователь"""
        from .roles import get_available_roles_for_promotion
        role = self._normalize_role(current_user.role)
        return get_available_roles_for_promotion(role)


# Глобальные экземпляры
enhanced_auth = EnhancedTelegramAuth("8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA")
auth_manager = AuthorizationManager()


async def get_current_user_enhanced(request: Request) -> Optional[TelegramUser]:
    """Получает текущего пользователя с улучшенной аутентификацией"""
    # Проверяем заголовки от Telegram WebApp
    init_data = request.headers.get('X-Telegram-Init-Data')
    if init_data:
        ip_address = request.client.host if request.client else None
        auth_result = enhanced_auth.authenticate_user(init_data, ip_address)
        
        if auth_result.status == AuthStatus.SUCCESS:
            return auth_result.user
    
    # Проверяем данные из формы
    try:
        form_data = await request.form()
        if 'init_data' in form_data:
            ip_address = request.client.host if request.client else None
            auth_result = enhanced_auth.authenticate_user(form_data['init_data'], ip_address)
            
            if auth_result.status == AuthStatus.SUCCESS:
                return auth_result.user
    except Exception:
        pass
    
    # Проверяем токен сессии в заголовках
    session_token = request.headers.get('X-Session-Token')
    if session_token:
        user = enhanced_auth.verify_session_token(session_token)
        if user:
            # Обновляем last_seen
            db_manager.update_last_seen(user.id)
            return user
    
    return None


async def require_auth_enhanced(request: Request) -> TelegramUser:
    """Требует аутентификации с улучшенной системой"""
    user = await get_current_user_enhanced(request)
    if not user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация через Telegram")
    return user


async def require_permission(permission: Permission):
    """Декоратор для проверки разрешений"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Получаем пользователя из аргументов
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                raise HTTPException(status_code=401, detail="Не удалось получить запрос")
            
            user = await require_auth_enhanced(request)
            if not auth_manager.check_permission(user, permission):
                raise HTTPException(
                    status_code=403, 
                    detail=f"Недостаточно прав. Требуется разрешение: {permission.value}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def require_role_enhanced(required_role: UserRole):
    """Требует определенную роль с улучшенной проверкой"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                raise HTTPException(status_code=401, detail="Не удалось получить запрос")
            
            user = await require_auth_enhanced(request)
            if user.role != required_role:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Требуется роль: {role_manager.get_role_display_name(required_role)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def get_user_session_info(user: TelegramUser) -> Dict[str, Any]:
    """Получает информацию о сессии пользователя"""
    permissions = auth_manager.get_user_permissions(user)
    available_roles = auth_manager.get_available_roles_for_promotion(user)
    
    return {
        "user_id": user.id,
        "role": user.role.value,
        "role_display": role_manager.get_role_display_name(user.role),
        "group_id": user.group_id,
        "permissions": permissions,
        "available_roles_for_promotion": [role.value for role in available_roles],
        "session_timeout": enhanced_auth.session_timeout.total_seconds(),
        "last_seen": getattr(user, 'last_seen', None)
    }
