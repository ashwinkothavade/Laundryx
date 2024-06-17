## use this to build the development image(not multistaged)
docker-dev:
	docker build -t laundrix:v0 -f build/Dockerfile.dev .

## use this to build the production image(lightweight and multistage)
docker-prod:
	docker build -t laundrix:v0 -f build/Dockerfile.prod .

run:
	docker run -it -p 4000:4000 --env-file .env laundrix:v0
