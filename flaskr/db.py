import sqlite3

import click
from flask import current_app, g
#g is a special object that is unique for each request.
from flask.cli import with_appcontext

def get_db(): #due to g, if this func is called a second time in the same req, the connection
    #is stored and reused.
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row #tells the connection to return rows that behave like dicts

    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

def init_db():
    db = get_db() #establishes connection

    with current_app.open_resource('schema.sql') as f: #opening it as a file (f) relative to flaskr
        #package.
        db.executescript(f.read().decode('utf8'))


@click.command('init-db') #defines a command line command called init-db that calls the init_db
# function (via init_db_command I think)
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database.') #message I think
# function that registers close_db and init_db_command
def init_app(app):
    app.teardown_appcontext(close_db) #tells Flask to call that function when cleaning up after returning the response.
    app.cli.add_command(init_db_command) #adds a new command that can be called with the flask command.