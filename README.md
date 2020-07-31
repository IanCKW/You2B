# You2B
Guanchanamobae's orbital project

Live website:(UPDATE: on 2nd Aug 2020, app will be disabled as we have exceeded the free database quota on Heroku) https://you2bflaskapp.herokuapp.com/

Project details: https://docs.google.com/document/d/1rfnQy6djHDkmOGE9DHQAah7-P613Gzr22gHXo0P1y0k/edit?usp=sharing

Demo video: https://www.youtube.com/watch?v=RHIHxSUPssg

### Quickstart

1) Clone the repo to your own directory
2) Set up a virtual python env
Instructions: https://flask.palletsprojects.com/en/1.1.x/installation/
3) Download all the packages in requirements.txt :
pip install -r requirements.txt 

4) Download Postgres and set up a database
Instructions: https://www.youtube.com/watch?v=fZQI7nBu32M

5) In you2b/databases.py, assign your Postgresql database as DATABASE_URL = "database"
https://www.learndatasci.com/tutorials/using-databases-python-postgres-sqlalchemy-and-alembic/

6) To initiate the database: 
$python3
>> from you2b/databases.py import init_db

>> init_db 

>> exit()

7) Access you2b/auth.py. At line 56, assign flow.redirect_uri = your own local host.
eg. https://127.0.0.1:5000/ 
Note: the google authorisation only authorises for our heroku domain and https://127.0.0.1:5000/, if you use a different host, see below.
$flask run

8) Running

$ export FLASK_APP=you2b

$ export FLASK_ENV=development

$ flask run


### Google authorisation.

If you want to use a different local host, go to google developer console.

In APIs and services, click library, search for Youtube V3 and click enable

Click on Oauth consent screen, add a name and click on the "add scope" button. Add ../auth/youtube.force-ssl

Save

Click on credentials, click +credentials, add API key.

Click +credentials again, add Oauth client ID. Add your local host into URIs field and local-host/login/callback into the Authorised redirect URIs.

In credentials page, download the Oauth client ID (there is a small down arrow download button all the way at the right)

Back in the repo, go to you2b/auth.py

add the downloaded credential file into you2B folder

Change the following in auth.py

>> SECRET_FILE_NAME = name of the downloaded credential

>> CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__), SECRET_FILE_NAME)


