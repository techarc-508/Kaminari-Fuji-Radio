import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DownloadJob, VideoInspectResult, StorageSettings, DuplicateDetectionResult } from '../types/admin.ts';

interface AdminContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Jobs & SSE
  jobs: DownloadJob[];
  inspectUrl: (url: string) => Promise<VideoInspectResult>;
  startDownloadJob: (params: any) => Promise<DownloadJob>;
  cancelJob: (id: string) => Promise<boolean>;
  retryJob: (id: string) => Promise<DownloadJob | null>;
  refreshJobs: () => Promise<void>;
  
  // Overview stats
  stats: any | null;
  refreshStats: () => Promise<void>;
  
  // Storage & Duplicates
  storageData: any | null;
  refreshStorage: () => Promise<void>;
  updateStorageSettings: (settings: Partial<StorageSettings>) => Promise<boolean>;
  cleanOrphans: () => Promise<{ success: boolean; removedCount: number }>;
  duplicates: DuplicateDetectionResult[];
  refreshDuplicates: () => Promise<void>;
  
  // Bulk operations
  bulkUpdateTracks: (trackIds: string[], updates: any) => Promise<boolean>;
  bulkDeleteTracks: (trackIds: string[], deletePhysicalFiles: boolean) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('admin_token');
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [storageData, setStorageData] = useState<any | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateDetectionResult[]>([]);

  // Verify stored token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            setToken(null);
            setIsAuthenticated(false);
            localStorage.removeItem('admin_token');
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    }
  }, [token]);

  // Connect Server-Sent Events (SSE) for live download job updates
  useEffect(() => {
    const sse = new EventSource('/api/admin/events');

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'initial') {
          setJobs(data.jobs || []);
        } else if (data.type === 'job-update' && data.job) {
          setJobs((prev) => {
            const index = prev.findIndex((j) => j.id === data.job.id);
            if (index !== -1) {
              const copy = [...prev];
              copy[index] = data.job;
              return copy;
            }
            return [data.job, ...prev];
          });
        }
      } catch (e) {
        console.warn('Error parsing SSE event:', e);
      }
    };

    return () => {
      sse.close();
    };
  }, []);

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  };

  const logout = () => {
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(console.error);
    }
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin_token');
  };

  const refreshStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn('Error fetching admin stats:', e);
    }
  }, [token]);

  const refreshJobs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.warn('Error fetching jobs:', e);
    }
  }, [token]);

  const refreshStorage = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/storage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStorageData(data);
      }
    } catch (e) {
      console.warn('Error fetching storage data:', e);
    }
  }, [token]);

  const refreshDuplicates = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/duplicates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data);
      }
    } catch (e) {
      console.warn('Error fetching duplicates:', e);
    }
  }, [token]);

  const inspectUrl = async (url: string): Promise<VideoInspectResult> => {
    const res = await fetch('/api/admin/inspect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Inspection failed');
    }
    return res.json();
  };

  const startDownloadJob = async (params: any): Promise<DownloadJob> => {
    const res = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Job creation failed');
    }
    const newJob = await res.json();
    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const cancelJob = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/admin/jobs/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  };

  const retryJob = async (id: string): Promise<DownloadJob | null> => {
    const res = await fetch(`/api/admin/jobs/${id}/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const retriedJob = await res.json();
      setJobs((prev) => [retriedJob, ...prev]);
      return retriedJob;
    }
    return null;
  };

  const updateStorageSettings = async (settings: Partial<StorageSettings>): Promise<boolean> => {
    const res = await fetch('/api/admin/storage/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      await refreshStorage();
      return true;
    }
    return false;
  };

  const cleanOrphans = async () => {
    const res = await fetch('/api/admin/storage/clean-orphans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return res.json();
    }
    return { success: false, removedCount: 0 };
  };

  const bulkUpdateTracks = async (trackIds: string[], updates: any): Promise<boolean> => {
    const res = await fetch('/api/admin/tracks/bulk', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackIds, updates }),
    });
    return res.ok;
  };

  const bulkDeleteTracks = async (trackIds: string[], deletePhysicalFiles: boolean): Promise<boolean> => {
    const res = await fetch('/api/admin/tracks/bulk', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackIds, deletePhysicalFiles }),
    });
    return res.ok;
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        jobs,
        inspectUrl,
        startDownloadJob,
        cancelJob,
        retryJob,
        refreshJobs,
        stats,
        refreshStats,
        storageData,
        refreshStorage,
        updateStorageSettings,
        cleanOrphans,
        duplicates,
        refreshDuplicates,
        bulkUpdateTracks,
        bulkDeleteTracks,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
