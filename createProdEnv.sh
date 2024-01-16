# setup services for prod env
docker compose up --env-file ".env" -p chat-app-backedn-prod -d

# push prisma schema to databases
npx dotenv -e .env -- npx prisma db push

# run this script to create the asymetric keys for handling jwt (we could use a secret instead but this is how it is)
cd ./.rsafiles/ ; ./generatePemFile.sh
