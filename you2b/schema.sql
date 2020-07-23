
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS video;

CREATE TABLE user (
    id TEXT PRIMARY KEY,
    profile_pic TEXT NOT NULL,
    last_visited TEXT,
	added_playlist TEXT
);

CREATE TABLE video (
    user_id TEXT,
    video_id TEXT,
    video_url TEXT,
    video_img TEXT,
    date_time TEXT,
	channel_title TEXT,
	video_title TEXT,
	added INTEGER,  /* 1 for deleted, 0 for not deleted */
    deleted INTEGER /* 1 for deleted, 0 for not deleted */
);