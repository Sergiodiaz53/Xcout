# README 
## Author: Sergio Díaz del Pino & Pablo Rodríguez Brazzarola
## Team: Bitlab Group
## Description: Interactive visualization based on heatmaps to preview a large amount of chromosome comparisons.

Requirements: Python 3 & Bower (Virtualenv is recommended)

* `git clone https://github.com/Sergiodiaz53/Xcout.git`
* `sudo apt-get install python3 npm virtualenv`
* `virtualenv -p python3 Xcout`
* `npm -g install bower`

- Activate virtualenv
* `cd Xcout`
* `source bin/activate`

- Install Postgres (See below database config)
* `sudo apt-get install postgresql postgresql-contrib`
* `sudo -u postgres createuser xcoutdjango`
* `sudo -u postgres createdb xcoutdb`
* `sudo -u postgres psql`
* `alter user xcoutdjango with encrypted password 'bitlab2310';`
* `grant all privileges on database xcoutdb to xcoutdjango;`
* Exit with Ctrl+D

- Install requirements.txt
* `pip install -r requirements.txt`

- Install bower components (bower install)
* `cd static`
* `bower install`

- Setup Django
* `python manage.py makemigrations`
* `python manage.py migrate`
* `python manage.py createsuperuser`

- Run Xcout (python manage.py runserver_plus)
* `python manage.py runserver_plus`

## Database config for Xcout: 

        'NAME': 'xcoutdb',
        'USER': 'xcoutdjango',
        'PASSWORD': 'bitlab2310',
        'HOST': 'localhost',
