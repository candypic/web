# Gallery (Cloudflare R2) — Setup Checklist

The downloadable gallery lets an admin upload images and publish them; guests
browse and download published images. Files are stored in **Cloudflare R2**
(zero egress fees — ideal for a download-heavy gallery). Metadata lives in
Supabase, and admin access is gated by **Supabase Auth**.

## 1. Cloudflare R2

1. Cloudflare dashboard → **R2** → *Create bucket* (e.g. `candy-pic-gallery`).
2. **Enable public access**: bucket → *Settings* → *Public access* → allow
   `r2.dev` (you'll get a URL like `https://pub-xxxxx.r2.dev`) **or** connect a
   custom domain (recommended, e.g. `images.candypic.com`). This is your
   `R2_PUBLIC_URL`.
3. **Create an API token**: R2 → *Manage API Tokens* → *Create* with
   **Object Read & Write** on this bucket. Save the **Access Key ID** and
   **Secret Access Key**, plus your **Account ID** (R2 overview page).
4. **CORS** (bucket → Settings → CORS policy) — required so the browser can
   PUT (upload) and GET (download) directly:

   ```json
   [
     {
       "AllowedOrigins": ["https://candy-pic.vercel.app", "http://localhost:5173"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## 2. Supabase

### Database
Apply the migration (creates `gallery_images` + RLS):

```bash
supabase db push
```

### Edge function secrets
```bash
supabase secrets set \
  R2_ACCOUNT_ID=xxxxxxxx \
  R2_ACCESS_KEY_ID=xxxxxxxx \
  R2_SECRET_ACCESS_KEY=xxxxxxxx \
  R2_BUCKET=candy-pic-gallery \
  R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Deploy the function
```bash
supabase functions deploy r2-sign
```

### Create the admin user
Supabase dashboard → **Authentication** → *Add user* → set the event manager's
email + password. (Signup via the UI is intentionally not exposed.)

## 3. Frontend env

`.env` only needs the public, browser-safe values (R2 secrets never go here):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev   # optional fallback; the function also returns it
```

## 4. Use it

- **Admin:** visit `/admin/login`, sign in, then `/admin/gallery` to upload,
  publish/unpublish, and delete.
- **Guests:** visit `/gallery` to browse and download published images.
