import type { Facility, TimeSlot } from '../types';
import { mockFacilities, mockTimeSlots } from '../data/mockData';

const base = () => import.meta.env.VITE_API_URL ?? '';

export function getStoredUserId(): string | null {
  return localStorage.getItem('biola_user_id');
}

export function getStoredUserName(): string | null {
  return localStorage.getItem('biola_user_name');
}

function headers(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  const uid = getStoredUserId();
  if (uid) h.set('X-User-Id', uid);
  return h;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: headers(init?.headers),
  });
  const data = await parseJson<{ message?: string } & Record<string, unknown>>(res);
  if (!res.ok) {
    const msg = typeof data?.message === 'string' ? data.message : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  if (res.status === 204) return undefined as T;
  return data as T;
}

export async function registerUser(name: string): Promise<{ id: string; name: string }> {
  return apiFetch('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: headers(),
  });
}

export async function fetchMe(): Promise<{ id: string; name: string }> {
  return apiFetch('/api/users/me');
}

// NOTE: no live database is currently connected for this deployment. Every
// read below falls back to local sample data (app/data/mockData.ts) so the
// UI still has something to show instead of an error banner. Once a real
// database + API is wired back up, these fallbacks simply stop triggering
// (the try block above each one still runs first).

export async function fetchStats(): Promise<{ facilityCount: number; activeSlotCount: number }> {
  try {
    return await apiFetch('/api/stats');
  } catch {
    return { facilityCount: mockFacilities.length, activeSlotCount: mockTimeSlots.length };
  }
}
export async function fetchFacilities(params?: {
  search?: string;
  type?: 'all' | 'campus' | 'park';
  sport?: string;
}): Promise<Facility[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.type && params.type !== 'all') q.set('type', params.type);
  if (params?.sport) q.set('sport', params.sport);
  const qs = q.toString();
  try {
    return await apiFetch(`/api/facilities${qs ? `?${qs}` : ''}`);
  } catch {
    const search = params?.search?.toLowerCase();
    return mockFacilities.filter((f) => {
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search) ||
        f.location.toLowerCase().includes(search) ||
        f.sports.some((s) => s.toLowerCase().includes(search));
      const matchesType = !params?.type || params.type === 'all' || f.type === params.type;
      const matchesSport =
        !params?.sport || f.sports.some((s) => s.toLowerCase() === params.sport!.toLowerCase());
      return matchesSearch && matchesType && matchesSport;
    });
  }
}

export async function fetchFacility(id: string): Promise<Facility> {
  try {
    return await apiFetch(`/api/facilities/${encodeURIComponent(id)}`);
  } catch (e) {
    const found = mockFacilities.find((f) => f.id === id);
    if (found) return found;
    throw e;
  }
}

export async function fetchTimeSlots(params?: {
  facilityId?: string;
  sport?: string;
  from?: string;
  to?: string;
}): Promise<TimeSlot[]> {
  const q = new URLSearchParams();
  if (params?.facilityId) q.set('facilityId', params.facilityId);
  if (params?.sport) q.set('sport', params.sport);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const qs = q.toString();
  try {
    return await apiFetch(`/api/time-slots${qs ? `?${qs}` : ''}`);
  } catch {
    return mockTimeSlots.filter((t) => {
      const matchesFacility = !params?.facilityId || t.facilityId === params.facilityId;
      const matchesSport = !params?.sport || t.sport.toLowerCase() === params.sport!.toLowerCase();
      const matchesFrom = !params?.from || t.date >= params.from;
      const matchesTo = !params?.to || t.date <= params.to;
      return matchesFacility && matchesSport && matchesFrom && matchesTo;
    });
  }
}
export async function fetchMyReservations(): Promise<TimeSlot[]> {
  try {
    return await apiFetch('/api/my/reservations');
  } catch {
    return [];
  }
}

export async function createTimeSlot(
  facilityId: string,
  body: {
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
  }
): Promise<TimeSlot> {
  return apiFetch(`/api/facilities/${encodeURIComponent(facilityId)}/time-slots`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function joinTimeSlot(slotId: string, fromSlotId?: string): Promise<TimeSlot> {
  return apiFetch(`/api/time-slots/${encodeURIComponent(slotId)}/join`, {
    method: 'POST',
    body: JSON.stringify(fromSlotId ? { fromSlotId } : {}),
  });
}

export async function leaveTimeSlot(slotId: string): Promise<void> {
  await apiFetch(`/api/time-slots/${encodeURIComponent(slotId)}/join`, {
    method: 'DELETE',
  });
}
