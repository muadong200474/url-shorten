# This is about shorten url

## Run Docker in root folder

```bash
docker-compose down -v
docker-compose up -d
```

## Localhost

Management
http://localhost:8081

Redirection
http://localhost:8082

## Testing

1. Create short url

```bash
curl -d '{"realUrl":"https://google.com"}' -H 'Content-Type: application/json' http://localhost:8081/
```

2. Delete short url

```bash
curl -X DELETE http://localhost:8081/1
```
