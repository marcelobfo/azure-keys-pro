-- =============================================
-- CORREÇÃO DE ANONYMOUS ACCESS POLICIES
-- Adiciona TO authenticated em políticas que requerem autenticação
-- =============================================

-- 1. ANALYTICS_EVENTS
DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Master can view analytics" ON public.analytics_events;

CREATE POLICY "Admins can view analytics events" ON public.analytics_events
FOR SELECT TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can view analytics" ON public.analytics_events
FOR SELECT TO authenticated
USING (authorize('master'::user_role));

-- 2. ANALYTICS_SUMMARY
DROP POLICY IF EXISTS "Admins can view analytics summary" ON public.analytics_summary;
DROP POLICY IF EXISTS "Master can view analytics summary" ON public.analytics_summary;

CREATE POLICY "Admins can view analytics summary" ON public.analytics_summary
FOR ALL TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can view analytics summary" ON public.analytics_summary
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 3. API_TOKENS
DROP POLICY IF EXISTS "Admins can manage API tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Master can manage API tokens" ON public.api_tokens;

CREATE POLICY "Admins can manage API tokens" ON public.api_tokens
FOR ALL TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can manage API tokens" ON public.api_tokens
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 4. ATTENDANT_AVAILABILITY
DROP POLICY IF EXISTS "Admins podem ver disponibilidade" ON public.attendant_availability;
DROP POLICY IF EXISTS "Atendentes podem gerenciar sua disponibilidade" ON public.attendant_availability;
DROP POLICY IF EXISTS "Master can view all attendant availability" ON public.attendant_availability;

CREATE POLICY "Admins podem ver disponibilidade" ON public.attendant_availability
FOR SELECT TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Atendentes podem gerenciar sua disponibilidade" ON public.attendant_availability
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master can view all attendant availability" ON public.attendant_availability
FOR SELECT TO authenticated
USING (authorize('master'::user_role));

-- 5. BUSINESS_HOURS (manter acesso público para SELECT)
DROP POLICY IF EXISTS "Admins can manage business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Master can manage business hours" ON public.business_hours;

CREATE POLICY "Admins can manage business hours" ON public.business_hours
FOR ALL TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can manage business hours" ON public.business_hours
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 6. CHAT_CONFIGURATIONS
DROP POLICY IF EXISTS "Super admin can manage all chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Tenant admin can manage own chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Public can view active chat config" ON public.chat_configurations;

CREATE POLICY "Super admin can manage all chat configurations" ON public.chat_configurations
FOR ALL TO authenticated
USING (is_super_admin());

CREATE POLICY "Tenant admin can manage own chat configurations" ON public.chat_configurations
FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id()) AND authorize('admin'::user_role));

CREATE POLICY "Public can view active chat config" ON public.chat_configurations
FOR SELECT
USING (active = true);

-- 7. CHAT_CONTEXT_MEMORY
DROP POLICY IF EXISTS "System can manage chat memory" ON public.chat_context_memory;

CREATE POLICY "System can manage chat memory" ON public.chat_context_memory
FOR ALL TO authenticated
USING (true);

CREATE POLICY "Anon can manage chat memory" ON public.chat_context_memory
FOR ALL TO anon
USING (true);

-- 8. CHAT_MESSAGES (manter INSERT e SELECT públicos para chat funcionar)
DROP POLICY IF EXISTS "Master can manage all chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can update read status" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.chat_messages;

CREATE POLICY "Master can manage all chat messages" ON public.chat_messages
FOR ALL TO authenticated
USING (authorize('master'::user_role));

CREATE POLICY "Participants can update read status" ON public.chat_messages
FOR UPDATE TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Participants can view messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

-- 9. CHAT_SESSIONS (manter INSERT público para sistema)
DROP POLICY IF EXISTS "Attendants can update assigned sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Attendants can view assigned sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Leads can view their sessions by email" ON public.chat_sessions;
DROP POLICY IF EXISTS "Master can manage all chat sessions" ON public.chat_sessions;

CREATE POLICY "Attendants can update assigned sessions" ON public.chat_sessions
FOR UPDATE TO authenticated
USING ((attendant_id = auth.uid()) OR authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Attendants can view assigned sessions" ON public.chat_sessions
FOR SELECT TO authenticated
USING ((attendant_id = auth.uid()) OR authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Leads can view their sessions by email" ON public.chat_sessions
FOR SELECT TO authenticated
USING (lead_id IN (SELECT leads.id FROM leads WHERE leads.email = get_user_email(auth.uid())));

CREATE POLICY "Master can manage all chat sessions" ON public.chat_sessions
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 10. COMMISSIONS
DROP POLICY IF EXISTS "Admin can manage all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Corretor can view own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Master can manage all commissions" ON public.commissions;

CREATE POLICY "Admin can manage all commissions" ON public.commissions
FOR ALL TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Corretor can view own commissions" ON public.commissions
FOR SELECT TO authenticated
USING (corretor_id = auth.uid());

CREATE POLICY "Master can manage all commissions" ON public.commissions
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 11. CORRETOR_COMMISSION_SETTINGS
DROP POLICY IF EXISTS "Admin can manage commission settings" ON public.corretor_commission_settings;
DROP POLICY IF EXISTS "Corretor can view own settings" ON public.corretor_commission_settings;
DROP POLICY IF EXISTS "Master can manage commission settings" ON public.corretor_commission_settings;

CREATE POLICY "Admin can manage commission settings" ON public.corretor_commission_settings
FOR ALL TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Corretor can view own settings" ON public.corretor_commission_settings
FOR SELECT TO authenticated
USING (corretor_id = auth.uid());

CREATE POLICY "Master can manage commission settings" ON public.corretor_commission_settings
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 12. FAVORITES
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;

CREATE POLICY "Users can manage own favorites" ON public.favorites
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- 13. KNOWLEDGE_BASE_ARTICLES
DROP POLICY IF EXISTS "Admins and corretores can delete KB" ON public.knowledge_base_articles;
DROP POLICY IF EXISTS "Admins and corretores can insert KB" ON public.knowledge_base_articles;
DROP POLICY IF EXISTS "Admins and corretores can update KB" ON public.knowledge_base_articles;
DROP POLICY IF EXISTS "Admins and corretores can view KB" ON public.knowledge_base_articles;
DROP POLICY IF EXISTS "Master can manage knowledge base" ON public.knowledge_base_articles;

CREATE POLICY "Admins and corretores can delete KB" ON public.knowledge_base_articles
FOR DELETE TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Admins and corretores can insert KB" ON public.knowledge_base_articles
FOR INSERT TO authenticated
WITH CHECK (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Admins and corretores can update KB" ON public.knowledge_base_articles
FOR UPDATE TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Admins and corretores can view KB" ON public.knowledge_base_articles
FOR SELECT TO authenticated
USING (authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]));

CREATE POLICY "Master can manage knowledge base" ON public.knowledge_base_articles
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 14. LEADS (manter INSERT público)
DROP POLICY IF EXISTS "Tenant users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Tenant users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Tenant users can view leads" ON public.leads;

CREATE POLICY "Tenant users can delete leads" ON public.leads
FOR DELETE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_lead(property_id)));

CREATE POLICY "Tenant users can update leads" ON public.leads
FOR UPDATE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_lead(property_id)));

CREATE POLICY "Tenant users can view leads" ON public.leads
FOR SELECT TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_lead(property_id)));

-- 15. NOTIFICATIONS (manter INSERT público para sistema)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR (tenant_id = get_user_tenant_id())));

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (is_super_admin() OR ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR (tenant_id = get_user_tenant_id()))));

-- 16. OLX_INTEGRATION
DROP POLICY IF EXISTS "Master can manage all OLX integrations" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can delete own tenant OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can insert own tenant OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can update own tenant OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can view own tenant OLX integration" ON public.olx_integration;

CREATE POLICY "Master can manage all OLX integrations" ON public.olx_integration
FOR ALL TO authenticated
USING (authorize('master'::user_role));

CREATE POLICY "Users can delete own tenant OLX integration" ON public.olx_integration
FOR DELETE TO authenticated
USING ((user_id = auth.uid()) OR (tenant_id = get_user_tenant_id()));

CREATE POLICY "Users can insert own tenant OLX integration" ON public.olx_integration
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tenant OLX integration" ON public.olx_integration
FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) OR (tenant_id = get_user_tenant_id()));

CREATE POLICY "Users can view own tenant OLX integration" ON public.olx_integration
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR (tenant_id = get_user_tenant_id()));

-- 17. OLX_SETTINGS
DROP POLICY IF EXISTS "Admin can manage own tenant OLX settings" ON public.olx_settings;
DROP POLICY IF EXISTS "Master can manage OLX settings" ON public.olx_settings;

CREATE POLICY "Admin can manage own tenant OLX settings" ON public.olx_settings
FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Master can manage OLX settings" ON public.olx_settings
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 18. PROFILES
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view tenant profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_super_admin() OR (authorize('admin'::user_role) AND (tenant_id = get_user_tenant_id())) OR (auth.uid() = id));

CREATE POLICY "Master can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (authorize('master'::user_role));

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 19. PROPERTIES (manter SELECT público para imóveis ativos)
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can view all tenant properties" ON public.properties;

CREATE POLICY "Authenticated users can insert properties" ON public.properties
FOR INSERT TO authenticated
WITH CHECK ((auth.role() = 'authenticated'::text) AND (is_super_admin() OR authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role, 'master'::user_role])));

CREATE POLICY "Tenant users can delete own properties" ON public.properties
FOR DELETE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_property(user_id)));

CREATE POLICY "Tenant users can update own properties" ON public.properties
FOR UPDATE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_property(user_id)));

CREATE POLICY "Tenant users can view all tenant properties" ON public.properties
FOR SELECT TO authenticated
USING (is_super_admin() OR (tenant_id = get_user_tenant_id()));

-- 20. PROPERTY_ALERTS
DROP POLICY IF EXISTS "Master can view all property alerts" ON public.property_alerts;
DROP POLICY IF EXISTS "Users can manage own alerts" ON public.property_alerts;

CREATE POLICY "Master can view all property alerts" ON public.property_alerts
FOR SELECT TO authenticated
USING (authorize('master'::user_role));

CREATE POLICY "Users can manage own alerts" ON public.property_alerts
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- 21. SECURITY_AUDIT_LOG (manter INSERT público para sistema)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Master can view audit logs" ON public.security_audit_log;

CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can view audit logs" ON public.security_audit_log
FOR SELECT TO authenticated
USING (authorize('master'::user_role));

-- 22. SITE_SETTINGS (manter SELECT público)
DROP POLICY IF EXISTS "Super admin can manage all site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Tenant admin can manage own site settings" ON public.site_settings;

CREATE POLICY "Super admin can manage all site settings" ON public.site_settings
FOR ALL TO authenticated
USING (is_super_admin());

CREATE POLICY "Tenant admin can manage own site settings" ON public.site_settings
FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id()) AND authorize('admin'::user_role));

-- 23. SUPPORT_TICKETS (manter INSERT público)
DROP POLICY IF EXISTS "Admins and corretores can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins and corretores can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Master can manage support tickets" ON public.support_tickets;

CREATE POLICY "Admins and corretores can update tickets" ON public.support_tickets
FOR UPDATE TO authenticated
USING ((authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]) OR (assigned_to = auth.uid())));

CREATE POLICY "Admins and corretores can view all tickets" ON public.support_tickets
FOR SELECT TO authenticated
USING ((authorize_any(ARRAY['admin'::user_role, 'corretor'::user_role]) OR (assigned_to = auth.uid())));

CREATE POLICY "Master can manage support tickets" ON public.support_tickets
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 24. TENANT_FEATURES
DROP POLICY IF EXISTS "Admin can view own tenant features" ON public.tenant_features;
DROP POLICY IF EXISTS "Super admin can manage tenant features" ON public.tenant_features;

CREATE POLICY "Admin can view own tenant features" ON public.tenant_features
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Super admin can manage tenant features" ON public.tenant_features
FOR ALL TO authenticated
USING (is_super_admin());

-- 25. TENANTS
DROP POLICY IF EXISTS "Admin can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super admin can manage all tenants" ON public.tenants;

CREATE POLICY "Admin can view own tenant" ON public.tenants
FOR SELECT TO authenticated
USING (id = get_user_tenant_id());

CREATE POLICY "Super admin can manage all tenants" ON public.tenants
FOR ALL TO authenticated
USING (is_super_admin());

-- 26. USER_ROLES
DROP POLICY IF EXISTS "Admin can manage user roles in own tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view user roles in own tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all user roles" ON public.user_roles;

CREATE POLICY "Admin can manage user roles in own tenant" ON public.user_roles
FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id()) AND has_role(auth.uid(), 'admin'::app_role) AND (role <> 'super_admin'::app_role));

CREATE POLICY "Admin can view user roles in own tenant" ON public.user_roles
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Super admin can manage all user roles" ON public.user_roles
FOR ALL TO authenticated
USING (is_super_admin());

-- 27. VISITS (manter INSERT público)
DROP POLICY IF EXISTS "Tenant users can delete visits" ON public.visits;
DROP POLICY IF EXISTS "Tenant users can update visits" ON public.visits;
DROP POLICY IF EXISTS "Tenant users can view visits" ON public.visits;

CREATE POLICY "Tenant users can delete visits" ON public.visits
FOR DELETE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_visit(property_id)));

CREATE POLICY "Tenant users can update visits" ON public.visits
FOR UPDATE TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_visit(property_id)));

CREATE POLICY "Tenant users can view visits" ON public.visits
FOR SELECT TO authenticated
USING (is_super_admin() OR ((tenant_id = get_user_tenant_id()) AND can_access_visit(property_id)));

-- 28. WEBHOOK_CONFIGURATIONS
DROP POLICY IF EXISTS "Admins podem gerenciar webhooks" ON public.webhook_configurations;
DROP POLICY IF EXISTS "Master can manage webhooks" ON public.webhook_configurations;

CREATE POLICY "Admins podem gerenciar webhooks" ON public.webhook_configurations
FOR ALL TO authenticated
USING (authorize('admin'::user_role))
WITH CHECK (authorize('admin'::user_role));

CREATE POLICY "Master can manage webhooks" ON public.webhook_configurations
FOR ALL TO authenticated
USING (authorize('master'::user_role));

-- 29. WEBHOOK_LOGS
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Master can view webhook logs" ON public.webhook_logs;

CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
FOR SELECT TO authenticated
USING (authorize('admin'::user_role));

CREATE POLICY "Master can view webhook logs" ON public.webhook_logs
FOR SELECT TO authenticated
USING (authorize('master'::user_role));