# DataLineageApp
DataLineage app is a nodejs application and the development language is [Typescript](https://www.typescriptlang.org/ "Typescript") for both frontend and server side.
The logic of this application is based on the artical [Data Integrity and Lineage by using IOTA](http://fenglu.me/2018/04/16/Data-integrity-and-data-lineage-by-using-IOTA/ "Data Integrity and Lineage by using IOTA")

## Live demo
http://datalineage-viewer.azurewebsites.net/

## Technical Detail
The server have two apis:
1. api/address/:address, the parameter ":address" is the address of the package and this api will return the package infromation of the address
1. api/address/:address/all, with this api, the specified package information and all its inputs pacakges infromation will retuned in one array.

The data read from IOTA is depended on the library [mam](https://github.com/l3wi/mam.client.js "mam"), every time when user request the package inforamtion, the server will check it in the memory cache, and if not found, then will call the mam library and save the data in memory, then return it.
As the access to the IOTA nodes is not stable and sometime is really very slow from China, so the server also support to use proxy to speed up the access to the IOTA.
For every 3 minutes, the server will save the memory cache to disk file, so that next time the server running, the cache can be loaded from file to memory.

The source code is under "src" folder.
To build the code, in the root of the project folder ("src" parent folder), run the commands:

`npm install`

`npm run build`

The the webpack will build the code and copy all the required files for the application running to the folder "dist".

To debug in local, run the command:

`npm start`

To debug with watch, run the command:
`npm run start:watch`
this script will start webpack in watch mode and use nodemon to start server, so when there is the client changes, webpack will rebuild and copy the files, when there is the server changes, nodemon will find it, build and restart the server

To Deploy the application, 
1. `npm install` in the root of the project
1. `npm run build`
1. copy the package.json to dist folder
1. go to the dist folder and run `npm install`
1. copy everthing in dist folder and deploy them to the server.
The project is tested with Nodejs 8.11.2

.
