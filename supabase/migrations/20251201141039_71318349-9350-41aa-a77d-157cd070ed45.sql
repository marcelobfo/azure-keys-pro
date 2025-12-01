-- Create RLS policies for master role with full access

-- Properties: master can access all properties
DROP POLICY IF EXISTS "Master can manage all properties" ON public.properties;
CREATE POLICY "Master can manage all properties" 
ON public.properties 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Leads: master can access all leads
DROP POLICY IF EXISTS "Master can manage all leads" ON public.leads;
CREATE POLICY "Master can manage all leads" 
ON public.leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Visits: master can access all visits
DROP POLICY IF EXISTS "Master can manage all visits" ON public.visits;
CREATE POLICY "Master can manage all visits" 
ON public.visits 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Profiles: master can view all profiles
DROP POLICY IF EXISTS "Master can view all profiles" ON public.profiles;
CREATE POLICY "Master can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'master'
  )
);

-- Chat sessions: master can access all sessions
DROP POLICY IF EXISTS "Master can manage all chat sessions" ON public.chat_sessions;
CREATE POLICY "Master can manage all chat sessions" 
ON public.chat_sessions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Chat messages: master can access all messages
DROP POLICY IF EXISTS "Master can manage all chat messages" ON public.chat_messages;
CREATE POLICY "Master can manage all chat messages" 
ON public.chat_messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Chat configurations: master can manage
DROP POLICY IF EXISTS "Master can manage chat configurations" ON public.chat_configurations;
CREATE POLICY "Master can manage chat configurations" 
ON public.chat_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Knowledge base: master can manage
DROP POLICY IF EXISTS "Master can manage knowledge base" ON public.knowledge_base_articles;
CREATE POLICY "Master can manage knowledge base" 
ON public.knowledge_base_articles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Notifications: master can view all
DROP POLICY IF EXISTS "Master can view all notifications" ON public.notifications;
CREATE POLICY "Master can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Site settings: master can manage
DROP POLICY IF EXISTS "Master can manage site settings" ON public.site_settings;
CREATE POLICY "Master can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Webhook configurations: master can manage
DROP POLICY IF EXISTS "Master can manage webhooks" ON public.webhook_configurations;
CREATE POLICY "Master can manage webhooks" 
ON public.webhook_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- API tokens: master can manage
DROP POLICY IF EXISTS "Master can manage API tokens" ON public.api_tokens;
CREATE POLICY "Master can manage API tokens" 
ON public.api_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Analytics: master can view
DROP POLICY IF EXISTS "Master can view analytics" ON public.analytics_events;
CREATE POLICY "Master can view analytics" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

DROP POLICY IF EXISTS "Master can view analytics summary" ON public.analytics_summary;
CREATE POLICY "Master can view analytics summary" 
ON public.analytics_summary 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Support tickets: master can manage
DROP POLICY IF EXISTS "Master can manage support tickets" ON public.support_tickets;
CREATE POLICY "Master can manage support tickets" 
ON public.support_tickets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Business hours: master can manage
DROP POLICY IF EXISTS "Master can manage business hours" ON public.business_hours;
CREATE POLICY "Master can manage business hours" 
ON public.business_hours 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Property alerts: master can view all
DROP POLICY IF EXISTS "Master can view all property alerts" ON public.property_alerts;
CREATE POLICY "Master can view all property alerts" 
ON public.property_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Attendant availability: master can view all
DROP POLICY IF EXISTS "Master can view all attendant availability" ON public.attendant_availability;
CREATE POLICY "Master can view all attendant availability" 
ON public.attendant_availability 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Webhook logs: master can view
DROP POLICY IF EXISTS "Master can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Master can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);

-- Security audit log: master can view
DROP POLICY IF EXISTS "Master can view audit logs" ON public.security_audit_log;
CREATE POLICY "Master can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'master'
  )
);