from flask_login import UserMixin

from datetime import datetime

from .db import get_db

class User(UserMixin):
    def __init__(self, id_, profile_pic, last_visited):
        self.id = id_
        self.profile_pic = profile_pic
        self.last_visited = last_visited

    @staticmethod
    def get(user_id):
        db = get_db()
        user = db.execute(
            "SELECT * FROM user WHERE id = ?", (user_id,)
        ).fetchone()
        if not user:
            return None
        user = User(id_=user[0], profile_pic=user[1], last_visited=user[2])
        return user

    @staticmethod
    def create(id_, profile_pic):
        db = get_db()
        db.execute(
            "INSERT INTO user (id, profile_pic, last_visited) "
            "VALUES (?, ?, ?)",
            (id_, profile_pic, "0000-00-00T00:00:00Z"),
        )
        db.commit()
    
    @staticmethod
    def update_time(user_id):
        visit_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        db = get_db()
        db.execute(
            "UPDATE user "
            "SET last_visited = ? "
            "WHERE id = ?;",
            (visit_time, user_id),
        )
        db.commit()