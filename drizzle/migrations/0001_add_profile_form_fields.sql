ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personel_kodu text,
  ADD COLUMN IF NOT EXISTS tc_kimlik text,
  ADD COLUMN IF NOT EXISTS ise_giris_tarihi date,
  ADD COLUMN IF NOT EXISTS gorev text,
  ADD COLUMN IF NOT EXISTS izin_adresi text,
  ADD COLUMN IF NOT EXISTS izin_telefonu text;