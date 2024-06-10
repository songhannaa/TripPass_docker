build:
	docker build -t docker_trippass .
run:
	docker run -it -d -p 8000:8000 --name trippass-app --env-file .env songhanna/docker_trippass
exec:
	docker exec -it trippass-app /bin/bash
start:
	docker start trippass-app
stop:
	docker stop trippass-app
logs:
	docker logs trippass-app
ps:
	docker ps -a
img:
	docker images
rm:
	docker rm -f $$(docker ps -aq)
rmi:
	docker rmi -f $$(docker images -q)