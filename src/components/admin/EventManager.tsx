"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Event } from "@/db/schema";

const empty = { name: "", slug: "", eventDate: "", location: "", prizePool: "", maxSlots: "16", allowTwoSlots: false, registrationOpen: true };

export default function EventManager({ events, canManage }: { events: Event[]; canManage: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Event | null>(null);
  const [busy, setBusy] = useState(false);
  const value = editing ? {
    name: editing.name, slug: editing.slug,
    eventDate: new Date(editing.eventDate).toISOString().slice(0, 16),
    location: editing.location, prizePool: String(editing.prizePool), maxSlots: String(editing.maxSlots),
    allowTwoSlots: editing.allowTwoSlots, registrationOpen: editing.registrationOpen,
  } : form;
  const set = (key: keyof typeof empty, val: string | boolean) => editing
    ? setEditing({ ...editing, [key]: key === "prizePool" || key === "maxSlots" ? Number(val) : val })
    : setForm((current) => ({ ...current, [key]: val }));

  const save = async () => {
    setBusy(true);
    const payload = { ...value, prizePool: Number(value.prizePool), maxSlots: Number(value.maxSlots) };
    try {
      const res = await fetch(editing ? `/api/admin/events/${editing.id}` : "/api/admin/events", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Event gagal disimpan");
      toast.success(editing ? "Event diperbarui" : "Event berhasil dibuat");
      setEditing(null); setForm(empty); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Event gagal disimpan"); }
    finally { setBusy(false); }
  };

  const remove = async (event: Event) => {
    if (!confirm(`Hapus ${event.name} beserta peserta dan bracket-nya?`)) return;
    const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Event dihapus"); router.refresh(); } else toast.error("Event gagal dihapus");
  };

  return <div className="space-y-6">
    {canManage && <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-500">Event studio</p><h2 className="mt-1 text-xl font-black text-gray-900">{editing ? "Edit event" : "Buat event baru"}</h2></div>
        {editing && <button onClick={() => setEditing(null)} className="text-sm font-bold text-gray-500">Batal</button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nama event"><input value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="MLBB Night Tournament" className="input-field" /></Field>
        <Field label="Slug URL (opsional)"><input value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder="Dibuat otomatis dari nama" className="input-field" /></Field>
        <Field label="Jadwal"><input type="datetime-local" value={value.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="input-field" /></Field>
        <Field label="Lokasi"><input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="Warkop Sippo Wiyung" className="input-field" /></Field>
        <Field label="Prize pool (Rp)"><input type="number" min="0" value={value.prizePool} onChange={(e) => set("prizePool", e.target.value)} placeholder="1500000" className="input-field" /></Field>
        <Field label="Maksimal slot"><input type="number" min="2" value={value.maxSlots} onChange={(e) => set("maxSlots", e.target.value)} className="input-field" /></Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        <Toggle checked={value.allowTwoSlots} onChange={(v) => set("allowTwoSlots", v)} label="Izinkan tim daftar 2 slot" />
        <Toggle checked={value.registrationOpen} onChange={(v) => set("registrationOpen", v)} label="Pendaftaran dibuka" />
      </div>
      <button onClick={save} disabled={busy || !value.name || !value.eventDate || !value.location} className="mt-6 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 disabled:opacity-50">
        {busy ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Event"}
      </button>
    </section>}

    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-black text-gray-900">Semua Event</h2></div>
      {events.length === 0 ? <div className="px-6 py-16 text-center text-sm text-gray-400">Belum ada event. Buat event pertama Anda.</div> :
      <div className="divide-y divide-gray-100">{events.map((event) => <article key={event.id} className="grid gap-4 p-5 transition hover:bg-orange-50/30 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-gray-900">{event.name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${event.registrationOpen ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{event.registrationOpen ? "Pendaftaran buka" : "Ditutup"}</span></div>
        <p className="mt-1 text-sm text-gray-500">{new Date(event.eventDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {event.location}</p>
        <p className="mt-2 text-xs font-bold text-orange-600">Rp {event.prizePool.toLocaleString("id-ID")} · {event.maxSlots} slot · /event/{event.slug}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/events/${event.id}`} className="action">Detail</Link>
          <Link href={`/admin/events/${event.id}/bracket`} className="action">Bracket</Link>
          <Link href={`/event/${event.slug}`} target="_blank" className="action">Publik ↗</Link>
          {canManage && <><button onClick={() => setEditing(event)} className="action">Edit</button><button onClick={() => remove(event)} className="action text-red-500!">Hapus</button></>}
        </div>
      </article>)}</div>}
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5 text-sm font-bold text-gray-700"><span>{label}</span>{children}</label>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-orange-500" />{label}</label>; }
