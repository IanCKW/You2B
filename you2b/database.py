from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String

DATABASE_URI =  #'postgres+psycopg2://<postgres username>:<password>@<host of server>:<port>/<database name>'
engine = create_engine(DATABASE_URI, convert_unicode=True)
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()


class User(Base):
    __tablename__ = 'user'
    id = Column(String(100), primary_key=True)
    profile_pic = Column(String(100))
    last_visited = Column(String(100))
    added_playlist = Column(String(100))

    def __repr__(self):
        return "<User(profile_pic='{}', last_visited='{}', added_playlist={},)>" \
            .format(self.profile_pic, self.last_visited, self.added_playlist, )

    def __init__(self, id, profile_pic, last_visited, added_playlist):
        self.id = id
        self.profile_pic = profile_pic
        self.last_visited = last_visited
        self.added_playlist = added_playlist


class Video(Base):
    __tablename__ = 'video'
    id = Column (Integer,primary_key=True)#since each table needs a unique key
    video_id = Column(String(100))
    user_id = Column(String(100))
    video_url = Column(String(100))
    video_img = Column(String(100))
    date_time = Column(String(100))
    channel_title = Column(String(100))
    video_title = Column(String(100))
    added = Column(Integer)  # 1 if this video was added via added_playlist. 0 if not
    deleted = Column(Integer)  # 1 for delted, 0 for not

    def __init__(self, video_id, user_id, video_url, video_img, date_time, channel_title, video_title, added,
                 deleted):
        self.video_id = video_id
        self.user_id = user_id
        self.video_url = video_url
        self.video_img = video_img
        self.date_time = date_time
        self.channel_title = channel_title
        self.video_title = video_title
        self.added = added
        self.deleted = deleted

def init_db():
    Base.metadata.create_all(bind=engine)

def destroy_db():
    Base.metadata.drop_all(engine)



# ENV = 'dev'
#
# if ENV == 'dev':
#     app.debug = True
#     app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
# else:
#     app.debug = False
#     app.config['SQLALCHEMY_DATABASE_URI'] = ''
#
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# = SQLAlchemy(app)


