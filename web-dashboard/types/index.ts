export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'security_officer' | 'viewer';
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface SecurityEvent {
  _id: string;
  timestamp: string;
  eventType: 'login' | 'api_access' | 'firewall' | 'file_access' | 'network' | 'malware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  targetIP?: string;
  description: string;
  metadata: Record<string, any>;
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
  conditions: any[];
  actions: any[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
