-- Ondalıklı izin bakiyeleri için sayısal kolonlar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kalan_izin numeric(6,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS toplam_izin numeric(6,1);

UPDATE public.profiles
  SET kalan_izin = COALESCE(kalan_izin, kalan_izin_gunu),
      toplam_izin = COALESCE(toplam_izin, toplam_yillik_izin);

-- E-postaya göre başlangıç bakiyeleri
CREATE TABLE IF NOT EXISTS public.initial_leave_balances (
  email text PRIMARY KEY,
  kalan numeric(6,1) NOT NULL
);
GRANT SELECT ON public.initial_leave_balances TO authenticated;
GRANT ALL ON public.initial_leave_balances TO service_role;
ALTER TABLE public.initial_leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Initial balances readable by authenticated"
  ON public.initial_leave_balances FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first BOOLEAN;
  bakiye numeric(6,1);
BEGIN
  SELECT kalan INTO bakiye FROM public.initial_leave_balances
    WHERE lower(email) = lower(NEW.email);

  INSERT INTO public.profiles (id, ad_soyad, email, departman, kalan_izin, toplam_izin, kalan_izin_gunu, toplam_yillik_izin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'ad_soyad', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'departman', 'Genel'),
    COALESCE(bakiye, 14),
    COALESCE(bakiye, 14),
    ROUND(COALESCE(bakiye, 14))::int,
    ROUND(COALESCE(bakiye, 14))::int
  );

  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'yonetici');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'calisan');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_leave_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.durum = 'onaylandi' AND OLD.durum <> 'onaylandi' AND NEW.izin_turu = 'yillik' THEN
    UPDATE public.profiles
      SET kalan_izin = COALESCE(kalan_izin, kalan_izin_gunu) - NEW.toplam_gun,
          kalan_izin_gunu = ROUND(COALESCE(kalan_izin, kalan_izin_gunu) - NEW.toplam_gun)::int
      WHERE id = NEW.user_id;
  END IF;
  IF NEW.durum <> 'onaylandi' AND OLD.durum = 'onaylandi' AND NEW.izin_turu = 'yillik' THEN
    UPDATE public.profiles
      SET kalan_izin = COALESCE(kalan_izin, kalan_izin_gunu) + OLD.toplam_gun,
          kalan_izin_gunu = ROUND(COALESCE(kalan_izin, kalan_izin_gunu) + OLD.toplam_gun)::int
      WHERE id = NEW.user_id;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;