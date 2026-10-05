'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { listUsers } from '@/lib/services/masters';
import type { UserMasterRow } from '@/lib/types/master';

export function UserMasterForm() {
  const { token } = useAuth();
  const [rows, setRows] = useState<UserMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setRows(await listUsers(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">User Master</h1>
        {loading && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Loading…</span>}
      </div>

      <p className="mb-4 text-sm text-slate-600">
        User list from spUserMaster. Full permission editing will be added in a follow-up.
      </p>

      {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto touch-scroll rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">User Name</th>
              <th className="px-3 py-2">Login Name</th>
              <th className="px-3 py-2">Role ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.id}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.loginName}</td>
                <td className="px-3 py-2">{row.roleId}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
