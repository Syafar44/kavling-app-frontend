"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type MenuData = { id: number; nama: string; url: string; urutan: number; parent_id: number | null };
type HakAksesData = { id_user: number; id_menu: number; lihat: boolean; beranda: boolean; tambah: boolean; edit: boolean; hapus: boolean };
type MatrixRow = { menu: MenuData; hak_akses: HakAksesData };

type UserOption = { id: number; nama_lengkap: string; username: string };
type UserPerms = Record<number, { lihat: boolean; beranda: boolean; tambah: boolean; edit: boolean; hapus: boolean }>;

const PER_PAGE = 15;

export default function HakAksesPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [perms, setPerms] = useState<UserPerms>({});
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<ApiResponse<UserOption[]>>("/users").then((res) => setUsers(res.data.data ?? [])).catch(() => {});
  }, []);

  const fetchMatrix = useCallback(async (userId: number) => {
    try {
      const res = await api.get<{ success: boolean; data: MatrixRow[] }>(`/hak-akses?id_user=${userId}`);
      const rows = res.data.data ?? [];
      setMatrix(rows);
      const p: UserPerms = {};
      rows.forEach(({ menu, hak_akses }) => {
        p[menu.id] = {
          lihat: hak_akses.lihat,
          beranda: hak_akses.beranda,
          tambah: hak_akses.tambah,
          edit: hak_akses.edit,
          hapus: hak_akses.hapus,
        };
      });
      setPerms(p);
      setPage(1);
    } catch {
      addToast("Gagal memuat hak akses", "error");
    }
  }, [addToast]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const menuById = Object.fromEntries(matrix.map((r) => [r.menu.id, r.menu]));

  const totalPages = Math.ceil(matrix.length / PER_PAGE);
  const pageRows = matrix.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggle(menuId: number, field: keyof UserPerms[number]) {
    setPerms((prev) => ({ ...prev, [menuId]: { ...prev[menuId], [field]: !prev[menuId]?.[field] } }));
  }

  async function handleSave() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const permissions = matrix.map(({ menu }) => ({
        id_menu: menu.id,
        lihat: perms[menu.id]?.lihat ?? false,
        beranda: perms[menu.id]?.beranda ?? false,
        tambah: perms[menu.id]?.tambah ?? false,
        edit: perms[menu.id]?.edit ?? false,
        hapus: perms[menu.id]?.hapus ?? false,
      }));
      await api.put("/hak-akses/bulk", { id_user: selectedUser.id, permissions });
      addToast("Hak akses berhasil disimpan", "success");
    } catch {
      addToast("Gagal menyimpan hak akses", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Hak Akses</h1>

      {/* Pilih Pengguna */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-700 font-medium w-32">Pilih Pengguna</span>
        <div className="relative w-72" ref={dropRef}>
          {selectedUser ? (
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
              <span className="flex-1 text-gray-700">{selectedUser.nama_lengkap || selectedUser.username}</span>
              <button onClick={() => { setSelectedUser(null); setMatrix([]); setPerms({}); }} className="text-gray-400 hover:text-gray-600 ml-2">×</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="w-full text-left border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-400 bg-white"
              >
                Pilih Pengguna
              </button>
              {dropOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border-b border-gray-200 px-3 py-2 text-sm focus:outline-none"
                    placeholder="Cari pengguna..."
                  />
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Tidak ada pengguna</div>
                  ) : filteredUsers.map((u, i) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setDropOpen(false); setSearch(""); fetchMatrix(u.id); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${i === 0 ? "bg-blue-500 text-white hover:bg-blue-600" : "text-gray-700"}`}
                    >
                      {u.nama_lengkap || u.username}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Induk Menu</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Judul Menu</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">URL</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700">Lihat</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700">Beranda</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700">Tambah</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700">Edit</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    {selectedUser ? "Tidak ada data menu" : "Pilih pengguna terlebih dahulu"}
                  </td>
                </tr>
              ) : (
                pageRows.map(({ menu }, idx) => {
                  const parentMenu = menu.parent_id ? menuById[menu.parent_id] : null;
                  const p = perms[menu.id] ?? { lihat: false, beranda: false, tambah: false, edit: false, hapus: false };
                  return (
                    <tr key={menu.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{parentMenu?.nama ?? "Induk"}</td>
                      <td className="px-4 py-3 text-gray-700">{menu.nama}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{menu.url}</td>
                      {(["lihat", "beranda", "tambah", "edit", "hapus"] as const).map((field) => (
                        <td key={field} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={p[field]}
                            onChange={() => toggle(menu.id, field)}
                            className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>
            {matrix.length === 0
              ? "Showing 0 to 0 of 0 entries"
              : `Showing ${(page - 1) * PER_PAGE + 1} to ${Math.min(page * PER_PAGE, matrix.length)} of ${matrix.length} entries`}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded border text-sm ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))} disabled={page >= (totalPages || 1)}
              className="px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Simpan */}
      {selectedUser && (
        <Button onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white">
          {saving ? "Menyimpan..." : "Simpan Hak Akses"}
        </Button>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
