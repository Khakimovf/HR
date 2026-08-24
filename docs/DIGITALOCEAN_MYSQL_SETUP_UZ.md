# DigitalOcean da MySQL bazasini yaratish (HR loyihasi uchun)

Hozir loyiha **Prisma + SQLite (local)** da ishlaydi.  
Ishlab chiqarish (production) uchun **DigitalOcean Managed Database — MySQL** ochish tavsiya etiladi.

**Muhim:** Prisma o‘chirilmaydi. DigitalOcean — faqat ma’lumot saqlanadigan server. Prisma sxemasi deyarli o‘zgarishsiz MySQL ga o‘tkaziladi.

---

## 1. Hisob ochish (Sign Up)

1. https://www.digitalocean.com saytiga kiring  
2. **Sign Up** tugmasini bosing  
3. GitHub / Google / email orqali ro‘yxatdan o‘ting  
4. To‘lov kartasini bog‘lang (Managed Database pullik — bepul tarif deyarli yo‘q)  
5. Kirgandan keyin **Control Panel** ochiladi  

---

## 2. Managed Database yaratish

1. Chap menyudan **Databases** ni tanlang  
2. **Create Database Cluster** ni bosing  
3. Quyidagicha sozlang:

| Maydon | Tavsiya (shu HR loyihasi uchun) |
|--------|----------------------------------|
| **Engine** | **MySQL 8** |
| **Datacenter** | Jamoa/kompaniyaga yaqin region (masalan: Frankfurt `fra1`, Singapore `sgp1`) |
| **Plan** | Boshida **Basic / ~$15 oyiga** (1GB RAM) yetarli |
| **Cluster name** | masalan: `hr-mysql` |
| **Project** | Default yoki yangi `HR` project |

4. **Create Database Cluster** ni bosing  
5. Tayyor bo‘lishini **bir necha daqiqa** kuting (Provisioning)

---

## 3. Yaratilgandan keyin olinadigan ma’lumotlar

Database sahifasida **Connection Details** bo‘limidan:

| Maydon | Vazifasi |
|--------|----------|
| **host** | `db-....db.ondigitalocean.com` |
| **port** | odatda `25060` |
| **username** | `doadmin` (standart) |
| **password** | yaratilgan parol (nusxa oling!) |
| **database** | `defaultdb` (keyin `hr_db` yaratish mumkin) |
| **SSL** | **Required** (majburiy) |

Prisma uchun `.env` formati:

```env
DATABASE_URL="mysql://doadmin:PAROL@HOST:25060/defaultdb?ssl-mode=REQUIRED"
AUTH_SECRET="uzun-tasodifiy-maxfiy-kalit"
```

---

## 4. Xavfsizlik sozlamalari (muhim)

1. Database → **Settings** → **Trusted Sources**  
2. Faqat ruxsat beriladigan manbalarni qo‘shing:
   - Hozirgi kompyuteringiz **public IP** (localdan Prisma ulash uchun)
   - Keyinchalik app joylashadigan server/platforma IP (Vercel, Droplet va h.k.)

Agar IP Trusted Sources da bo‘lmasa — **ulanish ishlamaydi**.

---

## 5. (Ixtiyoriy) Yangi database nomi yaratish

Control Panel SQL console yoki local client orqali:

```sql
CREATE DATABASE hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Keyin `DATABASE_URL` ichidagi database nomini `hr_db` qilib o‘zgartiring.

---

## 6. Loyihaga ulash (hisob ochilgandan keyin)

1. `.env` ga `DATABASE_URL` qo‘shing  
2. `prisma/schema.prisma` da:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

3. Buyruqlarni ishga tushiring:

```bash
npx prisma generate
npx prisma db push
```

Natija: DigitalOcean MySQL da hozirgi Prisma sxemasidagi **barcha jadvallar** (Department, Employee, User...) yaratiladi.

---

## 7. Narx va tanlov bo‘yicha maslahat

| Holat | Tavsiya |
|-------|---------|
| Test / kichik HR tizimi | MySQL Basic 1GB (~$15/oy) |
| PostgreSQL ishlatsa bo‘ladimi? | Ha, lekin hozirgi reja **MySQL** ga moslangan |
| Faqat Droplet olib MySQL o‘zingiz o‘rnatasizmi? | Mumkin, lekin backup/boshqaruv qiyinroq → **Managed DB** yaxshiroq |

---

## 8. Ro‘yxatdan o‘tish checklist

- [ ] DigitalOcean da hisob ochish + karta bog‘lash  
- [ ] **Databases → Create → MySQL 8**  
- [ ] Connection ma’lumotlarini saqlash  
- [ ] **Trusted Sources** ga o‘z IP ni qo‘shish  
- [ ] `DATABASE_URL` ni tayyorlash  
- [ ] (Keyingi qadam) Prisma ni MySQL ga ulash  

---

## 9. Qisqa xulosa

| Savol | Javob |
|-------|-------|
| Nima ochiladi? | DigitalOcean **Managed MySQL** |
| Prisma qoladimi? | Ha — faqat ulanish manzili o‘zgaradi |
| Local SQLite nima bo‘ladi? | Development uchun qolishi mumkin; production MySQL ga o‘tadi |
| Excel ma’lumotlari? | Keyin import (tuzilma → xodimlar) |

**Bir jumla:** DigitalOcean da ro‘yxatdan o‘ting → **Managed Database MySQL** yarating → Connection URL ni Prisma `DATABASE_URL` ga qo‘ying.

---

## Tegishli hujjatlar

- `docs/DATABASE_TABLES_UZ.md` — jadvallar tavsifi  
- `docs/EXCEL_TO_DB_MIGRATION_PLAN_UZ.md` — Excel → DB ko‘chirish rejasi  
