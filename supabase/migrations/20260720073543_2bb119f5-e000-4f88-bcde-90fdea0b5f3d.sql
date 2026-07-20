
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('calisan', 'yonetici');
CREATE TYPE public.leave_type AS ENUM ('yillik','ucretsiz','saglik','dogum_mazeret','diger');
CREATE TYPE public.leave_status AS ENUM ('beklemede','onaylandi','reddedildi');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_soyad TEXT NOT NULL,
  email TEXT NOT NULL,
  departman TEXT,
  toplam_yillik_izin INTEGER NOT NULL DEFAULT 14,
  kalan_izin_gunu INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by all authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Managers can view all roles
CREATE POLICY "Managers view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'yonetici'));

-- HOLIDAYS (Turkey official)
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarih DATE NOT NULL UNIQUE,
  ad TEXT NOT NULL
);
GRANT SELECT ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holidays readable by all authenticated" ON public.holidays
  FOR SELECT TO authenticated USING (true);

-- Seed TR holidays 2026-2027
INSERT INTO public.holidays (tarih, ad) VALUES
('2026-01-01','Yılbaşı'),
('2026-04-23','Ulusal Egemenlik ve Çocuk Bayramı'),
('2026-05-01','Emek ve Dayanışma Günü'),
('2026-05-19','Atatürk''ü Anma, Gençlik ve Spor Bayramı'),
('2026-07-15','Demokrasi ve Milli Birlik Günü'),
('2026-08-30','Zafer Bayramı'),
('2026-10-29','Cumhuriyet Bayramı'),
('2026-03-20','Ramazan Bayramı 1. Gün'),
('2026-03-21','Ramazan Bayramı 2. Gün'),
('2026-03-22','Ramazan Bayramı 3. Gün'),
('2026-05-27','Kurban Bayramı 1. Gün'),
('2026-05-28','Kurban Bayramı 2. Gün'),
('2026-05-29','Kurban Bayramı 3. Gün'),
('2026-05-30','Kurban Bayramı 4. Gün'),
('2027-01-01','Yılbaşı'),
('2027-04-23','Ulusal Egemenlik ve Çocuk Bayramı'),
('2027-05-01','Emek ve Dayanışma Günü'),
('2027-05-19','Atatürk''ü Anma, Gençlik ve Spor Bayramı'),
('2027-07-15','Demokrasi ve Milli Birlik Günü'),
('2027-08-30','Zafer Bayramı'),
('2027-10-29','Cumhuriyet Bayramı');

-- LEAVE REQUESTS
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslangic_tarihi DATE NOT NULL,
  bitis_tarihi DATE NOT NULL,
  izin_turu public.leave_type NOT NULL,
  toplam_gun INTEGER NOT NULL,
  aciklama TEXT,
  durum public.leave_status NOT NULL DEFAULT 'beklemede',
  red_nedeni TEXT,
  onaylayan_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- All authenticated users see approved leaves (for shared calendar)
CREATE POLICY "Approved leaves visible to all" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (durum = 'onaylandi' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'yonetici'));

CREATE POLICY "Users insert own leave requests" ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own pending requests" ON public.leave_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND durum = 'beklemede');

CREATE POLICY "Managers update any request" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'yonetici'))
  WITH CHECK (public.has_role(auth.uid(), 'yonetici'));

-- Trigger: on approval of yillik izin, decrement remaining days
CREATE OR REPLACE FUNCTION public.handle_leave_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.durum = 'onaylandi' AND OLD.durum <> 'onaylandi' AND NEW.izin_turu = 'yillik' THEN
    UPDATE public.profiles
      SET kalan_izin_gunu = GREATEST(0, kalan_izin_gunu - NEW.toplam_gun)
      WHERE id = NEW.user_id;
  END IF;
  IF NEW.durum <> 'onaylandi' AND OLD.durum = 'onaylandi' AND NEW.izin_turu = 'yillik' THEN
    UPDATE public.profiles
      SET kalan_izin_gunu = kalan_izin_gunu + OLD.toplam_gun
      WHERE id = NEW.user_id;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_status_change
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_leave_approval();

-- Auto-create profile & default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, ad_soyad, email, departman)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'ad_soyad', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'departman', 'Genel')
  );

  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'yonetici');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'calisan');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
