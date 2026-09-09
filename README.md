# Crypto Solution — CMPE 195F senior project

A React dashboard for Bitcoin, Ethereum, and Litecoin exchange prices, charts, and personal favorites.

## Local setup

Use Node 24 LTS (24.15 or newer; see `.nvmrc`).

```sh
npm ci --ignore-scripts
npm start
```

Open http://127.0.0.1:3000 . Run `npm test`, `npm run build`, and `npm audit` to verify the app. Production files are emitted to `dist/`.

See [local run instructions](docs/LOCAL-RUN.md) for using a cached Node 24 without changing system Node. See [security review](docs/SECURITY-REVIEW.md) for the original audit, dependency remediation, and remaining application-level issues.

**This checkout contains only the frontend.** Account, favorite, and comment features need the missing Node backend and MySQL schema referenced below. The dashboard can be browsed locally without them; unavailable comments display a status message.

## Archived 2021 instructions

These historical instructions refer to files not present in this checkout. Use the setup above for the frontend.

* you can find the code under *master* branch
## frontend installation guide (Windows):
* save the code to you local storage
* open '...\react_frontend' directory in CMD
* run `npm install` to install the node_modules
* after install complete, run `npm start` to start the frontend

## backend installation guide (Windows):
* save the code to you local storage
* make sure you have [node](https://nodejs.org/en/download/) enviroment installed in your computer
* open '...\node_backend' directory in CMD
* run `node app.js` to start the backend

## database intallation guide (Windows):
* install [mySQL](https://dev.mysql.com/downloads/file/?id=502540) enviroment
* run `net start mysql` in CMD to initial local mySQL server, log in to local mySQL server by `mysql -u root -p`, your username and password should be all "root" as you configured in mysql installation
* install Navicat Premium database GUI (you can use the installation package I provided in this git repo)
* open Navicat and create a new mySQL connection, use "root" for both username and password
* right click the mySQL connection you just create, create a new mySQL databass, name it "btb" and chose "utf8 -- UTF8 Unicode" for Character encoding
* now right click the btb database, and "run SQL file", you can find the SQL configuration file "btb.sql" in this repo
* after import the database, right click database and refresh it, then you can view them under the "list"

## Now, you should be seeing a functional Web Application in front of you.
