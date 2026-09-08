export interface QuickAccessItem {
  quickAccessId?: number;
  userId?: number;
  userLoginName?: string;
  moduleKey: string;
  title: string;
  description?: string;
  route: string;
  icon: string;
  badgeText?: string;
  colorTheme?: string;
  orderIndex: number;
  isPinned: boolean;
  isActive: boolean;
}

export interface QuickAccessResponse {
  success: boolean;
  items: QuickAccessItem[];
  catalog?: QuickAccessItem[];
  error?: string;
  message?: string;
}

export async function fetchQuickAccess(
  token?: string,
  options?: { userId?: number; loginName?: string; includeCatalog?: boolean }
): Promise<QuickAccessResponse> {
  const params = new URLSearchParams();
  if (options?.userId) params.set('userId', String(options.userId));
  if (options?.loginName) params.set('loginName', options.loginName);
  if (options?.includeCatalog) params.set('includeCatalog', 'true');

  const res = await fetch(`/api/quick-access?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to load quick access: ${res.statusText}`);
  }

  return res.json();
}

export async function saveQuickAccess(
  token: string | undefined,
  data: {
    userId: number;
    loginName: string;
    modules: Array<{
      moduleKey: string;
      isPinned?: boolean;
      isActive?: boolean;
      orderIndex?: number;
    }>;
  }
): Promise<QuickAccessResponse> {
  const res = await fetch('/api/quick-access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to save quick access: ${res.statusText}`);
  }

  return res.json();
}

export async function resetQuickAccess(
  token: string | undefined,
  userId: number,
  loginName: string
): Promise<QuickAccessResponse> {
  const params = new URLSearchParams();
  params.set('userId', String(userId));
  params.set('loginName', loginName);

  const res = await fetch(`/api/quick-access?${params.toString()}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Failed to reset quick access: ${res.statusText}`);
  }

  return res.json();
}
