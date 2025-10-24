from __future__ import annotations

ADMIN_CREDENTIALS = {
    "admin_token": "__token__",  # значение для key=...
    "admin_login": "admin",
    "admin_password": "supersecret"
}

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, Request, Form, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from .enhanced_auth import (
    enhanced_auth, auth_manager, get_current_user_enhanced, 
    require_auth_enhanced, require_permission, get_user_session_info, AuthStatus
)
from .auth import TelegramUser, UserRole, get_current_user, can_view_schedule, can_edit_schedule, can_manage_all_groups, get_user_permissions_dict
from .user_management import user_manager
from .authorization import bot_auth
from .roles import Permission, role_manager, check_permission
from .database import db_manager
from .notification_manager import (
    NotificationManager, Notification, NotificationSettings, 
    init_notification_manager, get_notification_manager
)
from .admin_auth import require_admin_auth, get_admin_user, admin_auth_manager, set_admin_session_cookie, clear_admin_session_cookie
from .elder_groups_api import elder_groups_router

from parser.spa_client import OptionItem, SpaScheduleClient
from .models import (
    UserProfileResponse, GroupInfoResponse, UserListResponse, GroupListResponse,
    UserStatsResponse, PermissionCheckResponse, RoleUpdateResponse,
    GroupJoinRequest, GroupJoinResponse, AuditLogResponse, AuditLogListResponse,
    SystemInfoResponse, NotificationType, NotificationSettingsRequest, 
    NotificationSettingsResponse, NotificationHistoryResponse,
    NotificationHistoryListResponse, SendNotificationRequest, SendNotificationResponse
)

CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "cache.json"
CACHE_MAX_AGE_SECONDS = 300

# Константы для Telegram Bot
TELEGRAM_BOT_TOKEN = "8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA"

# Инициализация менеджера базы данных
from .database import DatabaseManager
db_manager = DatabaseManager()

# Инициализация менеджера уведомлений
notification_manager = init_notification_manager(db_manager, TELEGRAM_BOT_TOKEN)

app = FastAPI(title="MSU Schedule Proxy")

# Настройка статических файлов
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(elder_groups_router)

# News API removed - now using client-side parsing in mobile app

templates = Jinja2Templates(directory="app/templates")

_cache_payload: Optional[Dict[str, Any]] = None
_cache_loaded_at: Optional[datetime] = None


async def require_admin_user(request: Request) -> TelegramUser:
    """Возвращает пользователя-администратора (только логин/пароль)."""
    # Проверяем админскую сессию (логин/пароль)
    admin_user = await get_admin_user(request)
    if admin_user:
        return admin_user

    raise HTTPException(status_code=401, detail="Требуется авторизация администратора")


@app.post("/admin/login", response_class=HTMLResponse)
async def admin_panel_login(request: Request) -> HTMLResponse:
    """Обработка логина по логину/паролю с улучшенной авторизацией."""

    form = await request.form()
    username = (form.get("username") or "").strip()
    password = form.get("password") or ""
    error = None

    # Проверяем учетные данные через новую систему авторизации
    if admin_auth_manager.verify_password(username, password):
        # Создаем сессию администратора
        session_token = admin_auth_manager.create_admin_session(username, request)
        
        response = templates.TemplateResponse("admin.html", {"request": request})
        set_admin_session_cookie(
            response,
            session_token,
            secure=request.url.scheme == "https"
        )
        return response

    error = "Неверный логин или пароль"
    return templates.TemplateResponse(
        "admin_login.html",
        {
            "request": request,
            "error": error,
            "username": username
        },
        status_code=401
    )


class OptionResponse(BaseModel):
    id: str
    name: str


class GroupInfo(BaseModel):
    id: str
    name: Optional[str] = None


class Lesson(BaseModel):
    id: str
    date: str
    pair_number: Optional[int] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    subject: Optional[str] = None
    type: Optional[str] = None
    teacher: Optional[str] = None
    room: Optional[str] = None
    group_id: Optional[str] = None
    notes: Optional[str] = None


class ScheduleResponse(BaseModel):
    group: GroupInfo
    lessons: List[Lesson]


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    role: str
    group_id: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserResponse
    success: bool
    message: str


class RoleUpdateRequest(BaseModel):
    user_id: int
    role: str
    group_id: Optional[str] = None


class HomeworkRequest(BaseModel):
    lesson_id: str
    homework_text: str
    group_id: str


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/options/faculties", response_model=List[OptionResponse])
async def list_faculties() -> List[OptionResponse]:
    options = _get_options_tree()
    if options:
        faculties = options.get("faculties", [])
        return [OptionResponse(id=item["id"], name=item["name"]) for item in faculties]

    client = SpaScheduleClient()
    faculties = await run_in_threadpool(client.list_faculties)
    return _serialize_options(faculties)


@app.get("/api/options/courses", response_model=List[OptionResponse])
async def list_courses(faculty_id: str = Query(..., alias="faculty")) -> List[OptionResponse]:
    options = _get_options_tree()
    if options:
        faculty = _find_faculty(options, faculty_id)
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found in cache")
        courses = faculty.get("courses", [])
        return [OptionResponse(id=item["id"], name=item["name"]) for item in courses]

    client = SpaScheduleClient()
    courses = await run_in_threadpool(client.list_courses, faculty_id)
    return _serialize_options(courses)


@app.get("/api/options/groups", response_model=List[OptionResponse])
async def list_groups(
    faculty_id: str = Query(..., alias="faculty"),
    course: str = Query(...),
) -> List[OptionResponse]:
    options = _get_options_tree()
    if options:
        course_entry = _find_course(options, faculty_id, course)
        if not course_entry:
            raise HTTPException(status_code=404, detail="Course not found in cache")
        groups = course_entry.get("groups", [])
        return [OptionResponse(id=item["id"], name=item["name"]) for item in groups]

    client = SpaScheduleClient()
    groups = await run_in_threadpool(client.list_groups, faculty_id, course)
    return _serialize_options(groups)


@app.get("/api/options/tree")
async def get_options_tree() -> Dict[str, Any]:
    options = _get_options_tree()
    if options:
        return options

    client = SpaScheduleClient()
    faculties = await run_in_threadpool(client.list_faculties)
    tree: List[Dict[str, Any]] = []
    for faculty in faculties:
        faculty_entry: Dict[str, Any] = {"id": faculty.id, "name": faculty.name, "courses": []}
        tree.append(faculty_entry)
        courses = await run_in_threadpool(client.list_courses, faculty.id)
        for course in courses:
            course_entry: Dict[str, Any] = {"id": course.id, "name": course.name, "groups": []}
            faculty_entry["courses"].append(course_entry)
            groups = await run_in_threadpool(client.list_groups, faculty.id, course.id)
            for group in groups:
                course_entry["groups"].append({"id": group.id, "name": group.name})
    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "faculties": tree,
    }


@app.get("/api/schedule", response_model=ScheduleResponse)
async def get_schedule(
    faculty_id: str = Query(..., alias="faculty"),
    course: str = Query(...),
    group_id: str = Query(..., alias="group"),
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
) -> ScheduleResponse:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=400, detail="'from' date must be before 'to' date")

    cached_entry = _get_cached_schedule(group_id)
    if cached_entry and _matches_requested_range(cached_entry, date_from, date_to):
        lessons = [Lesson(**lesson) for lesson in cached_entry.get("lessons", [])]
        group_name = cached_entry.get("group_name")
        return ScheduleResponse(group=GroupInfo(id=group_id, name=group_name), lessons=lessons)

    try:
        client = SpaScheduleClient()
        result = await run_in_threadpool(
            client.fetch_schedule,
            faculty_id,
            course,
            group_id,
            date_from=date_from,
            date_to=date_to,
        )
        group_name = result.get("group", {}).get("name") if result.get("group") else None
        lessons = [Lesson(**lesson) for lesson in result.get("lessons", [])]
        return ScheduleResponse(group=GroupInfo(id=group_id, name=group_name), lessons=lessons)
    except Exception as e:
        # Если не удалось получить данные с сервера, пытаемся использовать кэш
        print(f"Ошибка при получении расписания: {e}")
        
        # Пытаемся найти любые кэшированные данные для этой группы
        cached_entry = _get_cached_schedule(group_id)
        if cached_entry:
            print(f"Используем кэшированные данные для группы {group_id}")
            lessons = [Lesson(**lesson) for lesson in cached_entry.get("lessons", [])]
            group_name = cached_entry.get("group_name")
            return ScheduleResponse(group=GroupInfo(id=group_id, name=group_name), lessons=lessons)
        
        # Если кэша нет, возвращаем пустое расписание с сообщением об ошибке
        print(f"Кэш для группы {group_id} не найден, возвращаем пустое расписание")
        return ScheduleResponse(
            group=GroupInfo(id=group_id, name=f"Группа {group_id} (ошибка загрузки)"), 
            lessons=[]
        )


def _serialize_options(items: List[OptionItem]) -> List[OptionResponse]:
    return [OptionResponse(id=item.id, name=item.name) for item in items]


def _load_cache(force: bool = False) -> Optional[Dict[str, Any]]:
    global _cache_payload, _cache_loaded_at
    if not CACHE_PATH.exists():
        return None
    if (
        not force
        and _cache_payload is not None
        and _cache_loaded_at is not None
        and (datetime.utcnow() - _cache_loaded_at).total_seconds() < CACHE_MAX_AGE_SECONDS
    ):
        return _cache_payload
    try:
        payload = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    _cache_payload = payload
    _cache_loaded_at = datetime.utcnow()
    return payload


def _get_cached_schedule(group_id: str) -> Optional[Dict[str, Any]]:
    cache = _load_cache()
    if not cache:
        return None
    groups = cache.get("groups", {})
    return groups.get(str(group_id))


def _get_options_tree() -> Optional[Dict[str, Any]]:
    cache = _load_cache()
    if not cache:
        return None
    options = cache.get("options")
    return options


def _find_faculty(options: Dict[str, Any], faculty_id: str) -> Optional[Dict[str, Any]]:
    faculties = options.get("faculties", [])
    for faculty in faculties:
        if str(faculty.get("id")) == str(faculty_id):
            return faculty
    return None


def _find_course(options: Dict[str, Any], faculty_id: str, course_id: str) -> Optional[Dict[str, Any]]:
    faculty = _find_faculty(options, faculty_id)
    if not faculty:
        return None
    courses = faculty.get("courses", [])
    for course in courses:
        if str(course.get("id")) == str(course_id):
            return course
    return None


def _matches_requested_range(entry: Dict[str, Any], start: Optional[date], end: Optional[date]) -> bool:
    cached_from = entry.get("date_from")
    cached_to = entry.get("date_to")
    if not cached_from or not cached_to:
        return False
    requested_from = start.isoformat() if start else cached_from
    requested_to = end.isoformat() if end else cached_to
    return requested_from == cached_from and requested_to == cached_to


# Эндпоинты для аутентификации и управления пользователями

@app.post("/api/auth/telegram", response_model=AuthResponse)
async def authenticate_telegram_enhanced(
    init_data: str = Form(...),
    group_id: Optional[str] = Form(None),
    request: Request = None
) -> AuthResponse:
    """Улучшенная аутентификация через Telegram WebApp"""
    ip_address = request.client.host if request.client else None
    
    print(f"Получены данные для аутентификации:")
    print(f"- init_data: {init_data}")
    print(f"- group_id: {group_id}")
    print(f"- IP: {ip_address}")
    
    # Используем улучшенную аутентификацию
    auth_result = enhanced_auth.authenticate_user(init_data, ip_address)
    
    if auth_result.status != AuthStatus.SUCCESS:
        print(f"Ошибка аутентификации: {auth_result.message}")
        return AuthResponse(
            user=UserResponse(id=0, first_name="", role="guest"),
            success=False,
            message=auth_result.message
        )
    
    user = auth_result.user
    
    # Устанавливаем группу, если передана
    if group_id and group_id != user.group_id:
        user.group_id = group_id
        user_manager.set_user_role(user.id, user.role, group_id)
        print(f"Установлена группа: {group_id}")
    
    print(f"✅ Успешная аутентификация: {user.first_name} ({user.role.value})")
    
    return AuthResponse(
        user=UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            photo_url=user.photo_url,
            role=user.role.value,
            group_id=user.group_id
        ),
        success=True,
        message=auth_result.message
    )


@app.get("/api/auth/session", response_model=dict)
async def get_session_info(
    current_user: TelegramUser = Depends(require_auth_enhanced)
) -> dict:
    """Получаем информацию о сессии пользователя"""
    return get_user_session_info(current_user)


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(user: TelegramUser = Depends(require_admin_user)) -> UserResponse:
    """Получаем информацию о текущем пользователе"""
    return UserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        photo_url=user.photo_url,
        role=user.role.value,
        group_id=user.group_id
    )


@app.post("/api/users/role", response_model=RoleUpdateResponse)
async def update_user_role_enhanced(
    request: RoleUpdateRequest,
    current_user: TelegramUser = Depends(require_admin_user)
) -> RoleUpdateResponse:
    """Обновляем роль пользователя с улучшенной проверкой разрешений"""
    try:
        role = UserRole(request.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверная роль")
    
    # Получаем целевого пользователя
    target_user = user_manager.get_user(request.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем права на назначение роли
    if not auth_manager.can_promote_user(current_user, target_user, role):
        raise HTTPException(
            status_code=403, 
            detail=f"Недостаточно прав для назначения роли {role_manager.get_role_display_name(role)}"
        )
    
    # Проверяем доступ к группе, если указана
    if request.group_id and not auth_manager.check_group_access(current_user, request.group_id, "manage"):
        raise HTTPException(status_code=403, detail="Нет доступа к управлению этой группой")
    
    # Обновляем роль
    success = user_manager.set_user_role(request.user_id, role, request.group_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось обновить роль пользователя")
    
    # Логируем действие
    db_manager.log_audit(
        current_user.id,
        "role_updated",
        "user",
        f"Updated role of user {request.user_id} to {role.value}",
        None
    )
    
    return RoleUpdateResponse(
        success=True,
        message=f"Роль успешно обновлена на {role_manager.get_role_display_name(role)}",
        user_id=request.user_id,
        new_role=role.value,
        group_id=request.group_id
    )


@app.get("/api/groups/{group_id}/users", response_model=List[UserResponse])
async def get_group_users(
    group_id: str,
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> List[UserResponse]:
    """Получаем список пользователей группы"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем, что пользователь имеет доступ к группе
    if not can_view_schedule(current_user, group_id):
        raise HTTPException(status_code=403, detail="Нет доступа к этой группе")
    
    group = user_manager.get_group(group_id)
    if not group:
        return []
    
    users = []
    
    # Добавляем старосту
    if group.monitor_user_id:
        monitor = user_manager.get_user(group.monitor_user_id)
        if monitor:
            users.append(UserResponse(
                id=monitor.id,
                first_name=monitor.first_name,
                last_name=monitor.last_name,
                username=monitor.username,
                photo_url=monitor.photo_url,
                role=monitor.role.value,
                group_id=monitor.group_id
            ))
    
    # Добавляем студентов
    for student in user_manager.get_group_students(group_id):
        users.append(UserResponse(
            id=student.id,
            first_name=student.first_name,
            last_name=student.last_name,
            username=student.username,
            photo_url=student.photo_url,
            role=student.role.value,
            group_id=student.group_id
        ))
    
    return users


@app.get("/api/test-auth", response_model=dict)
async def test_auth(
    current_user: Optional[TelegramUser] = Depends(get_current_user_enhanced)
) -> dict:
    """Тестовый эндпоинт для проверки аутентификации"""
    if not current_user:
        return {"error": "No user"}
    
    return {
        "user_id": current_user.id,
        "role": current_user.role.value,
        "group_id": current_user.group_id,
        "first_name": current_user.first_name
    }


@app.post("/api/schedule/homework", response_model=dict)
async def add_homework(
    lesson_id: str = Form(...),
    homework_text: str = Form(...),
    group_id: str = Form(...),
    init_data: Optional[str] = Form(None),
    current_user: Optional[TelegramUser] = Depends(get_current_user_enhanced)
) -> dict:
    """Добавляем домашнее задание к уроку (только для старост)"""
    print(f"[HOMEWORK DEBUG] Using enhanced auth - User: {current_user.id if current_user else 'None'}")
    
    # ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ROLE_MANAGER
    print(f"[HOMEWORK DEBUG] role_manager object: {role_manager}")
    print(f"[HOMEWORK DEBUG] role_manager type: {type(role_manager)}")
    print(f"[HOMEWORK DEBUG] role_manager has _role_permissions: {hasattr(role_manager, '_role_permissions')}")
    if hasattr(role_manager, '_role_permissions'):
        print(f"[HOMEWORK DEBUG] Available roles: {list(role_manager._role_permissions.keys())}")
        print(f"[HOMEWORK DEBUG] Role permissions for MONITOR: {role_manager._role_permissions.get(UserRole.MONITOR)}")
    
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем права доступа на управление домашними заданиями
    
    print(f"[HOMEWORK DEBUG] User: {current_user.id}, Role: {current_user.role}")
    print(f"[HOMEWORK DEBUG] User Group: {current_user.group_id}, Request Group: {group_id}")
    print(f"[HOMEWORK DEBUG] Checking MANAGE_HOMEWORK permission...")
    
    # Проверяем базовое разрешение на управление домашними заданиями
    has_manage_homework = check_permission(current_user.role, Permission.MANAGE_HOMEWORK)
    print(f"[HOMEWORK DEBUG] MANAGE_HOMEWORK: {has_manage_homework}")
    
    if not has_manage_homework:
        raise HTTPException(
            status_code=403, 
            detail=f"Недостаточно прав для управления домашними заданиями. Роль: {current_user.role.value}"
        )
    
    print(f"[HOMEWORK DEBUG] Checking group access...")
    print(f"[HOMEWORK DEBUG] User group: {current_user.group_id}, Request group: {group_id}")
    
    # Проверяем доступ к конкретной группе
    has_all_groups = check_permission(current_user.role, Permission.MANAGE_ALL_GROUPS_HOMEWORK)
    print(f"[HOMEWORK DEBUG] MANAGE_ALL_GROUPS_HOMEWORK: {has_all_groups}")
    
    if not has_all_groups:
        # Если нет прав на все группы, проверяем права на свою группу
        has_own_group = check_permission(current_user.role, Permission.MANAGE_OWN_GROUP_HOMEWORK)
        print(f"[HOMEWORK DEBUG] MANAGE_OWN_GROUP_HOMEWORK: {has_own_group}")
        
        if not has_own_group:
            raise HTTPException(
                status_code=403, 
                detail=f"Недостаточно прав для управления домашними заданиями в группе. Роль: {current_user.role.value}"
            )
        
        # Проверяем, что пользователь пытается управлять своей группой
        groups_match = current_user.group_id == group_id
        print(f"[HOMEWORK DEBUG] Groups match: {groups_match}")
        
        if not groups_match:
            raise HTTPException(
                status_code=403, 
                detail=f"Недостаточно прав для управления домашними заданиями в группе {group_id}. Ваша группа: {current_user.group_id}"
            )
    
    print(f"[HOMEWORK DEBUG] All checks passed! ✅")
    
    # Сохраняем домашнее задание в базу данных
    from .database import db_manager
    
    success = db_manager.add_homework_task(
        lesson_id=lesson_id,
        group_id=group_id,
        homework_text=homework_text,
        created_by=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Ошибка при сохранении домашнего задания"
        )
    
    print(f"[HOMEWORK DEBUG] Homework saved successfully for lesson {lesson_id}")
    
    # Отправляем уведомления группе о новом домашнем задании
    if notification_manager:
        try:
            lesson_name = f"Урок {lesson_id}"
            await notification_manager.notify_homework_assigned(
                lesson_id=lesson_id,
                lesson_name=lesson_name,
                homework_text=homework_text,
                group_id=group_id,
                created_by_user=current_user
            )
            print(f"✅ Уведомления отправлены группе {group_id} о новом ДЗ")
        except Exception as e:
            print(f"⚠️ Ошибка отправки уведомлений о ДЗ: {e}")
            # Не прерываем выполнение, если уведомления не отправились
    
    return {
        "success": True,
        "message": "Домашнее задание добавлено",
        "lesson_id": lesson_id,
        "homework": homework_text
    }


@app.delete("/api/schedule/homework", response_model=dict)
async def delete_homework(
    lesson_id: str = Form(...),
    group_id: str = Form(...),
    init_data: Optional[str] = Form(None),
    current_user: Optional[TelegramUser] = Depends(get_current_user_enhanced)
) -> dict:
    """Удаляем домашнее задание (только для старост)"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем права доступа на управление домашними заданиями
    
    # Проверяем базовое разрешение на управление домашними заданиями
    if not check_permission(current_user.role, Permission.MANAGE_HOMEWORK):
        raise HTTPException(
            status_code=403, 
            detail=f"Недостаточно прав для управления домашними заданиями. Роль: {current_user.role.value}"
        )
    
    # Проверяем доступ к конкретной группе
    if not check_permission(current_user.role, Permission.MANAGE_ALL_GROUPS_HOMEWORK):
        # Если нет прав на все группы, проверяем права на свою группу
        if not check_permission(current_user.role, Permission.MANAGE_OWN_GROUP_HOMEWORK):
            raise HTTPException(
                status_code=403, 
                detail=f"Недостаточно прав для управления домашними заданиями в группе. Роль: {current_user.role.value}"
            )
        
        # Проверяем, что пользователь пытается управлять своей группой
        if current_user.group_id != group_id:
            raise HTTPException(
                status_code=403, 
                detail=f"Недостаточно прав для управления домашними заданиями в группе {group_id}. Ваша группа: {current_user.group_id}"
            )
    
    # Удаляем домашнее задание из базы данных
    from .database import db_manager
    
    success = db_manager.delete_homework_task(
        lesson_id=lesson_id,
        group_id=group_id
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Домашнее задание не найдено"
        )
    
    print(f"[HOMEWORK DEBUG] Homework deleted successfully for lesson {lesson_id}")
    
    # Отправляем уведомления об удалении домашнего задания
    if notification_manager:
        try:
            lesson_name = f"Урок {lesson_id}"
            await notification_manager.notify_homework_deleted(
                lesson_id=lesson_id,
                lesson_name=lesson_name,
                group_id=group_id,
                deleted_by_user=current_user
            )
            print(f"✅ Уведомления отправлены группе {group_id} об удалении ДЗ")
        except Exception as e:
            print(f"⚠️ Ошибка отправки уведомлений об удалении ДЗ: {e}")
            # Не прерываем выполнение, если уведомления не отправились
    
    return {
        "success": True,
        "message": "Домашнее задание удалено",
        "lesson_id": lesson_id
    }


@app.get("/api/schedule/homework/{group_id}", response_model=dict)
async def get_group_homework(
    group_id: str,
    current_user: Optional[TelegramUser] = Depends(get_current_user_enhanced)
) -> dict:
    """Получаем все домашние задания для группы"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем доступ к группе
    from .roles import Permission, check_permission
    
    # Проверяем базовое право на просмотр домашних заданий
    has_view_homework = check_permission(current_user.role, Permission.VIEW_HOMEWORK)
    
    if not has_view_homework:
        raise HTTPException(
            status_code=403, 
            detail=f"Недостаточно прав для просмотра домашних заданий. Роль: {current_user.role.value}"
        )
    
    # Проверяем права на управление домашними заданиями (для старост и админов)
    has_all_groups = check_permission(current_user.role, Permission.MANAGE_ALL_GROUPS_HOMEWORK)
    has_own_group = check_permission(current_user.role, Permission.MANAGE_OWN_GROUP_HOMEWORK)
    
    # Если у пользователя есть права на управление, проверяем доступ к конкретной группе
    if has_all_groups or has_own_group:
        if not has_all_groups and current_user.group_id != group_id:
            raise HTTPException(
                status_code=403, 
                detail=f"Недостаточно прав для просмотра домашних заданий группы {group_id}. Ваша группа: {current_user.group_id}"
            )
    
    # Получаем домашние задания из базы данных
    from .database import db_manager
    
    homework_tasks = db_manager.get_group_homework_tasks(group_id)
    
    return {
        "success": True,
        "group_id": group_id,
        "homework_tasks": homework_tasks
    }


@app.get("/api/admin/groups", response_model=List[dict])
async def get_all_groups(
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> List[dict]:
    """Получаем список всех групп (только для администраторов)"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем права администратора
    if not can_manage_all_groups(current_user):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра всех групп")
    
    # Получаем все группы из менеджера пользователей
    groups = []
    for group_id, group in user_manager._groups.items():
        groups.append({
            "group_id": group_id,
            "group_name": group.group_name,
            "monitor_user_id": group.monitor_user_id,
            "student_count": len(group.student_user_ids)
        })
    
    return groups


@app.get("/api/user/current", response_model=UserResponse)
async def get_current_user_info(
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> UserResponse:
    """Получаем информацию о текущем пользователе"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    return UserResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        username=current_user.username,
        photo_url=current_user.photo_url,
        role=current_user.role.value,
        group_id=current_user.group_id
    )


@app.get("/api/schedule/{group_id}/permissions", response_model=dict)
async def get_schedule_permissions(
    group_id: str,
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> dict:
    """Получаем права доступа пользователя к расписанию группы"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    return {
        "can_view": can_view_schedule(current_user, group_id),
        "can_edit": can_edit_schedule(current_user, group_id),
        "user_role": current_user.role.value,
        "user_group": current_user.group_id,
        "is_admin": can_manage_all_groups(current_user)
    }


@app.post("/api/admin/reset-users", response_model=dict)
async def reset_users_data(
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> dict:
    """Сбрасываем данные пользователей (только для администраторов)"""
    # Проверяем аутентификацию
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется аутентификация")
    
    # Проверяем права администратора
    if not can_manage_all_groups(current_user):
        raise HTTPException(status_code=403, detail="Недостаточно прав для сброса данных")
    
    success = user_manager.reset_data_file()
    
    if success:
        return {"success": True, "message": "Данные пользователей сброшены"}
    else:
        raise HTTPException(status_code=500, detail="Ошибка при сбросе данных")


# Новые API эндпоинты для Telegram Mini App

@app.get("/api/user/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: TelegramUser = Depends(require_auth_enhanced)
) -> UserProfileResponse:
    """Получаем расширенный профиль пользователя"""
    # Получаем информацию о группе
    group_name = None
    if current_user.group_id:
        group = user_manager.get_group(current_user.group_id)
        if group:
            group_name = group.group_name
    
    # Получаем разрешения пользователя
    permissions = get_user_permissions_dict(current_user)
    
    return UserProfileResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        username=current_user.username,
        photo_url=current_user.photo_url,
        language_code=getattr(current_user, 'language_code', None),
        role=current_user.role.value,
        role_display=role_manager.get_role_display_name(current_user.role),
        status=getattr(current_user, 'status', 'active'),
        group_id=current_user.group_id,
        group_name=group_name,
        created_at=getattr(current_user, 'created_at', None),
        last_seen=getattr(current_user, 'last_seen', None),
        permissions=permissions
    )


@app.get("/api/users", response_model=UserListResponse)
async def get_users_list(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None),
    current_user: TelegramUser = Depends(require_admin_user)
) -> UserListResponse:
    """Получаем список пользователей с фильтрацией и пагинацией"""
    # require_admin_user уже проверил, что это администратор
    
    # Вычисляем offset
    offset = (page - 1) * per_page
    
    # Получаем пользователей
    users = user_manager.get_all_users(per_page, offset)
    
    # Фильтруем по роли, если указана
    if role:
        try:
            role_enum = UserRole(role)
            users = [user for user in users if user.role == role_enum]
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверная роль")
    
    # Фильтруем по группе, если указана
    if group_id:
        users = [user for user in users if user.group_id == group_id]
    
    # Получаем общее количество (упрощенно)
    total = len(users) + offset  # В реальной системе нужен отдельный запрос
    
    # Преобразуем в ответ
    user_profiles = []
    for user in users:
        group_name = None
        if user.group_id:
            group = user_manager.get_group(user.group_id)
            if group:
                group_name = group.group_name
        
        user_profiles.append(UserProfileResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            photo_url=user.photo_url,
            language_code=getattr(user, 'language_code', None),
            role=user.role.value,
            role_display=role_manager.get_role_display_name(user.role),
            status=getattr(user, 'status', 'active'),
            group_id=user.group_id,
            group_name=group_name,
            created_at=getattr(user, 'created_at', None),
            last_seen=getattr(user, 'last_seen', None),
            permissions=auth_manager.get_user_permissions(user)
        ))
    
    total_pages = (total + per_page - 1) // per_page
    
    return UserListResponse(
        users=user_profiles,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@app.get("/api/groups", response_model=GroupListResponse)
async def get_groups_list(
    current_user: TelegramUser = Depends(require_admin_user)
) -> GroupListResponse:
    """Получаем список всех групп"""
    # require_admin_user уже проверил, что это администратор
    
    # Получаем все группы из базы данных
    groups = []
    with db_manager.get_connection() as conn:
        rows = conn.execute("SELECT * FROM groups ORDER BY created_at DESC").fetchall()
        
        for row in rows:
            # Получаем информацию о старосте
            monitor_name = None
            if row['monitor_telegram_id']:
                monitor_user = user_manager.get_user(row['monitor_telegram_id'])
                if monitor_user:
                    monitor_name = f"{monitor_user.first_name} {monitor_user.last_name or ''}".strip()
            
            # Подсчитываем количество студентов
            student_count = conn.execute(
                "SELECT COUNT(*) FROM user_groups WHERE group_id = ?",
                (row['id'],)
            ).fetchone()[0]
            
            groups.append(GroupInfoResponse(
                id=row['id'],
                name=row['name'],
                faculty_id=row['faculty_id'],
                course_id=row['course_id'],
                monitor_id=row['monitor_telegram_id'],
                monitor_name=monitor_name,
                student_count=student_count,
                created_at=row['created_at']
            ))
    
    return GroupListResponse(groups=groups, total=len(groups))


@app.post("/api/groups/join", response_model=GroupJoinResponse)
async def join_group(
    request: GroupJoinRequest,
    current_user: TelegramUser = Depends(require_auth_enhanced)
) -> GroupJoinResponse:
    """Присоединяемся к группе"""
    # Проверяем, что группа существует
    group = user_manager.get_group(request.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    
    # Проверяем, что пользователь еще не в группе
    if current_user.group_id == request.group_id:
        return GroupJoinResponse(
            success=True,
            message="Вы уже состоите в этой группе",
            group_id=request.group_id,
            group_name=group.group_name
        )
    
    # Добавляем пользователя в группу
    success = user_manager.add_user_to_group(current_user.id, request.group_id)
    
    if success:
        # Логируем действие
        db_manager.log_audit(current_user.id, "joined_group", "group", f"Joined group {request.group_id}")
        
        return GroupJoinResponse(
            success=True,
            message="Успешно присоединились к группе",
            group_id=request.group_id,
            group_name=group.group_name
        )
    else:
        raise HTTPException(status_code=400, detail="Не удалось присоединиться к группе")


@app.get("/api/user/permissions", response_model=PermissionCheckResponse)
async def get_user_permissions(
    current_user: TelegramUser = Depends(require_auth_enhanced)
) -> PermissionCheckResponse:
    """Получаем все разрешения пользователя"""
    permissions = auth_manager.get_user_permissions(current_user)
    
    return PermissionCheckResponse(
        can_view=permissions.get('view_schedule', False),
        can_edit=permissions.get('edit_schedule', False),
        can_manage_users=permissions.get('manage_users', False),
        can_manage_group=permissions.get('manage_groups', False),
        can_view_statistics=permissions.get('view_statistics', False),
        can_manage_system=permissions.get('manage_system', False),
        user_role=current_user.role.value,
        user_group=current_user.group_id
    )


@app.get("/api/admin/stats", response_model=UserStatsResponse)
async def get_user_statistics(
    current_user: TelegramUser = Depends(require_admin_user)
) -> UserStatsResponse:
    """Получаем статистику пользователей (только для админов)"""
    # require_admin_user уже проверил, что это администратор
    
    stats = user_manager.get_user_stats()
    
    return UserStatsResponse(
        total_users=stats.get('total_users', 0),
        total_groups=stats.get('total_groups', 0),
        active_users_week=stats.get('active_users_week', 0),
        roles=stats.get('roles', {}),
        statuses=stats.get('statuses', {})
    )


@app.get("/api/admin/audit", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    current_user: TelegramUser = Depends(require_admin_user)
) -> AuditLogListResponse:
    """Получаем записи аудита (только для админов)"""
    # require_admin_user уже проверил, что это администратор
    
    offset = (page - 1) * per_page
    
    # Получаем записи аудита
    logs = []
    with db_manager.get_connection() as conn:
        # Строим запрос с фильтрами
        query = """
            SELECT al.*, u.first_name, u.last_name 
            FROM audit_log al
            LEFT JOIN users u ON al.user_telegram_id = u.telegram_id
            WHERE 1=1
        """
        params = []
        
        if user_id:
            query += " AND al.user_telegram_id = ?"
            params.append(user_id)
        
        if action:
            query += " AND al.action = ?"
            params.append(action)
        
        query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])
        
        rows = conn.execute(query, params).fetchall()
        
        for row in rows:
            user_name = f"{row['first_name'] or ''} {row['last_name'] or ''}".strip()
            if not user_name:
                user_name = f"User {row['user_telegram_id']}"
            
            logs.append(AuditLogResponse(
                id=row['id'],
                user_id=row['user_telegram_id'],
                user_name=user_name,
                action=row['action'],
                resource=row['resource'],
                details=row['details'],
                created_at=row['created_at']
            ))
        
        # Получаем общее количество
        count_query = "SELECT COUNT(*) FROM audit_log WHERE 1=1"
        count_params = []
        
        if user_id:
            count_query += " AND user_telegram_id = ?"
            count_params.append(user_id)
        
        if action:
            count_query += " AND action = ?"
            count_params.append(action)
        
        total = conn.execute(count_query, count_params).fetchone()[0]
    
    total_pages = (total + per_page - 1) // per_page
    
    return AuditLogListResponse(
        logs=logs,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request) -> HTMLResponse:
    """Админ-панель: только вход по логину/паролю."""

    # Проверяем авторизацию администратора (только через cookie)
    admin_user = await get_admin_user(request)
    
    if not admin_user:
        # Если нет авторизации, показываем страницу входа
        return templates.TemplateResponse("admin_login.html", {"request": request})
    
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "admin_user": admin_user
    })


@app.get("/api/system/info", response_model=SystemInfoResponse)
async def get_system_info(
    current_user: TelegramUser = Depends(require_admin_user)
) -> SystemInfoResponse:
    """Получаем информацию о системе (только для админов)"""
    # require_admin_user уже проверил, что это администратор
    
    stats = user_manager.get_user_stats()
    
    return SystemInfoResponse(
        version="2.0.0",
        database_status="SQLite - Active",
        total_users=stats.get('total_users', 0),
        total_groups=stats.get('total_groups', 0),
        uptime="Unknown",  # В реальной системе нужно отслеживать время запуска
        last_backup=None
    )


@app.post("/webhook")
async def telegram_webhook(request: Request):
    """Обработка webhook от Telegram бота"""
    try:
        data = await request.json()
        
        # Обработка сообщений
        if 'message' in data:
            message = data['message']
            chat_id = message['chat']['id']
            user_id = message['from']['id']
            username = message['from'].get('username', '')
            first_name = message['from'].get('first_name', '')
            last_name = message['from'].get('last_name', '')
            text = message.get('text', '')
            
            # Создаем объект пользователя для авторизации
            telegram_user = TelegramUser(
                id=user_id,
                first_name=first_name,
                last_name=last_name,
                username=username,
                role=UserRole.STUDENT  # По умолчанию студент
            )
            
            # Проверяем, является ли пользователь администратором
            if username and username.lower() == "david_nazaryan":
                telegram_user.role = UserRole.ADMIN
            
            # Авторизуем пользователя в боте
            bot_auth.authorize_user(telegram_user)
            
            # Обработка команд
            if text == '/start':
                await send_webapp_button(chat_id)
            elif text == '/login':
                await send_webapp_button(chat_id)
            elif text == '/help':
                await send_help_message(chat_id)
            elif text == '/status':
                await send_status_message(chat_id)
            elif text == '/myinfo':
                await send_user_info_message(chat_id, user_id)
            else:
                # Неизвестная команда
                await send_unknown_command_message(chat_id)
        
        # Обработка callback_query (нажатия на кнопки)
        elif 'callback_query' in data:
            callback_query = data['callback_query']
            chat_id = callback_query['message']['chat']['id']
            user_id = callback_query['from']['id']
            data_text = callback_query.get('data', '')
            
            # Обработка нажатий на кнопки
            if data_text == 'open_webapp':
                await send_webapp_button(chat_id)
            elif data_text == 'help':
                await send_help_message(chat_id)
        
        return {"ok": True}
    except Exception as e:
        print(f"Ошибка обработки webhook: {e}")
        import traceback
        traceback.print_exc()
        return {"ok": False}


async def send_webapp_button(chat_id: int):
    """Отправляем кнопку для открытия WebApp"""
    import requests
    import os
    
    bot_token = TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    data = {
        "chat_id": chat_id,
        "text": "🎓 Добро пожаловать в приложение расписания ФГУ МГУ!\n\nНажмите кнопку ниже, чтобы открыть приложение:",
        "reply_markup": {
            "inline_keyboard": [[
                {
                    "text": "📅 Открыть расписание",
                    "web_app": {"url": "https://vm-fc7b7f29.na4u.ru"}
                }
            ]]
        }
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Ошибка отправки сообщения: {e}")


async def send_help_message(chat_id: int):
    """Отправляем справку"""
    import requests
    
    bot_token = TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    help_text = """
🤖 *Справка по боту расписания*

*Доступные команды:*
/start - 🚀 Запустить бота и войти в приложение
/login - 🔐 Войти в приложение расписания
/help - ❓ Показать эту справку
/status - 📊 Проверить статус бота
/myinfo - 👤 Показать информацию о пользователе

*Функции приложения:*
• 📅 Просмотр расписания пар
• 📝 Добавление домашних заданий (для старост)
• 👥 Управление пользователями (для старост)
• ⚙️ Настройки и профиль

*Для использования:*
1. Нажмите /start или /login
2. Выберите "Открыть расписание"
3. Войдите в приложение через Telegram

*Поддержка:* @david_nazaryan
    """
    
    data = {
        "chat_id": chat_id,
        "text": help_text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Ошибка отправки справки: {e}")


async def send_status_message(chat_id: int):
    """Отправляем статус бота"""
    import requests
    
    bot_token = TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    # Получаем информацию о webhook
    webhook_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
    try:
        webhook_response = requests.get(webhook_url)
        webhook_info = webhook_response.json()
        
        if webhook_info.get("ok"):
            result = webhook_info.get("result", {})
            status = "✅ Активен" if result.get("url") else "❌ Не настроен"
            url_info = result.get("url", "Не установлен")
            errors = result.get("last_error_message", "Нет")
        else:
            status = "❌ Ошибка"
            url_info = "Неизвестно"
            errors = "Не удалось получить информацию"
    except:
        status = "❌ Ошибка"
        url_info = "Неизвестно"
        errors = "Ошибка подключения"
    
    status_text = f"""
📊 *Статус бота расписания*

*Webhook:* {status}
*URL:* `{url_info}`
*Ошибки:* {errors}

*Бот готов к работе!* 🚀
    """
    
    data = {
        "chat_id": chat_id,
        "text": status_text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Ошибка отправки статуса: {e}")


async def send_user_info_message(chat_id: int, user_id: int):
    """Отправляем информацию о пользователе"""
    import requests
    
    bot_token = TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    # Получаем информацию о пользователе
    user_info = bot_auth.get_user_info(user_id)
    
    if not user_info:
        text = "❌ Пользователь не авторизован"
    else:
        permissions = user_info["permissions"]
        
        text = f"""
👤 *Информация о пользователе*

*Имя:* {user_info['first_name']} {user_info.get('last_name', '')}
*Username:* @{user_info.get('username', 'не указан')}
*Роль:* {user_info['role_display']}
*Группа:* {user_info.get('group_id', 'не назначена')}

*Права доступа:*
• Просмотр: {'✅' if permissions['can_view'] else '❌'}
• Редактирование: {'✅' if permissions['can_edit'] else '❌'}
• Управление пользователями: {'✅' if permissions['can_manage_users'] else '❌'}
• Управление всеми группами: {'✅' if permissions['can_manage_all_groups'] else '❌'}
• Администратор: {'✅' if permissions['is_admin'] else '❌'}

*ID:* `{user_info['id']}`
        """
    
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Ошибка отправки информации о пользователе: {e}")


async def send_unknown_command_message(chat_id: int):
    """Отправляем сообщение о неизвестной команде"""
    import requests
    
    bot_token = TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    text = """
❓ *Неизвестная команда*

*Доступные команды:*
/start - 🚀 Запустить бота и войти в приложение
/login - 🔐 Войти в приложение расписания
/help - ❓ Показать справку по боту
/status - 📊 Проверить статус бота
/myinfo - 👤 Показать информацию о пользователе

Или нажмите /start для входа в приложение.
    """
    
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Ошибка отправки сообщения: {e}")


# === ЭНДПОИНТЫ СИСТЕМЫ УВЕДОМЛЕНИЙ ===

@app.get("/api/notifications/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: TelegramUser = Depends(get_current_user_enhanced)
) -> NotificationSettingsResponse:
    """Получает настройки уведомлений пользователя"""
    if not notification_manager:
        raise HTTPException(status_code=500, detail="Система уведомлений недоступна")
    
    settings = notification_manager.get_notification_settings(current_user.id)
    
    return NotificationSettingsResponse(
        user_id=settings.user_id,
        notifications_enabled=settings.notifications_enabled,
        homework_notifications=settings.homework_notifications,
        schedule_notifications=settings.schedule_notifications,
        group_notifications=settings.group_notifications,
        system_notifications=settings.system_notifications,
        reminder_notifications=settings.reminder_notifications,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
        language=settings.language,
        updated_at=datetime.now().isoformat()
    )


@app.put("/api/notifications/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_request: NotificationSettingsRequest,
    current_user: TelegramUser = Depends(get_current_user_enhanced)
) -> NotificationSettingsResponse:
    """Обновляет настройки уведомлений пользователя"""
    if not notification_manager:
        raise HTTPException(status_code=500, detail="Система уведомлений недоступна")
    
    settings = NotificationSettings(
        user_id=current_user.id,
        notifications_enabled=settings_request.notifications_enabled,
        homework_notifications=settings_request.homework_notifications,
        schedule_notifications=settings_request.schedule_notifications,
        group_notifications=settings_request.group_notifications,
        system_notifications=settings_request.system_notifications,
        reminder_notifications=settings_request.reminder_notifications,
        quiet_hours_start=settings_request.quiet_hours_start,
        quiet_hours_end=settings_request.quiet_hours_end,
        language=settings_request.language
    )
    
    success = notification_manager.update_notification_settings(settings)
    
    if not success:
        raise HTTPException(status_code=500, detail="Ошибка обновления настроек")
    
    return NotificationSettingsResponse(
        user_id=settings.user_id,
        notifications_enabled=settings.notifications_enabled,
        homework_notifications=settings.homework_notifications,
        schedule_notifications=settings.schedule_notifications,
        group_notifications=settings.group_notifications,
        system_notifications=settings.system_notifications,
        reminder_notifications=settings.reminder_notifications,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
        language=settings.language,
        updated_at=datetime.now().isoformat()
    )


@app.get("/api/notifications/history", response_model=NotificationHistoryListResponse)
async def get_notification_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: TelegramUser = Depends(get_current_user_enhanced)
) -> NotificationHistoryListResponse:
    """Получает историю уведомлений пользователя"""
    if not notification_manager:
        raise HTTPException(status_code=500, detail="Система уведомлений недоступна")
    
    notifications_data = notification_manager.get_notification_history(current_user.id, limit)
    
    notifications = []
    unread_count = 0
    
    for notification_data in notifications_data:
        if notification_data['data']:
            try:
                data = json.loads(notification_data['data'])
            except:
                data = None
        else:
            data = None
        
        notifications.append(NotificationHistoryResponse(
            id=notification_data['id'],
            type=notification_data['type'],
            title=notification_data['title'],
            message=notification_data['message'],
            data=data,
            sent=bool(notification_data['sent']),
            created_at=notification_data['created_at'],
            sent_at=notification_data['sent_at']
        ))
        
        if not notification_data['sent']:
            unread_count += 1
    
    return NotificationHistoryListResponse(
        notifications=notifications,
        total=len(notifications),
        unread_count=unread_count
    )


@app.post("/api/admin/notifications/send", response_model=SendNotificationResponse)
async def send_admin_notification(
    notification_request: SendNotificationRequest,
    current_user: TelegramUser = Depends(require_admin_user)
) -> SendNotificationResponse:
    """Отправляет уведомление пользователю или группе (только для администраторов)"""
    if not notification_manager:
        raise HTTPException(status_code=500, detail="Система уведомлений недоступна")
    
    try:
        # Проверяем, что указан либо user_id, либо group_id
        if not notification_request.user_id and not notification_request.group_id:
            raise HTTPException(status_code=400, detail="Необходимо указать user_id или group_id")
        
        sent_count = 0
        failed_count = 0
        
        notification = Notification(
            type=notification_request.type,
            title=notification_request.title,
            message=notification_request.message,
            data=notification_request.data or {}
        )
        
        if notification_request.user_id:
            # Отправка конкретному пользователю
            success = await notification_manager.send_notification(
                notification_request.user_id, 
                notification
            )
            if success:
                sent_count += 1
            else:
                failed_count += 1
        else:
            # Отправка группе
            results = await notification_manager.send_group_notification(
                notification_request.group_id, 
                notification
            )
            sent_count = sum(1 for success in results.values() if success)
            failed_count = len(results) - sent_count
        
        return SendNotificationResponse(
            success=True,
            message="Уведомление отправлено успешно",
            sent_count=sent_count,
            failed_count=failed_count
        )
        
    except Exception as e:
        print(f"❌ Ошибка отправки админского уведомления: {e}")
        return SendNotificationResponse(
            success=False,
            message=f"Ошибка отправки уведомления: {str(e)}",
            sent_count=0,
            failed_count=1
        )
