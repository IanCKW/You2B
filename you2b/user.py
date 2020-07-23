from flask_login import UserMixin
from datetime import datetime
from .db import get_db

from .database import db_session
from .database import User as UserSQL

class User(UserMixin):
    def __init__(self, id_, profile_pic, last_visited, added_playlist): #or remove added_playlist...
        self.id = id_
        self.profile_pic = profile_pic
        self.last_visited = last_visited
        self.added_playlist = added_playlist

    @staticmethod
    def get(user_id):
        user = UserSQL.query.filter_by(id=user_id).first()
        if not user:
            return None
        user_instance = User(
            user.id,
            user.profile_pic,
            user.last_visited,
            user.added_playlist)
        return user_instance

    @staticmethod
    def create(id, profile_pic):
        user_instance = UserSQL(id, profile_pic, "0000-00-00T00:00:00Z", "")
        db_session.add(user_instance)
        db_session.commit()

    @staticmethod
    def update_time(user_id):
        visit_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        user_instance = UserSQL.query.filter_by(id=user_id).first()
        print("visit time: "+ visit_time)
        user_instance.last_visited = visit_time
        db_session.commit()

    @staticmethod
    def update_playlist(user_id, added_playlist):
        user_instance = UserSQL.query.filter_by(id=user_id).first()
        user_instance.added_playlist = added_playlist
        db_session.commit()