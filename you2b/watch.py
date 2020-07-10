# Standard libraries
import json
import os

# OAuth2
import google.oauth2.credentials
import googleapiclient.discovery

# Third-party libraries
from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for, session, jsonify, make_response
)
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from googleapiclient.discovery import build

# Internal imports
from you2b.auth import login_required
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
        # Get credentials from the current session
        credentials = google.oauth2.credentials.Credentials(**session['credentials'])
        
        # Use credentials to build an API client
        youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=credentials)
        
        # New videos to populate page with
        new_videos = collect_videos(youtube)
        
        # After videos are collected, update the last visited time of the user
        User.update_time(current_user.id)
        
        # Collect old videos from the database
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
        return render_template('watch/index.html', new_videos=new_videos, old_videos=old_videos)
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
                maxResults = 15,
                order = "alphabetical",
                pageToken = token
            )
        else:
            find_subs_request = youtube.subscriptions().list(
                part = "snippet",
                mine = True,
                order = "alphabetical",
                maxResults = 15
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
    for cid in subs:
        chan_uploads_request = youtube.channels().list(
            part = "contentDetails",
            id = cid
        )
        chan_uploads_response = chan_uploads_request.execute()
        chan_upload_id = chan_uploads_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # Take latest 30 videos from each channel
        get_uploaded_vids_request = youtube.playlistItems().list(
            part = "snippet",
            playlistId = chan_upload_id,
            maxResults = 30
        )
        get_uploaded_vids_response = get_uploaded_vids_request.execute()
        for video in get_uploaded_vids_response['items']:
            dateTime = video['snippet']['publishedAt'] # FORMAT: "0000-00-00T00:00:00Z" eg "2020-05-25T15:00:34Z"
            
            # Only add the video if it hasn't already been captured on the last visit
            if dateTime > current_user.last_visited:
                thumb = video['snippet']['thumbnails']['medium']
                img = thumb['url']
                id = video['snippet']['resourceId']['videoId']
                link = "https://www.youtube.com/watch?v=" + video['snippet']['resourceId']['videoId']

                videos.append((dateTime, id, link, img))
    
    # Sort and return list of videos.
    videos = sorted(videos, reverse=True)    
    return videos


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

    # res = make_response(jsonify({"message":"JSON received"}),200)
    return video_id