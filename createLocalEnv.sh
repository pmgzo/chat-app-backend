# This is a simple script to setup databases for dev and test environment, 
# at the end the user should be able to run test and start the local server

# create these files for targeting the corresponding database
echo "DATABASE_URL=\"postgresql://postgres:dumbypassword@localhost:5432/postgres\"\nREDIS_PORT=6379" > .env.dev
echo "DATABASE_URL=\"postgresql://postgres:dumbypassword@localhost:6000/postgres\"\nREDIS_PORT=7002\nCOMPOSE_FILE=compose-test.yml" > .env.test

# db for local dev
docker compose up -d
# db for tests
docker compose --env-file ".env.test" -p chat-app-backend-test up -d

# push prisma schema to databases
npx dotenv -e .env.dev -- npx prisma db push
npx dotenv -e .env.test -- npx prisma db push

# run this script to create the asymetric keys for handling jwt (we could use a secret instead but this is how it is)
cd ./.rsafiles/ ; ./generatePemFile.sh
