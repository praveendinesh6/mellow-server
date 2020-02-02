# mellow-server

## Setup environment

Create a `.env` file and add the following keys

```
SECRET_WORD=pleaseDontHackMe3248
TOKEN_EXPIRY=1d
```

## Run Server

```
$ docker-compose up -d
$ npm run dev
```

## VS Code launch config

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/nodemon",
      "cwd": "${workspaceFolder}",
      "args": ["index.js"]
    }
  ]
}
```
