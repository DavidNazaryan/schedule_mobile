"""
Система авторизации для админ панели
Поддерживает как логин/пароль, так и Telegram авторизацию
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass

from fastapi import HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from .auth import TelegramUser, UserRole, get_current_user
from .database import db_manager


@dataclass
class AdminCredentials:
    """Учетные данные администратора"""
    username: str
    password_hash: str
    telegram_id: Optional[int] = None
    is_active: bool = True
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class AdminAuthManager:
    """Менеджер авторизации администраторов"""
    
    def __init__(self):
        # Хранилище учетных данных админов (в реальном приложении - в базе данных)
        self.admin_credentials: Dict[str, AdminCredentials] = {
            "admin": AdminCredentials(
                username="admin",
                password_hash=self._hash_password("supersecret"),
                telegram_id=None,
                is_active=True,
                created_at=datetime.now().isoformat()
            ),
            "david": AdminCredentials(
                username="david",
                password_hash=self._hash_password("admin123"),
                telegram_id=123456789,  # Замените на реальный Telegram ID
                is_active=True,
                created_at=datetime.now().isoformat()
            )
        }
        
        # Сессии администраторов
        self.admin_sessions: Dict[str, Dict[str, Any]] = {}
    
    def _hash_password(self, password: str) -> str:
        """Хеширует пароль"""
        salt = "admin_auth_salt"  # В реальном приложении используйте случайную соль
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def verify_password(self, username: str, password: str) -> bool:
        """Проверяет логин и пароль"""
        if username not in self.admin_credentials:
            return False
        
        admin = self.admin_credentials[username]
        if not admin.is_active:
            return False
        
        password_hash = self._hash_password(password)
        return admin.password_hash == password_hash
    
    def create_admin_session(self, username: str, request: Request) -> str:
        """Создает сессию администратора"""
        session_token = secrets.token_urlsafe(32)
        
        # Получаем IP адрес
        ip_address = request.client.host if request.client else "unknown"
        
        self.admin_sessions[session_token] = {
            "username": username,
            "created_at": datetime.now().isoformat(),
            "ip_address": ip_address,
            "user_agent": request.headers.get("user-agent", ""),
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        # Обновляем время последнего входа
        if username in self.admin_credentials:
            self.admin_credentials[username].last_login = datetime.now().isoformat()
        
        return session_token
    
    def verify_admin_session(self, session_token: str) -> Optional[str]:
        """Проверяет сессию администратора"""
        if session_token not in self.admin_sessions:
            return None
        
        session = self.admin_sessions[session_token]
        
        # Проверяем срок действия
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.now() > expires_at:
            del self.admin_sessions[session_token]
            return None
        
        return session["username"]
    
    def revoke_admin_session(self, session_token: str) -> bool:
        """Отзывает сессию администратора"""
        if session_token in self.admin_sessions:
            del self.admin_sessions[session_token]
            return True
        return False
    
    def is_telegram_admin(self, telegram_user: TelegramUser) -> bool:
        """Проверяет, является ли Telegram пользователь администратором"""
        # Проверяем по Telegram ID
        for admin in self.admin_credentials.values():
            if admin.telegram_id == telegram_user.id:
                return True
        
        # Проверяем по роли в системе
        return telegram_user.role == UserRole.ADMIN
    
    def get_admin_info(self, username: str) -> Optional[AdminCredentials]:
        """Получает информацию об администраторе"""
        return self.admin_credentials.get(username)
    
    def add_admin(self, username: str, password: str, telegram_id: Optional[int] = None) -> bool:
        """Добавляет нового администратора"""
        if username in self.admin_credentials:
            return False
        
        self.admin_credentials[username] = AdminCredentials(
            username=username,
            password_hash=self._hash_password(password),
            telegram_id=telegram_id,
            is_active=True,
            created_at=datetime.now().isoformat()
        )
        return True
    
    def update_admin_password(self, username: str, new_password: str) -> bool:
        """Обновляет пароль администратора"""
        if username not in self.admin_credentials:
            return False
        
        self.admin_credentials[username].password_hash = self._hash_password(new_password)
        return True
    
    def deactivate_admin(self, username: str) -> bool:
        """Деактивирует администратора"""
        if username not in self.admin_credentials:
            return False
        
        self.admin_credentials[username].is_active = False
        return True


# Глобальный экземпляр менеджера авторизации админов
admin_auth_manager = AdminAuthManager()


async def require_admin_auth(request: Request) -> str:
    """Требует авторизацию администратора (только логин/пароль)"""
    
    # Проверяем сессию администратора
    admin_session = request.cookies.get("admin_session")
    if admin_session:
        username = admin_auth_manager.verify_admin_session(admin_session)
        if username:
            return username
    
    # Если нет сессии, выбрасываем исключение
    raise HTTPException(
        status_code=401,
        detail="Требуется авторизация администратора",
        headers={"WWW-Authenticate": "Basic"}
    )


async def get_admin_user(request: Request) -> Optional[TelegramUser]:
    """Получает пользователя-администратора (только через логин/пароль)"""
    try:
        admin_identifier = await require_admin_auth(request)
        
        # Создаем виртуального пользователя-админа
        return TelegramUser(
            id=999999999,  # Специальный ID для админов по логину/паролю
            first_name="Администратор",
            last_name="Системы",
            username=admin_identifier,
            role=UserRole.ADMIN,
            group_id=None,
            status="active",
            created_at=datetime.now().isoformat(),
            last_seen=datetime.now().isoformat()
        )
        
    except HTTPException:
        return None


def set_admin_session_cookie(response: Response, session_token: str, secure: bool = False):
    """Устанавливает cookie с сессией администратора"""
    response.set_cookie(
        "admin_session",
        session_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=86400  # 24 часа
    )


def clear_admin_session_cookie(response: Response):
    """Удаляет cookie с сессией администратора"""
    response.delete_cookie("admin_session")

