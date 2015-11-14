npm run clean
npm run build
cd dist
git init
git commit --allow-empty -m 'publish gh-pages'
git checkout -b gh-pages
touch .nojekyll
git add .
git commit -am 'publish gh-pages'
git push git@github.com:namuol/patturn gh-pages --force