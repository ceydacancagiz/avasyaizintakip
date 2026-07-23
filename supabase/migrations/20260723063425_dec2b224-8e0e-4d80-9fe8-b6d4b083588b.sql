-- Allow managers to insert notifications for any user (e.g. approval/rejection notices)
CREATE POLICY "Managers can insert notifications for anyone"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'yonetici'));