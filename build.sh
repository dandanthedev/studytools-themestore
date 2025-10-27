#get URL from env
if [ -z "$SITE_URL" ]; then
    echo "No SITE_URL env var found"
    exit 1
fi
URL=$SITE_URL
npx @convex-dev/auth --web-server-url $URL
npx convex deploy
npm run build