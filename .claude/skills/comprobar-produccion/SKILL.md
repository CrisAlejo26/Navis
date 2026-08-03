---
name: comprobar-produccion
description: Comprueba que Navis está bien en el servidor. Úsala cuando pregunten si la aplicación está funcionando, si se ha caído, "mira producción", "está arriba?", "revisa el servidor", "por qué no carga", "qué versión hay desplegada", o después de un despliegue para confirmar que ha ido bien.
---

# Comprobar el despliegue

El circuito completo, de fuera hacia dentro. Empieza por arriba: si el primer
paso va bien, la mayoría de los siguientes también.

## 1. Desde fuera, que es como lo ve quien lo usa

```bash
B=https://<dominio>          # el que esté en BETTER_AUTH_URL del .env del servidor

curl -sI "$B/"               # la PWA
curl -s  "$B/health"         # la API y su base de datos
curl -sI "$B/manifest.webmanifest"
```

Cómo leer lo que salga:

| Respuesta                             | Qué significa                                           |
| ------------------------------------- | ------------------------------------------------------- |
| `200` y `/health` con `"status":"ok"` | Todo bien                                               |
| **503** con la página de espera       | Los contenedores no están arriba. Ve al paso 2          |
| **502**                               | nginx está, pero nadie escucha detrás. Contenedor caído |
| **404** en `/`                        | El vhost no apunta a donde debe                         |
| Falla el TLS                          | Certificado caducado: `certbot renew`                   |

`/api/docs` responde **404 a propósito**: Swagger se apaga en producción. No es
un fallo.

## 2. Los contenedores

```bash
ssh <servidor>
cd <carpeta-de-despliegue>
docker compose -f docker-compose.prod.yml --profile ai ps
docker compose -f docker-compose.prod.yml logs --tail 50 api
```

Los cuatro (`postgres`, `api`, `web`, `ai`) deben salir `healthy`. Si `api`
reinicia en bucle, casi siempre es el `.env`: falta una variable y zod tumba el
proceso al arrancar, con el nombre de la variable en el log.

## 3. El circuito de autenticación

```bash
curl -sI "$B/api/v1/me/profile"        # 401 sin sesión: correcto
curl -s -c /tmp/c.txt -X POST "$B/api/auth/sign-in/email" \
  -H 'content-type: application/json' -d '{"email":"...","password":"..."}'
curl -s -b /tmp/c.txt "$B/api/v1/me/profile"
```

## 4. La IA

```bash
curl -s -b /tmp/c.txt "$B/api/v1/ai/status"
```

Devuelve `enabled`, `provider` y `model`. Que `/api/v1/ai/complete` conteste
**503 «El servicio de IA respondió 501»** es lo esperado hoy: el circuito está
conectado y el microservicio Python todavía no genera texto.

## 5. Qué versión hay

```bash
cd <carpeta-de-despliegue> && git log --oneline -1
cat .deployed-tag 2>/dev/null      # si se desplegó con el workflow
```

## Al terminar

Di lo que has comprobado y lo que no, con la salida real. Si algo falla, cita
el log concreto antes de proponer un arreglo, y **no reinicies nada en
producción sin preguntar**.

Los detalles del servidor y los secretos que hacen falta están en
`docs/DESPLIEGUE.md`.
