'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { getCommonMasterLabel } from '@/lib/nav-config';
import { listCommonMaster, saveCommonMaster } from '@/lib/services/masters';
import type { CommonMasterRow } from '@/lib/types/master';

const inputCls = 'h-9 rounded-lg border border-slate-300 px-3 text-sm';

interface CommonMasterFormProps {
  catId: number;
}

export function CommonMasterForm({ catId }: CommonMasterFormProps) {
  const { token } = useAuth();
  const title = getCommonMasterLabel(catId);
  const [rows, setRows] = useState<CommonMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setRows(await listCommonMaster(token, catId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load master data.');
    } finally {
      setLoading(false);
    }
  }, [token, catId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(action: 'insert' | 'update' | 'delete', payload: { id?: number; name: string }) {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const res = await saveCommonMaster(token, catId, { ...payload, action });
      setRows(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    void persist('insert', { name: newName.trim() }).then(() => setNewName(''));
  }

  function startEdit(row: CommonMasterRow) {
    setEditId(row.id);
    setEditName(row.name);
  }

  function cancelEdit() {
    setEditId(null);
    setEditName('');
  }

  async function saveEdit(row: CommonMasterRow) {
    if (!editName.trim()) return;
    await persist('update', { id: row.id, name: editName.trim() });
    cancelEdit();
  }

  async function remove(row: CommonMasterRow) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await persist('delete', { id: row.id, name: row.name });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {loading && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Loading…</span>}
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter name"
          className={`${inputCls} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={!newName.trim() || saving}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="overflow-x-auto touch-scroll rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.id}</td>
                <td className="px-3 py-2">
                  {editId === row.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void saveEdit(row)}
                      className={inputCls}
                    />
                  ) : (
                    row.name
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {editId === row.id ? (
                      <>
                        <button type="button" onClick={() => void saveEdit(row)} disabled={saving} className="text-brand-primary hover:underline">
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} className="text-slate-500 hover:underline">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(row)} className="text-brand-primary hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => void remove(row)} disabled={saving} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
