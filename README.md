# Avasya Leave Hub

Avasya şirketi için çalışanların izin taleplerini yönetebileceği, birbirlerinin izin durumlarını takip edebileceği, Microsoft Teams takvimi şıklığında ve modernliğinde, tam fonksiyonel bir "Kurumsal İzin Yönetim ve Ortak Takvim Uygulaması" (Local/Corporate Web App) tasarlamanı istiyorum. 

Uygulamanın tüm verileri (kullanıcılar, izinler, departmanlar) Supabase üzerinde ilişkisel bir veri tabanında kalıcı olarak tutulmalıdır. Tüm veri modeli yapılandırmasını ve UI state yönetimini buna göre kur.

Uygulamanın mimarisi, özellikleri ve teknik detayları şu şekilde olmalıdır:

1. Veri Tabanı Mimarisi (Supabase) ve Kullanıcı Rolleri:

- "users" tablosu: id, ad_soyad, e-posta, rol (Çalışan, Onaylayıcı/Yönetici), toplam_yillik_izin, kalan_izin_gunu, departman.

- "leave_requests" tablosu: id, user_id (çalışan ile ilişkili), baslangic_tarihi, bitis_tarihi, izin_turu, toplam_gun, durum (Onay Bekliyor, Onaylandı, Reddedildi), red_nedeni, olusturulma_tarihi.

- Uygulamaya giriş yapan kullanıcı kendi profilini, kalan ve kullanılan izin gün sayılarını net bir şekilde görebilmelidir.

2. Gelişmiş İzin Talep Modülü:

- Çalışanlar takvim üzerindeki günlere tıklayarak veya belirgin bir "Yeni İzin Talebi" butonuyla talep oluşturabilmeli.

- Form içerisinde: İzin Türü (Yıllık İzin, Ücretsiz İzin, Sağlık İzni, Doğum/Mazeret İzni vb.), Başlangıç/Bitiş Tarihi (Hafta sonları ve resmi tatiller hesaba katılarak toplam gün otomatik hesaplanmalı) ve Açıklama alanları olmalı.

- Gönderilen talep veri tabanına "Onay Bekliyor" olarak kaydedilmeli ve çalışanın ana sayfasındaki "Geçmiş Taleplerim" tablosunda listelenmelidir.

3. Merkezi ve Ortak Kurumsal Takvim (Teams Mantığı):

- Ana ekranda tüm şirketin görebileceği tek bir ortak takvim (FullCalendar tarzında modern bir görünüm) yer almalıdır. Aylık, haftalık ve günlük görünümleri desteklemelidir.

- Bu ortak takvimde YALNIZCA durumu "Onaylandı" olan izinler renkli bloklar halinde listelenmelidir.

- Her izin bloğunun üzerinde izin sahibinin adı ve izin türü yazmalıdır (Örn: "Ahmet Yılmaz - Yıllık İzin"). İzin türlerine göre soft, kurumsal renk kodları (Shadcn UI renk paletine uygun hafif pastel tonlar) kullanılmalıdır.

4. Otomatik Tamamlamalı (Autocomplete) Gelişmiş Filtreleme:

- Takvimin hemen üzerinde veya sol yan panelde çok güçlü bir "Çalışan İsmine Göre Filtrele" arama çubuğu olmalıdır.

- Kullanıcı buraya isim yazmaya başladığında, veri tabanındaki çalışan listesinden otomatik tamamlama (Autocomplete / Dropdown suggestion) önerileri çıkmalıdır.

- Bir isim seçildiğinde veya aratıldığında, takvim anında filtrelenmeli ve ortak takvimdeki diğer tüm kayıtlar gizlenerek YALNIZCA o seçilen kişinin izinli olduğu günler ekranda kalmalıdır. Arama temizlendiğinde takvim eski ortak haline dönmelidir.

5. Yönetici/Onaylayıcı Paneli:

- "Yönetici" rolündeki kullanıcılar için özel bir "Onay Yönetim Paneli" (Dashboard) olmalıdır.

- Burada "Onay Bekleyen Talepler" listelenmeli; yönetici tek tıkla "Onaylama" veya "Reddetme" işlemlerini yapabilmelidir. Eğer reddediyorsa, zorunlu bir "Red Nedeni" metin alanı açılmalıdır.

- Bir talep onaylandığı an Supabase'de durumu güncellenmeli, ilgili çalışanın kalan izin gün sayısından otomatik düşmeli ve ORTAK TAKVİME anında yansımalıdır.

6. Tasarım, UI/UX ve Dashboard Detayları:

- Tasarım Avasya şirketinin kurumsal kimliğine yakışacak şekilde son derece profesyonel, temiz, minimalist (Clean UI) ve modern olmalıdır. Tailwind CSS ve Shadcn UI bileşenleri kullanılmalıdır. Color palette olarak koyu lacivert, beyaz, soft gri tonları ve profesyonel odak renkleri tercih edilmelidir.

- Ana sayfada "Bugün Kimler İzinli?", "Önümüzdeki Hafta Kimler İzinli?" gibi hızlı bilgi kartları (widgets) bulunmalıdır.

- Tüm süreçlerde şık ve kullanıcı dostu bildirimler (Toast notifications: "İzin talebi başarıyla iletildi", "Talep onaylandı" vb.) tetiklenmelidir.

- Uygulama tamamen responsive (mobil, tablet ve masaüstü uyumlu) olmalıdır.

Lütfen bu uygulamayı tüm veri tabanı ilişkileri, filtreleme fonksiyonları ve akıcı arayüz bileşenleriyle birlikte eksiksiz, kararlı ve en yüksek kalitede oluştur.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://avasyaizintakip.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6fcad70b-53ab-4802-aea8-2de1182e0b10).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
