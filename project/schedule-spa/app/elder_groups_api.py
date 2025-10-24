"""
API endpoints для управления группами старост
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from .admin_auth import require_admin_auth, get_admin_user
from .auth import TelegramUser, UserRole
from .database import db_manager
from .models import UserProfileResponse, GroupInfoResponse, RoleUpdateResponse


# Модели для API
class ElderGroupCreateRequest(BaseModel):
    """Запрос на создание группы старост"""
    group_id: str
    group_name: str
    monitor_telegram_id: int


class ElderGroupUpdateRequest(BaseModel):
    """Запрос на обновление группы старост"""
    group_id: str
    group_name: Optional[str] = None
    monitor_telegram_id: Optional[int] = None


class ElderGroupMemberRequest(BaseModel):
    """Запрос на добавление/удаление участника группы старост"""
    group_id: str
    user_telegram_id: int


class ElderGroupResponse(BaseModel):
    """Ответ с информацией о группе старост"""
    group_id: str
    group_name: str
    monitor: Optional[UserProfileResponse] = None
    members: List[UserProfileResponse] = []
    member_count: int = 0
    created_at: Optional[str] = None


class ElderGroupListResponse(BaseModel):
    """Список групп старост"""
    groups: List[ElderGroupResponse]
    total: int


# Создаем роутер для API групп старост
elder_groups_router = APIRouter(prefix="/api/elder-groups", tags=["Elder Groups"])


@elder_groups_router.get("/", response_model=ElderGroupListResponse)
async def get_elder_groups(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_username: str = Depends(require_admin_auth)
) -> ElderGroupListResponse:
    """Получает список всех групп старост"""
    try:
        # Получаем все группы из базы данных
        with db_manager.get_connection() as conn:
            # Получаем общее количество групп
            total_groups = conn.execute("SELECT COUNT(*) FROM groups").fetchone()[0]
            
            # Получаем группы с пагинацией
            offset = (page - 1) * per_page
            groups_rows = conn.execute("""
                SELECT * FROM groups 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (per_page, offset)).fetchall()
            
            groups = []
            for group_row in groups_rows:
                group_id = group_row['id']
                
                # Получаем старосту группы
                monitor = None
                if group_row['monitor_telegram_id']:
                    monitor_user = db_manager.get_user(group_row['monitor_telegram_id'])
                    if monitor_user:
                        monitor = UserProfileResponse(
                            id=monitor_user.id,
                            first_name=monitor_user.first_name,
                            last_name=monitor_user.last_name,
                            username=monitor_user.username,
                            photo_url=monitor_user.photo_url,
                            language_code=getattr(monitor_user, 'language_code', None),
                            role=monitor_user.role.value,
                            role_display=monitor_user.role.value.title(),
                            status=getattr(monitor_user, 'status', 'active'),
                            group_id=monitor_user.group_id,
                            group_name=group_row['name'],
                            created_at=getattr(monitor_user, 'created_at', None),
                            last_seen=getattr(monitor_user, 'last_seen', None),
                            permissions={}
                        )
                
                # Получаем всех участников группы
                members_rows = conn.execute("""
                    SELECT u.* FROM users u
                    INNER JOIN user_groups ug ON u.telegram_id = ug.user_telegram_id
                    WHERE ug.group_id = ?
                    ORDER BY u.role DESC, u.first_name
                """, (group_id,)).fetchall()
                
                members = []
                for member_row in members_rows:
                    member_user = db_manager._row_to_telegram_user(member_row)
                    members.append(UserProfileResponse(
                        id=member_user.id,
                        first_name=member_user.first_name,
                        last_name=member_user.last_name,
                        username=member_user.username,
                        photo_url=member_user.photo_url,
                        language_code=getattr(member_user, 'language_code', None),
                        role=member_user.role.value,
                        role_display=member_user.role.value.title(),
                        status=getattr(member_user, 'status', 'active'),
                        group_id=member_user.group_id,
                        group_name=group_row['name'],
                        created_at=getattr(member_user, 'created_at', None),
                        last_seen=getattr(member_user, 'last_seen', None),
                        permissions={}
                    ))
                
                groups.append(ElderGroupResponse(
                    group_id=group_id,
                    group_name=group_row['name'],
                    monitor=monitor,
                    members=members,
                    member_count=len(members),
                    created_at=group_row['created_at']
                ))
            
            return ElderGroupListResponse(groups=groups, total=total_groups)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения групп старост: {str(e)}")


@elder_groups_router.post("/", response_model=ElderGroupResponse)
async def create_elder_group(
    request: ElderGroupCreateRequest,
    admin_username: str = Depends(require_admin_auth)
) -> ElderGroupResponse:
    """Создает новую группу старост"""
    try:
        # Проверяем, что пользователь существует
        monitor_user = db_manager.get_user(request.monitor_telegram_id)
        if not monitor_user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Проверяем, что группа не существует
        existing_group = db_manager.get_group(request.group_id)
        if existing_group:
            raise HTTPException(status_code=400, detail="Группа уже существует")
        
        # Создаем группу
        success = db_manager.create_group(
            request.group_id,
            request.group_name,
            request.monitor_telegram_id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Ошибка создания группы")
        
        # Логируем действие
        db_manager.log_audit(
            request.monitor_telegram_id,
            "elder_group_created",
            "elder_group",
            f"Created elder group {request.group_id} with monitor {request.monitor_telegram_id}"
        )
        
        # Возвращаем созданную группу
        return await get_elder_group(request.group_id, admin_username)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания группы: {str(e)}")


@elder_groups_router.get("/{group_id}", response_model=ElderGroupResponse)
async def get_elder_group(
    group_id: str,
    admin_username: str = Depends(require_admin_auth)
) -> ElderGroupResponse:
    """Получает информацию о конкретной группе старост"""
    try:
        group = db_manager.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Получаем старосту группы
        monitor = None
        if group.monitor_telegram_id:
            monitor_user = db_manager.get_user(group.monitor_telegram_id)
            if monitor_user:
                monitor = UserProfileResponse(
                    id=monitor_user.id,
                    first_name=monitor_user.first_name,
                    last_name=monitor_user.last_name,
                    username=monitor_user.username,
                    photo_url=monitor_user.photo_url,
                    language_code=getattr(monitor_user, 'language_code', None),
                    role=monitor_user.role.value,
                    role_display=monitor_user.role.value.title(),
                    status=getattr(monitor_user, 'status', 'active'),
                    group_id=monitor_user.group_id,
                    group_name=group.name,
                    created_at=getattr(monitor_user, 'created_at', None),
                    last_seen=getattr(monitor_user, 'last_seen', None),
                    permissions={}
                )
        
        # Получаем всех участников группы
        members = db_manager.get_group_members(group_id)
        member_profiles = []
        
        for member_user in members:
            member_profiles.append(UserProfileResponse(
                id=member_user.id,
                first_name=member_user.first_name,
                last_name=member_user.last_name,
                username=member_user.username,
                photo_url=member_user.photo_url,
                language_code=getattr(member_user, 'language_code', None),
                role=member_user.role.value,
                role_display=member_user.role.value.title(),
                status=getattr(member_user, 'status', 'active'),
                group_id=member_user.group_id,
                group_name=group.name,
                created_at=getattr(member_user, 'created_at', None),
                last_seen=getattr(member_user, 'last_seen', None),
                permissions={}
            ))
        
        return ElderGroupResponse(
            group_id=group_id,
            group_name=group.name,
            monitor=monitor,
            members=member_profiles,
            member_count=len(member_profiles),
            created_at=group.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения группы: {str(e)}")


@elder_groups_router.put("/{group_id}", response_model=ElderGroupResponse)
async def update_elder_group(
    group_id: str,
    request: ElderGroupUpdateRequest,
    admin_username: str = Depends(require_admin_auth)
) -> ElderGroupResponse:
    """Обновляет информацию о группе старост"""
    try:
        group = db_manager.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Обновляем информацию о группе
        with db_manager.get_connection() as conn:
            if request.group_name:
                conn.execute("""
                    UPDATE groups 
                    SET name = ?, updated_at = ?
                    WHERE id = ?
                """, (request.group_name, datetime.now().isoformat(), group_id))
            
            if request.monitor_telegram_id:
                # Проверяем, что новый староста существует
                new_monitor = db_manager.get_user(request.monitor_telegram_id)
                if not new_monitor:
                    raise HTTPException(status_code=404, detail="Новый староста не найден")
                
                # Обновляем старосту группы
                conn.execute("""
                    UPDATE groups 
                    SET monitor_telegram_id = ?, updated_at = ?
                    WHERE id = ?
                """, (request.monitor_telegram_id, datetime.now().isoformat(), group_id))
                
                # Обновляем роль нового старосты
                conn.execute("""
                    UPDATE users 
                    SET role = ?, group_id = ?, updated_at = ?
                    WHERE telegram_id = ?
                """, (UserRole.MONITOR.value, group_id, datetime.now().isoformat(), request.monitor_telegram_id))
                
                # Если был старый староста, меняем его роль на студента
                if group.monitor_telegram_id and group.monitor_telegram_id != request.monitor_telegram_id:
                    conn.execute("""
                        UPDATE users 
                        SET role = ?, updated_at = ?
                        WHERE telegram_id = ?
                    """, (UserRole.STUDENT.value, datetime.now().isoformat(), group.monitor_telegram_id))
            
            conn.commit()
        
        # Логируем действие
        db_manager.log_audit(
            request.monitor_telegram_id or group.monitor_telegram_id or 0,
            "elder_group_updated",
            "elder_group",
            f"Updated elder group {group_id}"
        )
        
        # Возвращаем обновленную группу
        return await get_elder_group(group_id, admin_username)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления группы: {str(e)}")


@elder_groups_router.post("/{group_id}/members", response_model=RoleUpdateResponse)
async def add_member_to_elder_group(
    group_id: str,
    request: ElderGroupMemberRequest,
    admin_username: str = Depends(require_admin_auth)
) -> RoleUpdateResponse:
    """Добавляет участника в группу старост"""
    try:
        # Проверяем, что группа существует
        group = db_manager.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Проверяем, что пользователь существует
        user = db_manager.get_user(request.user_telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Добавляем пользователя в группу
        success = db_manager.add_user_to_group(request.user_telegram_id, group_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Ошибка добавления пользователя в группу")
        
        # Логируем действие
        db_manager.log_audit(
            request.user_telegram_id,
            "added_to_elder_group",
            "elder_group",
            f"Added to elder group {group_id}"
        )
        
        return RoleUpdateResponse(
            success=True,
            message=f"Пользователь успешно добавлен в группу {group.name}",
            user_id=request.user_telegram_id,
            new_role=user.role.value,
            group_id=group_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка добавления участника: {str(e)}")


@elder_groups_router.delete("/{group_id}/members/{user_telegram_id}", response_model=RoleUpdateResponse)
async def remove_member_from_elder_group(
    group_id: str,
    user_telegram_id: int,
    admin_username: str = Depends(require_admin_auth)
) -> RoleUpdateResponse:
    """Удаляет участника из группы старост"""
    try:
        # Проверяем, что группа существует
        group = db_manager.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Проверяем, что пользователь существует
        user = db_manager.get_user(user_telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Удаляем пользователя из группы
        success = db_manager.remove_user_from_group(user_telegram_id, group_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Ошибка удаления пользователя из группы")
        
        # Логируем действие
        db_manager.log_audit(
            user_telegram_id,
            "removed_from_elder_group",
            "elder_group",
            f"Removed from elder group {group_id}"
        )
        
        return RoleUpdateResponse(
            success=True,
            message=f"Пользователь успешно удален из группы {group.name}",
            user_id=user_telegram_id,
            new_role=UserRole.STUDENT.value,
            group_id=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления участника: {str(e)}")


@elder_groups_router.delete("/{group_id}", response_model=Dict[str, Any])
async def delete_elder_group(
    group_id: str,
    admin_username: str = Depends(require_admin_auth)
) -> Dict[str, Any]:
    """Удаляет группу старост"""
    try:
        group = db_manager.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Удаляем группу и все связи
        with db_manager.get_connection() as conn:
            # Удаляем связи пользователей с группой
            conn.execute("DELETE FROM user_groups WHERE group_id = ?", (group_id,))
            
            # Сбрасываем роли всех участников группы на студента
            conn.execute("""
                UPDATE users 
                SET role = ?, group_id = NULL, updated_at = ?
                WHERE group_id = ?
            """, (UserRole.STUDENT.value, datetime.now().isoformat(), group_id))
            
            # Удаляем группу
            conn.execute("DELETE FROM groups WHERE id = ?", (group_id,))
            
            conn.commit()
        
        # Логируем действие
        db_manager.log_audit(
            0,  # Системное действие
            "elder_group_deleted",
            "elder_group",
            f"Deleted elder group {group_id}"
        )
        
        return {
            "success": True,
            "message": f"Группа {group.name} успешно удалена"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления группы: {str(e)}")

