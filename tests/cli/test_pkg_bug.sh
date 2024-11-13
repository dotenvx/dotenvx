cd "$(dirname "$0")"
cd ../../

rm -rf bin
npx pkg . --no-bytecode --public-packages "*" --public --target node20-linuxstatic-x64 --output bin/linux-amd64/dotenvx
cd bin/linux-amd64/
echo "HELLO=Ubuntu" > .env
echo "console.log('Hello ' + process.env.HELLO)" > index.js
RESULT=$(./dotenvx run --quiet -- ./dotenvx run --quiet -- ./dotenvx run --quiet -- node index.js)
rm -rf bin
echo $RESULT
if [ "$RESULT" == "Hello Ubuntu" ]; then
  echo "Test passed"
  exit 0
else
  echo "Test failed"
  exit 1
fi
