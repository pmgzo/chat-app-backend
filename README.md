## Description

This project uses [Nest](https://github.com/nestjs/nest) framework.

This is a backend application of a chat app, front-end is not yet developed.

## Installations

After cloning the repository, install packages

```bash
npm install
```

Then run this scripts which will help you run correctly the server and the tests (to run only once)

```bash
npm run create:envs
```

## Run server

Make sure to run `docker compose up -d` for dev environment

```bash
$ npm run start
```

## Tests

Make sure to run `docker compose` for test:

```bash
$ docker compose --env-file ".env.test" -p chat-app-backend-test up -d
```

### Run test

```bash
## run integration and unit tests
$ npm run test
## run e2e tests
$ npm run test:e2e
```

## Database migration

In case of prisma schema modification 

```bash
$ npx prisma migrate dev --name <name of the commit>
```

If one of your teamates apply changes

```bash
$ npx prisma migrate dev
```

## Miscellaneous

### Dotenv

Usually and especially to run prisma command we should use dotenv command to choose which database to target, for example to apply schema modification on the dev environment we would use:

```bash
npx dotenv -e .env.dev -- npx prisma migrate dev
```
