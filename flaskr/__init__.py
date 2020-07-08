import os

from flask import Flask


def create_app(test_config=None): #test config is for testing
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True) #name is the name of the current python module
    #configuration files are relative to the instance folder - outside flaskr package and can hold local data that
    #wont be commited to git
    app.config.from_mapping( #some configurations that will be used
        SECRET_KEY='dev', #????? what does it mean to keep it safe ?????
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'), #path to database
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)
        #This is so the tests you’ll write later in the tutorial can be configured independently
        # of any development values you have configured.

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path) #the func ensures that a path to the instance folder exists.
        #instance folder will contain the database
    except OSError:
        pass

    @app.route('/hello') #creates a connection between url/hello and a func that returns a response
    #route is a decorator that registers a view function for a given url rule.
    #actually route is a decorate factory that returns a decorator
    def hello():
        return 'Hello, World!'

    from . import db
    db.init_app(app)

    from . import auth
    app.register_blueprint(auth.bp)

    from . import blog
    app.register_blueprint(blog.bp)
    app.add_url_rule('/', endpoint='index')

    return app