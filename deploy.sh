docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml down
docker volume remove webrepl_server_static_volume
docker-compose -f docker-compose.prod.yaml up -d
docker system prune --all --force