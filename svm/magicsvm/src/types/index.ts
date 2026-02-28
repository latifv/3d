export type Role = 'SYSTEM_ADMIN' | 'PLATFORM_ADMIN' | 'RESELLER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';

export type EntityStatus =
  | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ERROR' | 'RUNNING'
  | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'STOPPED' | 'INACTIVE'
  | 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'WARNING' | 'CRITICAL' | 'INFO';

export interface BrandingConfig {
  brand_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  theme_mode: 'dark' | 'light' | 'system';
  support_email: string;
  favicon_url: string;
  login_bg_url: string;
}

export interface User {
  id: string; email: string; full_name: string; avatar_url: string;
  role: Role; status: EntityStatus; last_login: string; created_at: string;
  company_id?: string; tenant_id?: string;
  roles?: string[];
  permissions?: string[];
  language?: string;
}

export interface Company {
  id: string; name: string; tax_id: string; address: string; city: string;
  country: string; status: EntityStatus; contact_email: string; phone: string;
  created_at: string; projects_count: number; users_count: number;
}

export interface Project {
  id: string; name: string; company_id: string; company_name: string;
  datacenter_id: string; datacenter_name: string; status: EntityStatus;
  vm_count: number; cpu_quota: number; ram_quota: number; disk_quota: number; created_at: string;
}

export interface Datacenter {
  id: string; name: string; code: string; region: string; country: string;
  status: EntityStatus; total_hosts: number; total_vms: number;
  cpu_utilization: number; ram_utilization: number; notes: string; created_at: string;
}

export interface ContactType { id: string; name: string; description: string; created_at: string; }
export interface Contact {
  id: string; full_name: string; email: string; phone: string;
  company_id: string; company_name: string; contact_type_id: string;
  contact_type_name: string; status: EntityStatus; created_at: string;
}

export interface PortalUser {
  id: string; username: string; email: string; full_name: string;
  company_id: string; company_name: string; role: Role; status: EntityStatus;
  last_login: string; login_count: number; created_at: string; notes: string;
}

export interface PortalActivity {
  id: string; user_id: string; user_name: string; action: string;
  entity_type: string; entity_id: string; entity_name: string;
  details: string; ip_address: string; timestamp: string;
}

export interface VirtualMachine {
  id: string; name: string; hostname: string; project_id: string; project_name: string;
  company_name: string; datacenter_id: string; datacenter_name: string; template_name: string;
  status: EntityStatus; cpu: number; ram: number; disk: number; os: string;
  ip_address: string; public_ip?: string; uptime: string; created_at: string; tags: string[];
}

export interface Template {
  id: string; name: string; os: string; os_version: string; size_gb: number;
  cpu: number; ram: number; status: EntityStatus; description: string; created_at: string;
}

export interface Snapshot {
  id: string; name: string; vm_id: string; vm_name: string; size_gb: number;
  status: EntityStatus; created_at: string; description: string;
}

export interface ISOImage {
  id: string; name: string; os_type: string; size_gb: number;
  status: EntityStatus; uploaded_by: string; created_at: string;
}

export interface Network {
  id: string; name: string; cidr: string; vlan: number; datacenter_id: string;
  datacenter_name: string; status: EntityStatus; subnet_count: number; created_at: string;
}

export interface Subnet {
  id: string; name: string; cidr: string; gateway: string; network_id: string;
  network_name: string; dhcp_enabled: boolean; dns_primary: string;
  dns_secondary: string; status: EntityStatus; created_at: string;
}

export interface PublicIP {
  id: string; address: string; datacenter_id: string; datacenter_name: string;
  assigned_to_type?: string; assigned_to_id?: string; assigned_to_name?: string;
  status: EntityStatus; created_at: string;
}

export interface FirewallRule {
  id: string; name: string; direction: 'INBOUND' | 'OUTBOUND';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY'; port_range: string;
  source_cidr: string; destination_cidr: string; action: 'ALLOW' | 'DENY';
  priority: number; status: EntityStatus; network_id: string; created_at: string;
}

export interface VPNUser {
  id: string; username: string; email: string; assigned_ip: string;
  status: EntityStatus; last_connected: string; bytes_transferred: number; created_at: string;
}

export interface BackupPolicy {
  id: string; name: string; cron_expression: string; cron_human: string;
  retention_days: number; target_type: string; target_count: number;
  status: EntityStatus; last_run: string; next_run: string; created_at: string;
}

export interface BackupRun {
  id: string; policy_id: string; policy_name: string; target_name: string;
  status: EntityStatus; size_gb: number; duration_seconds: number;
  started_at: string; completed_at: string; error_message?: string;
}

export interface DRStatus {
  id: string; source_dc: string; target_dc: string; status: EntityStatus;
  rpo_minutes: number; rto_minutes: number; last_test: string;
  vm_count: number; sync_progress: number;
}

export interface ReplicationStatus {
  id: string; source_name: string; target_name: string; status: EntityStatus;
  lag_seconds: number; last_sync: string; bytes_synced: number; direction: string;
}

export interface Alert {
  id: string; title: string; message: string; severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: EntityStatus; source: string; datacenter_name: string;
  acknowledged: boolean; created_at: string; resolved_at?: string;
}

export interface AuditLog {
  id: string; user_name: string; user_email: string; action: string;
  entity_type: string; entity_id: string; entity_name: string;
  details: string; ip_address: string; timestamp: string;
}

export interface TaskLog {
  id: string; name: string; type: string; status: EntityStatus; progress: number;
  duration_seconds: number; output: string; started_at: string;
  completed_at?: string; retry_count: number;
}

export interface ServiceAccess {
  id: string; name: string; type: string; url: string; status: EntityStatus;
  last_health_check: string; health_status: EntityStatus; username: string;
  datacenter_name: string; created_at: string;
}

export interface Operation {
  id: string; name: string; type: string; status: EntityStatus; progress: number;
  target_type: string; target_name: string; initiated_by: string;
  started_at: string; completed_at?: string; steps: OperationStep[];
}

export interface OperationStep {
  name: string; status: EntityStatus; started_at?: string; completed_at?: string;
}

export interface Quota {
  id: string; tenant_name: string; project_name: string; resource_type: string;
  limit: number; used: number; unit: string; created_at: string;
}

export interface Approval {
  id: string; request_type: string; requester_name: string; requester_email: string;
  description: string; status: EntityStatus; reviewed_by?: string;
  reviewed_at?: string; created_at: string;
}

export interface FeatureFlag {
  id: string; name: string; key: string; description: string;
  enabled: boolean; scope: string; created_at: string;
}

export interface Notification {
  id: string; name: string; event_type: string; channel: 'EMAIL' | 'WEBHOOK' | 'SLACK';
  recipients: string; enabled: boolean; created_at: string;
}

export interface SystemEvent {
  id: string; title: string; message: string; severity: 'CRITICAL' | 'WARNING' | 'INFO';
  source: string; timestamp: string;
}

export interface SystemService {
  name: string; status: EntityStatus; uptime_percent: number;
  response_time_ms: number; last_check: string;
}

export interface MonitoringAccess {
  id: string; name: string; type: string; url: string;
  status: EntityStatus; datacenter_name: string; created_at: string;
}

export interface BackupReporter {
  id: string; name: string; type: string; endpoint: string;
  status: EntityStatus; last_report: string; created_at: string;
}

export interface Session {
  id: string; user_name: string; user_email: string; ip_address: string;
  device: string; browser: string; login_at: string; last_active: string; status: EntityStatus;
}

export interface RoleDefinition {
  id: string; name: string; description: string; permissions: string[];
  user_count: number; created_at: string;
}

export interface Permission {
  id: string; name: string; key: string; module: string; description: string;
}

export interface Note { id: string; content: string; author: string; created_at: string; }
export interface TimelineEvent {
  id: string; action: string; description: string; actor: string; timestamp: string;
}

export interface BandwidthRecord {
  id: string; network_name: string; vm_name: string;
  inbound_mbps: number; outbound_mbps: number; timestamp: string;
}
