import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LeaveTypeValue } from "@/lib/leave-utils";

export type Profile = {
  id: string;
  ad_soyad: string;
  email: string;
  departman: string | null;
  toplam_yillik_izin: number;
  kalan_izin_gunu: number;
};

export type LeaveRequest = {
  id: string;
  user_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  izin_turu: LeaveTypeValue;
  toplam_gun: number;
  aciklama: string | null;
  durum: "beklemede" | "onaylandi" | "reddedildi";
  red_nedeni: string | null;
  onaylayan_id: string | null;
  created_at: string;
};

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("ad_soyad");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    staleTime: 60_000,
  });
}

export function useApprovedLeaves() {
  return useQuery({
    queryKey: ["leaves", "approved"],
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("durum", "onaylandi")
        .order("baslangic_tarihi", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaveRequest[];
    },
  });
}

export function useMyLeaves(userId: string | undefined) {
  return useQuery({
    queryKey: ["leaves", "mine", userId],
    enabled: !!userId,
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaveRequest[];
    },
  });
}

export function useAllLeaves() {
  return useQuery({
    queryKey: ["leaves", "all"],
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaveRequest[];
    },
  });
}

export function usePendingLeaves() {
  return useQuery({
    queryKey: ["leaves", "pending"],
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("durum", "beklemede")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeaveRequest[];
    },
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("holidays").select("tarih");
      if (error) throw error;
      return (data ?? []).map((h) => h.tarih as string);
    },
    staleTime: 10 * 60_000,
  });
}
