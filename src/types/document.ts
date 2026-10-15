export type CloudProvider = 'google-drive' | 'browser-cloud';

export interface CloudAccount {
  id: string;
  provider: CloudProvider;
  name: string;
  email: string;
  avatar?: string;
  connected: boolean;
  lastSync?: string;
  storageUsedMb: number;
  storageTotalMb: number;
  autoSync: boolean;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  version: number;
  wordCount: number;
  charCount: number;
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Executive';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number; // in mm or inches
    bottom: number;
    left: number;
    right: number;
  };
  cloudSyncedTo?: CloudProvider[];
  tags: string[];
  isLocked?: boolean;
}

export interface DocumentComment {
  id: string;
  author: string;
  avatar?: string;
  timestamp: string;
  text: string;
  resolved: boolean;
  selectedText?: string;
  replies?: Array<{
    id: string;
    author: string;
    avatar?: string;
    timestamp: string;
    text: string;
  }>;
}

export interface TrackedChange {
  id: string;
  type: 'insertion' | 'deletion' | 'format';
  author: string;
  timestamp: string;
  originalText?: string;
  newText?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DocumentVersion {
  id: string;
  timestamp: string;
  title: string;
  htmlContent: string;
  author: string;
  summary?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'editor' | 'viewer' | 'reviewer';
  status: 'active' | 'idle' | 'offline';
  cursorPosition?: {
    line?: number;
    x?: number;
    y?: number;
  };
}

export interface ScriptMacro {
  id: string;
  name: string;
  description: string;
  category: 'format' | 'cleanup' | 'academic' | 'analysis' | 'custom';
  code: string;
  lastRun?: string;
}

export interface AddInExtension {
  id: string;
  name: string;
  iconName: string;
  category: string;
  description: string;
  installed: boolean;
  version: string;
  author: string;
}

export interface PageSettings {
  size: 'A4' | 'Letter' | 'Legal' | 'Executive';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number; // in px or mm
    bottom: number;
    left: number;
    right: number;
  };
  pageColor: string;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  columns: 1 | 2 | 3;
}
