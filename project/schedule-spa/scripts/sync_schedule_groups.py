from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from parser.spa_client import SpaScheduleClient, OptionItem  # noqa: E402
from app.database import db_manager  # noqa: E402


@dataclass
class SyncStats:
    faculties: int = 0
    courses: int = 0
    groups_total: int = 0
    groups_created: int = 0
    groups_updated: int = 0


def sync_groups_from_schedule() -> SyncStats:
    client = SpaScheduleClient()
    stats = SyncStats()

    faculties = client.list_faculties()
    stats.faculties = len(faculties)

    for faculty in faculties:
        print(f"📚 Факультет {faculty.name} ({faculty.id})")
        courses = client.list_courses(faculty.id)
        stats.courses += len(courses)

        for course in courses:
            print(f"  🎓 Курс {course.name} ({course.id})")
            groups = client.list_groups(faculty.id, course.id)
            stats.groups_total += len(groups)

            for group in groups:
                created = db_manager.upsert_group(
                    group_id=group.id,
                    group_name=group.name,
                    faculty_id=faculty.id,
                    course_id=course.id,
                )
                if created:
                    stats.groups_created += 1
                else:
                    stats.groups_updated += 1
                print(f"    ✅ Группа {group.name} ({group.id}) синхронизирована")

    return stats


def main() -> None:
    print("🚀 Синхронизация групп из расписания...")
    stats = sync_groups_from_schedule()
    print("\n🎉 Готово!")
    print(f"Факультетов: {stats.faculties}")
    print(f"Курсов: {stats.courses}")
    print(f"Групп найдено: {stats.groups_total}")
    print(f"Групп создано/обновлено: {stats.groups_created or stats.groups_updated}")


if __name__ == "__main__":
    main()







