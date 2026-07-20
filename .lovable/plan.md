## Avasya Kurumsal İzin Yönetim & Ortak Takvim Uygulaması

Microsoft Teams takvimi şıklığında, Avasya kurumsal kimliğine uygun (koyu lacivert / beyaz / soft gri + Avasya kırmızı vurgu) bir izin yönetim sistemi. Tüm veriler Lovable Cloud üzerinde kalıcı.

### 1. Backend (Lovable Cloud)

**Tablolar:**
- `profiles` — `id (auth.users FK)`, `ad_soyad`, `email`, `departman`, `toplam_yillik_izin (default 14)`, `kalan_izin_gunu`
- `user_roles` — `user_id`, `role enum('calisan','yonetici')` (güvenlik için ayrı tablo, `has_role()` security definer fonksiyonu)
- `leave_requests` — `id`, `user_id`, `baslangic_tarihi`, `bitis_tarihi`, `izin_turu enum`, `toplam_gun`, `aciklama`, `durum enum('beklemede','onaylandi','reddedildi')`, `red_nedeni`, `onaylayan_id`, `created_at`
- `holidays` — Türkiye resmi tatilleri (gün hesabında hariç tutulur)

**RLS:**
- Profiller: herkes okuyabilir (takvim için), sadece kendi profilini günceller
- Leave requests: herkes onaylanmış olanları görür; kendi taleplerini oluşturur/görür; yöneticiler hepsini görür ve durum günceller
- Yönetici onayında trigger: durum `onaylandi` olduğunda `kalan_izin_gunu` otomatik düşer (sadece yıllık izinde)

**Auth:** Email + şifre. İlk kayıt olan veya manuel atanan kullanıcı `yonetici` rolüne sahip.

### 2. Rotalar (TanStack Start)

```
/auth                      → Giriş / Kayıt
/_authenticated/
  ├── index                → Dashboard (widget'lar + ortak takvim)
  ├── takvim               → Tam ekran ortak takvim
  ├── taleplerim           → Kendi izin geçmişim
  ├── yeni-talep           → Yeni izin talebi formu
  ├── onay-paneli          → (sadece yönetici) bekleyen talepler
  └── profil               → Kullanıcı profili & izin bakiyesi
```

### 3. Ana Bileşenler

**Sidebar (Shadcn):** Avasya logosu, navigasyon, kullanıcı kartı (alt), çıkış. Mobilde collapse.

**Dashboard:**
- Üst widget kartları: "Kalan İzin Günüm", "Bugün İzinli (N kişi)", "Bu Hafta İzinli", "Bekleyen Taleplerim"
- Ana alan: Ortak takvim (aylık varsayılan)
- Sağ panel: "Önümüzdeki 7 günde izinli olanlar" listesi

**Ortak Takvim:**
- `react-big-calendar` (Teams benzeri görünüm, ay/hafta/gün geçişi)
- Sadece `durum = 'onaylandi'` kayıtları renkli blok olarak
- İzin türüne göre soft pastel renk kodlaması:
  - Yıllık: soft mavi
  - Sağlık: soft kırmızı/pembe
  - Ücretsiz: soft mor
  - Doğum/Mazeret: soft yeşil
- Blok etiketi: "Ad Soyad — İzin Türü"
- Boş güne tıklayınca → yeni talep modalı (başlangıç tarihi prefill)

**Autocomplete Filtre (Command/Popover):**
- Takvimin üstünde arama çubuğu
- Yazarken `profiles` tablosundan debounced sorgu, dropdown öneri
- Seçilen kişi için takvim anında filtrelenir, "Filtre temizle" çipi gösterilir

**Yeni Talep Formu:**
- İzin türü (Select), başlangıç/bitiş (Date picker / Calendar)
- Hafta sonu + `holidays` tablosu hariç **otomatik iş günü hesabı** (canlı gösterim)
- Yıllık izinse kalan bakiyeyi aşmaya engel validasyon
- Açıklama textarea
- Submit → toast + kullanıcı `/taleplerim`'e yönlendirilir

**Onay Paneli (yönetici):**
- Bekleyen talepler tablosu (çalışan, tarih aralığı, gün sayısı, tür, açıklama)
- "Onayla" butonu → tek tık, toast
- "Reddet" butonu → modal, zorunlu red nedeni textarea, submit
- Onaylanmış/reddedilmiş geçmiş için sekmeler

### 4. Tasarım Sistemi

`src/styles.css` üzerinden semantik tokenlar:
- `--background`: beyaz / koyu lacivert (dark)
- `--primary`: koyu lacivert (#0F1E3D civarı)
- `--accent`: Avasya kırmızısı (logodan)
- İzin türü token'ları: `--leave-annual`, `--leave-sick`, `--leave-unpaid`, `--leave-other` (soft pastel)
- Inter font, generous spacing, yumuşak shadow, `rounded-xl`
- Tüm Shadcn bileşenleri (Sidebar, Card, Dialog, Command, Calendar, Table, Tabs, Sonner toast, Badge)
- Tam responsive

### Teknik Detaylar

- Auth: `_authenticated/` layout gate
- Server-side mutasyonlar `createServerFn` + `requireSupabaseAuth`
- Tarih hesabı için `date-fns`
- Takvim: `react-big-calendar` + `date-fns` localizer
- Form validasyon: `react-hook-form` + `zod`
- Optimistik UI + TanStack Query invalidation
- Sonner toast bildirimleri

### Sırada Onay İçin

Onayladığında: Lovable Cloud'u aktive edip şemayı kuracağım, ardından tüm UI ve fonksiyonları implement edeceğim. Test için iki rol (yonetici / calisan) ile kayıt olup deneyebilirsin; ilk kayıt olan kullanıcı otomatik olarak yönetici yapılabilir — onay verirsen bu mantığı uygularım.
