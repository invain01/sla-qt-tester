"""
用户服务示例
展示如何管理状态和业务逻辑
"""
from typing import Dict, List, Optional
from datetime import datetime


class User:
    """用户模型"""
    def __init__(self, id: int, name: str, email: str):
        self.id = id
        self.name = name
        self.email = email
        self.created_at = datetime.now()

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }


class UserService:
    """用户服务"""
    def __init__(self):
        self._users: Dict[int, User] = {}
        self._next_id = 1

    def create_user(self, name: str, email: str) -> Dict:
        """创建用户"""
        user = User(self._next_id, name, email)
        self._users[user.id] = user
        self._next_id += 1
        return user.to_dict()

    def get_user(self, user_id: int) -> Optional[Dict]:
        """获取用户"""
        user = self._users.get(user_id)
        return user.to_dict() if user else None

    def list_users(self) -> List[Dict]:
        """列出所有用户"""
        return [user.to_dict() for user in self._users.values()]

    def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        if user_id in self._users:
            del self._users[user_id]
            return True
        return False
