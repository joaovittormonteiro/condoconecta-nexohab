import {profiles,areas,statuses,visible,allowedTransitions,today,type Entry,type Profile} from '@/lib/condo';
import {canAccessProfileForDemo,demoTenantForUser,ensureDemoEntries,findDemoEntry,hasBookingConflict,persistDemoEntry} from '@/lib/demo-store';
import {z} from 'zod';

export const dynamic = 'force-dynamic';

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const response = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

function context(req: Request) {
  const profile = req.headers.get('x-demo-profile') ?? 'admin';
  if (!canAccessProfileForDemo(profile)) {
    throw new HttpError(400, 'Perfil inválido.');
  }

  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      throw new HttpError(403, 'Origem não autorizada.');
    }
    if (!req.headers.get('content-type')?.startsWith('application/json')) {
      throw new HttpError(415, 'Envie dados JSON.');
    }
  }

  return {
    tenant: demoTenantForUser('demo-user'),
    profile: profile as Profile,
    user: { userId: 'demo-user', displayName: 'Usuário de demonstração', email: 'demo@local.test', fullName: 'Usuário de demonstração' },
  };
}

async function body(req: Request) {
  const text = await req.text();
  if (text.length > 16000) throw new HttpError(413, 'Conteúdo muito longo.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Dados inválidos.');
  }
}

function sanitize(e: Entry, p: Profile): Entry {
  if (e.kind === 'booking' && !profiles[p].manager && e.author !== p) {
    return { ...e, title: 'Horário ocupado', description: '', author: '' as Profile, assigned: '', location: '', history: [], masked: true, tenant: '' };
  }
  return { ...e, tenant: '', history: e.history.filter((h) => !h.internal || profiles[p].manager) };
}

function failure(e: unknown) {
  if (e instanceof HttpError) return response({ error: e.message }, e.status);
  if (e instanceof z.ZodError) return response({ error: e.issues[0]?.message ?? 'Verifique os campos.' }, 400);
  console.error('CondoConecta request failed', e instanceof Error ? e.message : 'unknown');
  return response({ error: 'Não foi possível concluir agora. Seus dados no formulário foram preservados. Tente novamente.' }, 503);
}

const createSchema = z.object({
  kind: z.enum(['notice', 'booking', 'maintenance', 'incident']),
  title: z.string().trim().min(4, 'Use um título com pelo menos 4 caracteres.').max(120, 'O título deve ter até 120 caracteres.'),
  description: z.string().trim().min(8, 'Descreva com pelo menos 8 caracteres.').max(3000, 'A descrição deve ter até 3000 caracteres.'),
  category: z.string().trim().min(1, 'Selecione uma categoria.').max(60),
  location: z.string().trim().max(120).default(''),
  priority: z.enum(['Baixa', 'Normal', 'Alta']).default('Normal'),
  day: z.string().default(''),
  start: z.number().int().default(0),
  end: z.number().int().default(0),
  area: z.string().default(''),
}).strict();

const updateSchema = z.object({
  id: z.string().min(1).max(200),
  version: z.number().int().nonnegative(),
  status: z.string().max(30).optional(),
  assigned: z.enum(['', 'employee']).optional(),
  note: z.string().trim().min(4, 'Escreva uma atualização com pelo menos 4 caracteres.').max(1500),
  internal: z.boolean().default(false),
}).strict();

export async function GET(req: Request) {
  try {
    const { tenant, profile, user } = context(req);
    const entries = ensureDemoEntries(tenant)
      .filter((e) => visible(e, profile))
      .filter((e) => e.kind !== 'booking' || profiles[profile].manager || e.author === profile || ['pending', 'confirmed'].includes(e.status))
      .map((e) => sanitize(e, profile));

    return response({ entries, profile, account: user.displayName });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request) {
  try {
    const { tenant, profile } = context(req);
    const v = createSchema.parse(await body(req));

    if (v.kind === 'notice' && !profiles[profile].manager) throw new HttpError(403, 'Apenas a gestão pode publicar comunicados.');
    if (v.kind === 'booking' && profile === 'employee') throw new HttpError(403, 'Reservas são feitas por moradores ou pela gestão.');
    if (['maintenance', 'incident'].includes(v.kind) && !v.location) throw new HttpError(400, 'Informe o local.');

    if (v.kind === 'booking') {
      if (!areas.includes(v.area as typeof areas[number])) throw new HttpError(400, 'Selecione uma área válida.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.day) || Number.isNaN(Date.parse(v.day)) || new Date(`${v.day}T12:00:00Z`).toISOString().slice(0, 10) !== v.day) throw new HttpError(400, 'Data inválida.');
      const distance = (Date.parse(v.day) - Date.parse(today())) / 86400000;
      if (distance < 1 || distance > 90) throw new HttpError(400, 'Reserve de amanhã até 90 dias à frente.');
      if (v.start < 8 || v.end > 22 || v.end <= v.start || v.end - v.start > 6) throw new HttpError(400, 'Escolha de 1 a 6 horas, entre 8h e 22h.');
      if (hasBookingConflict(tenant, { area: v.area, day: v.day, start: v.start, end: v.end })) throw new HttpError(409, 'Esse horário já está ocupado. Escolha outro período.');
    }

    const now = new Date().toISOString();
    const e: Entry = {
      ...v,
      id: crypto.randomUUID(),
      tenant,
      author: profile,
      assigned: '',
      status: { notice: 'published', booking: 'pending', maintenance: 'open', incident: 'registered' }[v.kind],
      created: now,
      updated: now,
      history: [{ at: now, actor: profiles[profile].name, text: 'Registro criado.' }],
      version: 0,
    };

    persistDemoEntry(tenant, e);
    return response({ entry: sanitize(e, profile) }, 201);
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const { tenant, profile } = context(req);
    const v = updateSchema.parse(await body(req));
    const raw = findDemoEntry(tenant, v.id);
    if (!raw) throw new HttpError(404, 'Registro não encontrado.');

    const e = { ...raw };
    if (!visible(e, profile) || (e.kind === 'booking' && !profiles[profile].manager && e.author !== profile)) {
      throw new HttpError(404, 'Registro não encontrado.');
    }

    const manager = profiles[profile].manager;
    const worker = profile === 'employee' && e.kind === 'maintenance' && e.assigned === 'employee';
    const own = e.author === profile;
    if (!manager && !worker && (!own || !['maintenance', 'incident', 'booking'].includes(e.kind))) {
      throw new HttpError(403, 'Você não pode atualizar este registro.');
    }
    if (v.status && v.status !== e.status && !allowedTransitions(e, profile).includes(v.status)) {
      throw new HttpError(403, 'Mudança de situação não permitida.');
    }
    if (v.assigned !== undefined && (!manager || e.kind !== 'maintenance')) {
      throw new HttpError(403, 'Apenas a gestão pode atribuir chamados.');
    }
    if (v.internal && (!manager || e.kind !== 'incident')) {
      throw new HttpError(403, 'Nota interna não permitida.');
    }
    if (e.version !== v.version) {
      throw new HttpError(409, 'Este registro mudou. Atualize a página antes de salvar.');
    }

    const status = v.status ?? e.status;
    const assigned = v.assigned ?? e.assigned;
    if (e.kind === 'maintenance' && status === 'progress' && !assigned) {
      throw new HttpError(400, 'Atribua um responsável antes de iniciar o atendimento.');
    }

    const now = new Date().toISOString();
    if (v.internal && (status !== e.status || assigned !== e.assigned)) {
      throw new HttpError(400, 'Envie a nota interna separadamente da mudança de situação.');
    }

    const text = [
      status !== e.status ? `Situação: ${statuses[status]}.` : '',
      assigned !== e.assigned ? `Responsável: ${assigned ? profiles.employee.name : 'não atribuído'}.` : '',
      v.note,
    ].filter(Boolean).join(' ');

    const history = [...e.history, { at: now, actor: profiles[profile].name, text, internal: v.internal }];
    const updated = { ...e, status, assigned, history, updated: now, version: e.version + 1 };
    persistDemoEntry(tenant, updated);

    return response({ entry: sanitize(updated, profile) });
  } catch (e) {
    return failure(e);
  }
}
