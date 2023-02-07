docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml down
docker volume remove webrepl_static
docker-compose -f docker-compose.prod.yaml up -d
docker system prune --all --force