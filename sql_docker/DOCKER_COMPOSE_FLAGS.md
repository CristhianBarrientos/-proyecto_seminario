# Docker Compose — Supabase Self-Hosted

Comandos de referencia para levantar/apagar el stack local de Supabase (Postgres, Auth, Storage, API, Studio, etc.) durante el desarrollo.

## Comandos principales

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `docker compose up -d` | Levanta todo el stack en segundo plano (detached) | La primera vez, o después de un `down` |
| `docker compose down` | Apaga y **elimina** los contenedores — conserva los datos (volúmenes) | Al terminar de trabajar, limpieza ligera |
| `docker compose stop` | **Pausa** los contenedores sin eliminarlos | Al terminar el día (⭐ recomendado) |
| `docker compose start` | Reanuda contenedores pausados con `stop` | Para seguir trabajando tras un `stop` |
| `docker compose ps` | Muestra qué contenedores están corriendo y su estado | Verificar que todo levantó bien |
| `docker compose logs -f <servicio>` | Logs en vivo de un contenedor (ej. `supabase-db`) | Debuggear cuando algo falla |
| `docker compose pull` | Descarga versiones nuevas de las imágenes | Actualizar el stack |
| `docker compose down -v` | Apaga y **borra volúmenes** — ⚠️ pierdes tablas y datos | Solo para reinicio total consciente |

## Flujo diario recomendado

```powershell
# Al empezar a trabajar
docker compose start

# ...trabajas normal...

# Al terminar el día
docker compose stop
```

`stop` / `start` es más rápido que `down` / `up -d` porque no destruye ni recrea los contenedores desde cero — solo los pausa y reanuda.

## Notas importantes

- Los datos (tablas, filas, esquema) viven en un **volumen con nombre**. Sobreviven a `stop`, `start` y `down` (sin `-v`).
- Solo `docker compose down -v` borra los datos. Úsalo únicamente si quieres reiniciar todo desde cero a propósito.
- Las imágenes descargadas (~1-2 GB para el stack completo de Supabase) se quedan en disco aunque los contenedores estén apagados. Es normal — evitarlo implica re-descargar todo cada vez.
