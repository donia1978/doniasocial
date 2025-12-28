# DONIA - OVH Quickstart (Docker)

## 1) Build & run on OVH VPS
- Install Docker + Docker Compose plugin
- Copy repo to server
- From repo root:
  - cd deploy
  - docker compose up -d --build

Web will be on: http://YOUR_SERVER_IP:8080

## 2) Recommended hardening
- Put Cloudflare / reverse proxy with TLS (or install certbot + nginx on host)
- Restrict /api/ai/deepseek origin + rate-limit
- Do not store PHI in logs
- Keep Supabase secrets off the repo (.env only on server)
