# Deployment Guide for Resume Matcher 🚀

Ushbu loyihani internetga chiqarish uchun quyidagi qadamlarni bajaring.

## 1. Backend Deployment (FastAPI)

Tavsiya etiladigan platforma: **Render**, **Railway** yoki **DigitalOcean App Platform**.

### Render.com orqali

1. GitHub reponi bog'lang.
2. New Web Service oching.
3. Path: `backend`
4. Runtime: `Python` (yoki `Docker` biz yaratgan Dockerfile bilan).
5. Agar Python ishlatsangiz:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
6. **Environment Variables**:
   - `GEMINI_API_KEY`: Google AI kalitingiz.
   - `JWT_SECRET_KEY`: Tasodifiy uzun qator (masalan: `openssl rand -hex 32`).
   - `DATABASE_URL`: Agar PostgreSQL ishlatsangiz (Render buni tekinga beradi).

## 2. Frontend Deployment (React/Vite)

Tavsiya etiladigan platforma: **Vercel** yoki **Netlify**.

### Vercel orqali

1. GitHub reponi bog'lang.
2. New Project qo'shing.
3. Root Directory: `frontend`
4. Build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: Backend-ning internetdagi manzili (masalan: `https://sizning-backend.onrender.com`).

## 3. Ma'lumotlar bazasi (Production)

SQLite productionda (Renderda) fayllar o'chib ketishiga sabab bo'lishi mumkin.
Doimiy saqlash uchun:

- Renderda "Disk" ulab qo'ying (faqat pullik planda).
- Yoki tekin **PostgreSQL** bazasini oching va `DATABASE_URL` ni backendga ulab qo'ying.

## 4. Docker (Universal usul)

Agar serveringizda Docker bo'lsa:

```bash
cd backend
docker build -t resume-matcher-backend .
docker run -p 8000:8000 resume-matcher-backend
```

Omad! 🚀
