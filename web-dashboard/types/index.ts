export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'security_officer' | 'viewer';
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    minSeverity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface SecurityEvent {
  _id: string;
  timestamp: string;
  eventType: 'login' | 'api_access' | 'firewall' | 'file_access' | 'network' | 'malware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  targetIP?: string;
  description: string;
  metadata: Record<string, unknown>;
  processed: boolean;
}

export interface Alert {
  _id: string;
  eventIds: string[];
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'escalated' | 'false_positive';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  summary: string;
  affectedAssets: string[];
  investigationNotes: InvestigationNote[];
}

export interface InvestigationNote {
  userId: string;
  timestamp: string;
  note: string;
  userName?: string; // Optional for UI display
}

export interface DetectionRule {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: unknown[];
  actions: unknown[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
