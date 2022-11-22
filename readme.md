

## wymagane:
```
apt-get install libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libgbm-dev
```

# node

```
nvm use 14
node app.js
```

## parametry

```
categories - pobieranie kategorii
products - pobieranie produktów z kategorii
delay=1 - przerwa 1s
debug
images - wymagane z którąź z następnych opcji
ip - pobieranie zdjęć produktów
ic - pobieranie zdjęć kategorii
```
## pobieranie kategorii

```
node app.js categories delay=1
```
## pobieranie produktów

```
node app.js products delay=1
```
## pobieranie zdjęć produktów z przerwą 1s

```
node app.js images delay=1 ip
// i kategorii
node app.js images delay=1 ic ip
```
