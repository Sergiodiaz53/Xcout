# Xcout README
## About
### Authors
- Sergio Díaz del Pino 
- Pablo Rodríguez Brazzarola
- Marcos Sepúlveda Romero

### Team
Bitlab Group

### Description
Interactive visualization based on heatmaps to preview a large amount of chromosome and annotation comparisons.

---

# Installation 
## Requirements
Python 3 & Bower (Virtualenv is recommended)

## Configuration
Get project from GitHub and Python virtualenv
* `git clone https://github.com/Sergiodiaz53/Xcout.git`
* `sudo apt-get install python3 npm virtualenv`
* `virtualenv -p python3 Xcout`
* `npm -g install bower`

To activate new virtualenv
* `source bin/activate`

Database config (PostgreSQL)
* `sudo apt-get install postgresql postgresql-contrib`
* `sudo -u postgres createuser xcoutdjango`
* `sudo -u postgres createdb xcoutdb`
* `sudo -u postgres psql`
* `alter user xcoutdjango with encrypted password 'bitlab2310';`
* `grant all privileges on database xcoutdb to xcoutdjango;`
*  Use `Ctrl+D` or `\q` to exit the console

Install requirements.txt
* `pip install -r requirements.txt`

Install bower components
* `cd static`
* `bower install`
* `cd ..`

Setup Django
* `python manage.py makemigrations`
* `python manage.py migrate`
* `python manage.py createsuperuser`

Run Xcout
* `python manage.py runserver_plus`

### Database config for Xcout: 

        'NAME': 'xcoutdb',
        'USER': 'xcoutdjango',
        'PASSWORD': 'bitlab2310',
        'HOST': 'localhost',