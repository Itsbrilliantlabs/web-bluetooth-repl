git pull origin dev_server
git checkout origin/dev_server
docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml down
docker volume remove web-bluetooth-repl_static_volume
docker-compose -f docker-compose.prod.yaml up -d
docker system prune --all --force