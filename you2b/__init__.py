# Python standard libraries
import json
import os
import sqlite3

# Third-party libraries
from flask import Flask, redirect, request, url_for, g
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
import requests

# Internal imports
from .db import init_db_command
from .user import User

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'you2b.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)
    
    # set up user session management
    login_manager = LoginManager()
    login_manager.init_app(app)

    # Flask-Login helper to retrieve user from db
    @login_manager.user_loader
    def load_user(user_id):
        return User.get(user_id)
    
    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    @app.before_request
    def before_request():
        g.user = current_user
    
    from . import db
    db.init_app(app)
    
    from . import auth
    app.register_blueprint(auth.bp)

    from . import watch
    app.register_blueprint(watch.bp)
    app.add_url_rule('/', endpoint='index')
    
    return app