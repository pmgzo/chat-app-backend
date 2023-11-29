# This is a simple script to setup databases for dev and test environment, 
# at the end the user should be able to run test and start the local server

# db for local dev
docker run --name postgres-db -e POSTGRES_PASSWORD=dumbypassword -p 5432:5432 -d postgres
# db for tests
docker run --name postgres-db-test -e POSTGRES_PASSWORD=dumbypassword -p 6000:5432 -d postgres

# create these files for targeting the corresponding database
echo "DATABASE_URL=\"postgresql://postgres:dumbypassword@localhost:5432/postgres\"" > .env.dev
echo "DATABASE_URL=\"postgresql://postgres:dumbypassword@localhost:6000/postgres\"" > .env.test

# push prisma schema to databases
npx dotenv -e .env.dev -- npx prisma db push
npx dotenv -e .env.test -- npx prisma db push

# run this script to create the asymetric keys for handling jwt (we could use a secret instead but this is how it is)
cd ./src/graphql-server/auth/ ; ./generatePemFile.sh
