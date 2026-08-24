# Excel → DB: Ma’lumotlarni bazaga ko‘chirish rejasi

Kompaniyada hozir **Excel** orqali yuritilayotgan ma’lumotlarni **ma’lumotlar bazasiga (DB)** o‘tkazish bo‘yicha tushuntirish.

Maqsad: Excelni DB o‘rnida ishlatishni to‘xtatib, barcha asosiy ma’lumotni **Prisma sxemasi** dagi jadvallarga joylash.

---

## Qaysi Excel fayllar?

| Fayl | Nima bor? | Qayerga o‘tadi? |
|------|-----------|-----------------|
| `Кудратга структура буйича.xlsx` | Tashkiliy tuzilma: **68 ta bo‘lim**, **290 ta lavozim**, jami **1375** shtat | `Department` + `Position` |
| `employees.xlsx` | Xodimlar ro‘yxati, ta’til, intizom, guvohnoma va h.k. | `Employee` va bog‘langan jadvallar |

**Muhim:** Yangi katta jadvallar yaratish shart emas. Loyihada allaqachon kerakli jadvallar bor (`prisma/schema.prisma`).

---

## 1. Nima uchun Excelni to‘g‘ridan-to‘g‘ri DB qilib bo‘lmaydi?

1. Excel — **keng jadval** (ko‘p ustun bir qatorda).
2. Sarlavhalar **2 qatorli / birlashtirilgan** — DB uchun noqulay.
3. Bitta qatorda xodim + ta’til + intizom + sertifikat aralashgan.
4. DB da esa har bir mavzu **alohida jadval** bo‘lishi kerak (normallashtirish).

Shuning uchun Excel → **tozalangan format** → keyin DB.

---

## 2. Ko‘chirish tartibi (majburiy)

Avval tuzilma, keyin xodimlar:

```
1-qadam: Department   (bo‘limlar)
2-qadam: Position     (lavozimlar — bo‘limga bog‘lanadi)
3-qadam: Employee     (xodimlar — bo‘lim/lavozimga bog‘lanadi)
4-qadam: Qo‘shimchalar
         Education, LeaveAttendance, PermitLicense,
         DisciplinaryAction, RewardFinancialAid ...
```

Sabab: xodim jadvali bo‘limga bog‘liq. Bo‘lim bo‘lmasa, xodimni to‘g‘ri saqlab bo‘lmaydi.

---

## 3. Tuzilma Excel → `Department` va `Position`

### Excel qanday tuzilgan?

| A ustun | B ustun | C ustun |
|---------|---------|---------|
| Bo‘lim nomi (sarlavha) | bo‘sh | Bo‘lim umumiy shtati |
| 1, 2, 3... | Lavozim nomi | Shu lavozim kvotasi |

**Misollar:**
- `Direksiya` | *(bo‘sh)* | `2` → bu **bo‘lim**
- `1` | `Bosh direktor` | `1` → bu **lavozim**

### DB ga qanday yoziladi?

#### Jadval: `Department` (Bo‘lim)

| Exceldan | DB ustuni | Misol |
|----------|-----------|-------|
| Bo‘lim nomi | `name` | Xodimlar bilan ishlash boʻlimi |
| Avtomatik kod | `code` | DEPT-01, DEPT-HR |
| C ustundagi jami | `staffLimit` | 9 |
| Ierarxiya (ixtiyoriy) | `parentId` | boshqarma → ichki bo‘lim |

#### Jadval: `Position` (Lavozim)

| Exceldan | DB ustuni | Misol |
|----------|-----------|-------|
| Lavozim nomi (B) | `title` | Boʻlim boshligʻi |
| Qaysi bo‘lim | `departmentId` | Department ning id si |
| Kvota (C) | `quotaLimit` | 1, 2, 13 |

### Import uchun JSON misoli

```json
{
  "departments": [
    {
      "name": "Xodimlar bilan ishlash boʻlimi",
      "code": "DEPT-HR",
      "staffLimit": 9,
      "parentName": null,
      "positions": [
        { "title": "Boʻlim boshligʻi", "quotaLimit": 1 },
        { "title": "Mutaxassis (kadrlar boʻyicha)", "quotaLimit": 2 }
      ]
    }
  ]
}
```

**API (mavjud):**
- Bo‘limlar: `POST /api/departments/import`
- Lavozimlar uchun alohida ommaviy import qo‘shish tavsiya etiladi

---

## 4. Xodimlar Excel → `Employee` va boshqa jadvallar

### Excel maydonlari qayerga ketadi?

| Exceldagi maydonlar | Ma’nosi | DB jadvali |
|---------------------|---------|------------|
| FIO, Lavozim, jinsi, tabel raqami | Asosiy ma’lumot | `Employee` |
| tugʻilgan sana, ishga kirgan sana | Sanalar | `Employee` |
| staj | Ish staji | Saqlanmaydi — `hireDate` dan hisoblanadi |
| statistik toifa (B / M / T / X) | Statistik toifa | `Employee` (yangi maydon qo‘shish mumkin) |
| maʼlumot, oʻquv muassasi, yoʻnalish | Ta’lim | `Education` |
| xarbiy guvoxnoma | Harbiy guvohnoma | `Employee.militaryCertificate` |
| m/t, b/s, b/l, admin, oʻqish, armiya, otgul, progul, ruxsatnoma | Ta’til / davomat | `LeaveAttendance` |
| intizomiy chora | Intizom | `DisciplinaryAction` |
| ragʻbatlantirish | Mukofot | `RewardFinancialAid` |
| sertifikatlar | Sertifikat | `PermitLicense` yoki alohida |
| guvoxnoma, haydovchilik | Guvohnomalar | `PermitLicense` |
| Adres | Manzil | `Employee.address` |
| Bo‘lim nomi | Qayerda ishlaydi | `Employee.currentDepartmentId` |

### Xodimlar uchun “tozalangan” ustunlar

Importdan oldin Excelni shunday formatga keltirish kerak:

```text
tabelNumber | lastName | firstName | middleName | gender | dateOfBirth | hireDate
departmentName | position | statisticalCategory | address | militaryCertificate
educationLevel | institutionName | fieldOfStudy
```

### JSON misoli

```json
{
  "employees": [
    {
      "tabelNumber": "0516",
      "lastName": "MADRAXIMOVA",
      "firstName": "NASIBAXON",
      "middleName": "SAIBJANOVNA",
      "gender": "FEMALE",
      "dateOfBirth": "1987-04-15",
      "hireDate": "2008-08-01",
      "departmentName": "Xodimlar bilan ishlash boʻlimi",
      "position": "Boʻlim boshligʻi",
      "statisticalCategory": "B",
      "address": "Oltinko'l tuman ..."
    }
  ]
}
```

**API (mavjud):** `POST /api/employees/import`  
Hozircha asosiy maydonlar qo‘llab-quvvatlanadi. Ta’til / intizom / guvohnoma uchun qo‘shimcha import kerak bo‘lishi mumkin.

### Excel sanalari

Excelda sana ba’zan raqam ko‘rinishida turadi (`31870`, `39686`...).  
Bu **Excel serial sana** — uni oddiy sanaga aylantirish shart  
(masalan: `1899-12-30` + shu kunlar soni).

---

## 5. Sxemaga qo‘shish mumkin bo‘lgan narsalar

| Excelda bor | Nima qilish kerak? |
|-------------|--------------------|
| statistik toifa | `Employee.statisticalCategory` maydonini qo‘shish |
| staj | DB ga yozmaslik — ishga kirgan sanadan hisoblash |
| sertifikatlar | `PermitLicense` yoki alohida sertifikat jadvali |

**Yangi asosiy jadvallar shart emas.**  
Mavjud `Department`, `Position`, `Employee`, `LeaveAttendance` Excel o‘rnini bosadi.

---

## 6. Yakuniy xarita

```
Кудратга структура буйича.xlsx
   │
   ├─→ Department   (68 ta bo‘lim)
   └─→ Position     (290 ta lavozim)

employees.xlsx
   │
   ├─→ Employee
   ├─→ Education
   ├─→ LeaveAttendance
   ├─→ DisciplinaryAction
   ├─→ RewardFinancialAid
   └─→ PermitLicense
```

### Ma’lumot qayerda saqlanadi?

| Muhit | Qayerda |
|-------|---------|
| Local (ishlab chiqish) | `prisma/dev.db` (SQLite) |
| Production | DigitalOcean **MySQL** (xuddi shu sxema) |

Excel fayllar `docs/` papkasida qoladi.  
Ular DB emas — faqat **import** uchun manba.

---

## 7. Amaliy ish ketma-ketligi

1. Tuzilma Excelni o‘qib → `Department` + `Position` yuklash  
2. Xodimlar Excelini tozalangan formatga o‘tkazish  
3. `Employee` yuklash (`tabelNumber` — unique kalit)  
4. Ta’til / intizom / guvohnoma — faqat ma’lumot bo‘lsa yozish  
5. Import Hub orqali tekshirish (`/api/departments/import`, `/api/employees/import`)

---

## 8. Nima qilmaslik kerak?

- Barcha Excel ustunlarini **bitta ulkan jadval** qilib saqlash  
- Har bir bo‘lim uchun alohida jadval yaratish  
- `Jami`, `ayol/erkak`, `staj` kabi **hisoblangan** qiymatlarni DB ga yozish  
  → ular so‘rov vaqtida hisoblanadi  

---

## 9. Qisqa savol–javob

| Savol | Javob |
|-------|-------|
| Qanday format kerak? | Normallashtirilgan JSON / CSV → Prisma modellari |
| Qayerga yoziladi? | `Department`, `Position`, `Employee` va bog‘langan jadvallar |
| Yangi jadval kerakmi? | Deyarli yo‘q |
| Qaysi tartib? | Bo‘lim → Lavozim → Xodim → Qo‘shimcha tarix |
| Prisma o‘chiriladimi? | Yo‘q. DigitalOcean MySQL ga ulanadi |

---

## 10. Prisma va DigitalOcean

- **Prisma** — jadval sxemasi va kod (qoladi)  
- **DigitalOcean** — MySQL server (ma’lumot saqlanadigan joy)  

Sxema DigitalOcean ga o‘tkazilganda deyarli o‘zgarmaydi.  
Faqat `provider = "mysql"` va `DATABASE_URL` o‘zgartiriladi.

Batafsil: `docs/DIGITALOCEAN_MYSQL_SETUP_UZ.md`

---

**Xulosa:** Excel — vaqtinchalik manba. Asosiy boshqaruv DB da bo‘ladi.  
Avval **tuzilma**, keyin **xodimlar**, so‘ng **tarixiy yozuvlar** yuklanadi.
