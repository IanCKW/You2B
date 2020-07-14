# Standard libraries
import asyncio
import concurrent.futures
import time
# OAuth2
import google.oauth2.credentials
import googleapiclient.discovery
# Third-party libraries
from flask import (
    Blueprint, render_template, request, session, jsonify, make_response
)
from flask_login import (
    current_user,
)

# Internal imports
from you2b.db import get_db
from .user import User

# API client configuration
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

# Set up blueprint
bp = Blueprint('watch', __name__)

@bp.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('watch/index.html')
    else:
        return (
            '<p>You are not logged in to a YouTube account with a channel.</p>'
            '<p>Please <a class="button" href="/login">log in</a>.</p>'
        )

# Returns the user's videos to place on the page
def collect_videos(youtube):
    def collect_video_page(youtube, token, output): # Recursive helper function to collect all the token pages
        if len(token) > 0:
            find_subs_request = youtube.subscriptions().list(
                part = "snippet",
                mine = True,
                maxResults = 50,
                order = "alphabetical",
                pageToken = token
            )
        else:
            find_subs_request = youtube.subscriptions().list(
                part = "snippet",
                mine = True,
                order = "alphabetical",
                maxResults = 50
            )

        find_subs_response = find_subs_request.execute()
        
        # collect a list of all the channel IDs on this page
        cid_page = [sub['snippet']['resourceId']['channelId'] for sub in find_subs_response['items']]
        
        # and append it to the passed output
        passed_output = output + cid_page
        
        # collect next page token, if any; otherwise, return the channels
        if 'nextPageToken' in find_subs_response:
            nextPage = find_subs_response['nextPageToken']
            return collect_video_page(youtube, nextPage, passed_output)
        else:
            return passed_output
    
    subs = collect_video_page(youtube, "", [])
    
    videos = []

    # For each subscription, find the playlist corresponding to that channel's uploads

    subsIter = ((youtube,current_user.last_visited, cid) for cid in subs) #creating a generator for my get_uploads function that uses multiprocessing
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = executor.map(get_uploads_wrapper,subsIter)
        for result in results:
            videos += result

    # Sort and return list of videos.
    end = time.perf_counter()
    videos = sorted(videos, reverse=True)
    print(len(videos))
    return videos

#wrapper required to pass in multiple parameters into the map function. Can't use lambda
#due to pickling (a compromise of multiprocessing to overcome GIL issues. One condition
# of pickling is that the function must be top level)
def get_uploads_wrapper(p):
    return get_uploads(*p)

#returns an array of all the videos from one channel
def get_uploads(youtube,last_visited, cid):
    videos_of_this_channel = []
    chan_uploads_request = youtube.channels().list(
        part="contentDetails",
        id=cid
    )
    chan_uploads_response = chan_uploads_request.execute()
    chan_upload_id = chan_uploads_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']

    # Take latest 30 videos from each channel
    get_uploaded_vids_request = youtube.playlistItems().list(
        part="snippet",
        playlistId=chan_upload_id,
        maxResults=50
    )
    get_uploaded_vids_response = get_uploaded_vids_request.execute()
    for video in get_uploaded_vids_response['items']:
        dateTime = video['snippet']['publishedAt']  # FORMAT: "0000-00-00T00:00:00Z" eg "2020-05-25T15:00:34Z"
        # Only add the video if it hasn't already been captured on the last visit
        if dateTime > last_visited:
            thumb = video['snippet']['thumbnails']['medium']
            img = thumb['url']
            id = video['snippet']['resourceId']['videoId']
            link = "https://www.youtube.com/watch?v=" + video['snippet']['resourceId']['videoId']
            videos_of_this_channel.append([dateTime, id, link, img])
    return videos_of_this_channel

#creating dictionaries for each vid and storing them in lists by month, with the month as the key of the parent dictionary
def videos_by_month(all_videos):
    start = time.perf_counter()
    current_year_month = all_videos[0][0][0:7]
    final_videos = {}
    current_month = []
    for video in all_videos:
        video_details = {}
        video_details["datetime"] = video[0]
        video_details["id"] = video[1]
        video_details["link"] = video[2]
        video_details["img"] = video[3]

        if video_details["datetime"] > current_year_month:
            current_month.append(video_details)
        else:
            final_videos[current_year_month]=current_month
            current_year_month = video_details["datetime"][0:7]
            current_month = []
            current_month.append(video_details)

    final_videos[current_year_month]=current_month
    return final_videos

def year_month_index(all_videos):
    month_index = {}
    index = 0
    for key in all_videos:
        month_index[index] = key
        index += 1
    return month_index

def index_year_month(all_videos):
    month_index = {}
    index = 0
    for key in all_videos:
        month_index[key] = index
        index += 1
    return month_index

####################################################
########### HANDLING REQUESTS #############
####################################################


@bp.route("/del-vid", methods=["POST"])
def delete_vid():
    req = request.get_json()
    video_id = req["message"]
    db = get_db()
    db.execute(
        "UPDATE video "
        "SET deleted = 1 "
        "WHERE user_id = ? AND video_id = ?", (current_user.id, video_id)
    )
    db.commit()

    # res = make_response(jsonify({"message":"JSON received"}),200)
    return video_id


@bp.route("/undel-vid", methods=["POST"])
def undelete_vid():
    req = request.get_json()
    video_id = req["message"]
    db = get_db()
    db.execute(
        "UPDATE video "
        "SET deleted = 0 "
        "WHERE user_id = ? AND video_id = ?", (current_user.id, video_id)
    )
    db.commit()
    return video_id


@bp.route("/obtain-video-data", methods=["POST", "GET"])
def send_data():
    req = request.get_json()

    # Get credentials from the current session
    credentials = google.oauth2.credentials.Credentials(**session['credentials'])

    # Use credentials to build an API client
    youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=credentials)

    # New videos to populate page with
    new_videos = collect_videos(youtube)

    db = get_db()

    old_videos = db.execute(
        "SELECT date_time, video_id, video_url, video_img FROM video "
        "WHERE user_id = ? AND deleted = 0 "
        "ORDER BY date_time DESC", (current_user.id,)
    ).fetchall()

    for video in new_videos:
        db.execute(
            "INSERT INTO video (user_id, video_id, video_url, video_img, date_time, deleted) "
            "VALUES (?, ?, ?, ?, ?, 0)",
            (current_user.id, video[1], video[2], video[3], video[0])
        )
    db.commit()
    # After videos are collected, update the last visited time of the user
    User.update_time(current_user.id)
    new_user = False
    if current_user.last_visited == "0000-00-00T00:00:00Z":
        new_user = True
    all_videos = videos_by_month(new_videos + old_videos)
    month_by_index = year_month_index(all_videos)
    index_by_month = index_year_month(all_videos)
    print(all_videos)
    res = {
        "new_user":new_user,
        "monthly_data": all_videos,
        "month_by_index" : month_by_index,
        "index_by_month" : index_by_month,
        "user_datetime": current_user.last_visited,
    }
    res = make_response(jsonify(res),200)
    return res



























