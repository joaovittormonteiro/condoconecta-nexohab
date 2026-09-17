import { type Entry, type Profile, profiles, today } from './condo';

const demoEntries = new Map<string, Entry[]>();

function cloneEntry(entry: Entry): Entry {
  return {
    ...entry,
    history: entry.history.map((item) => ({ ...item })),
  };
}

function makeSampleEntries(tenant: string): Entry[] {
  const now = new Date().toISOString();
  const date = new Date(`${today()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 2);
  const future = date.toISOString().slice(0, 10);

  const base: Entry = {
    id: '',
    tenant,
    kind: 'notice',
    title: '',
    description: '',
    category: 'Convivência',
    location: '',
    status: 'published',
    priority: 'Normal',
    author: 'admin',
    assigned: '',
    day: '',
    start: 0,
    end: 0,
    area: '',
    created: now,
    updated: now,
    history: [{ at: now, actor: profiles.admin.name, text: 'Exemplo fictício incluído na demonstração.' }],
    version: 0,
  };

  const samples: Partial<Entry>[] = [
    {
      kind: 'notice',
      title: 'Cuidar dos espaços é cuidar de todos.',
      description: 'A limpeza dos reservatórios está programada para o próximo sábado, das 9h às 12h. Organize-se para uma breve interrupção no abastecimento. Agradecemos a colaboração!',
      category: 'Manutenção programada',
    },
    {
      kind: 'notice',
      title: 'Um lembrete sobre o horário de silêncio',
      description: 'Respeitar o descanso dos vizinhos faz parte de morar bem. Evite ruídos excessivos entre 22h e 8h. Caso precise de apoio, registre uma ocorrência para a administração.',
      category: 'Convivência',
    },
    {
      kind: 'notice',
      title: 'Os espaços comuns esperam por você',
      description: 'Consulte os horários disponíveis e reserve a churrasqueira, a quadra ou o salão de festas. As reservas passam pela aprovação da administração.',
      category: 'Áreas comuns',
    },
    {
      kind: 'maintenance',
      title: 'Lâmpada apagada no corredor',
      description: 'A iluminação próxima ao elevador do segundo andar está apagada.',
      category: 'Elétrica',
      location: 'Bloco A · 2º andar',
      status: 'progress',
      author: 'resident',
      assigned: 'employee',
    },
    {
      kind: 'maintenance',
      title: 'Torneira com vazamento',
      description: 'A torneira do jardim continua pingando mesmo quando fechada.',
      category: 'Hidráulica',
      location: 'Jardim central',
      status: 'open',
      author: 'resident2',
      priority: 'Alta',
    },
    {
      kind: 'maintenance',
      title: 'Portão da garagem com ruído',
      description: 'O portão faz um ruído durante a abertura. Solicito uma verificação.',
      category: 'Estrutura',
      location: 'Garagem',
      status: 'triage',
      author: 'resident',
    },
    {
      kind: 'incident',
      title: 'Barulho após o horário de silêncio',
      description: 'Gostaria de apoio para orientar sobre o horário de uso das áreas comuns. Relato fictício para demonstração.',
      category: 'Convivência',
      location: 'Área de lazer',
      status: 'registered',
      author: 'resident',
    },
    {
      kind: 'booking',
      title: 'Reserva do salão de festas',
      description: 'Encontro com a família.',
      category: 'Reserva',
      status: 'confirmed',
      author: 'resident',
      day: future,
      start: 18,
      end: 21,
      area: 'Salão de festas',
    },
    {
      kind: 'booking',
      title: 'Reserva da churrasqueira',
      description: 'Almoço de fim de semana.',
      category: 'Reserva',
      status: 'pending',
      author: 'resident2',
      day: future,
      start: 11,
      end: 14,
      area: 'Churrasqueira',
    },
  ];

  const records = samples.map((sample, index) => ({
    ...base,
    ...sample,
    id: `${tenant}::sample-${index}`,
    history: [{ at: now, actor: 'Administração', text: 'Exemplo fictício incluído na demonstração.' }],
  })) as Entry[];

  return records;
}

export function ensureDemoEntries(tenant: string): Entry[] {
  if (!demoEntries.has(tenant)) {
    demoEntries.set(tenant, makeSampleEntries(tenant));
  }

  return demoEntries.get(tenant)!.map(cloneEntry);
}

export function listDemoEntries(tenant: string): Entry[] {
  return ensureDemoEntries(tenant).map(cloneEntry);
}

export function findDemoEntry(tenant: string, id: string): Entry | undefined {
  return listDemoEntries(tenant).find((entry) => entry.id === id);
}

export function persistDemoEntry(tenant: string, entry: Entry): Entry {
  const rows = demoEntries.get(tenant) ?? [];
  const index = rows.findIndex((candidate) => candidate.id === entry.id);
  if (index === -1) {
    rows.unshift(entry);
    demoEntries.set(tenant, rows);
    return cloneEntry(entry);
  }

  rows[index] = { ...entry, history: entry.history.map((item) => ({ ...item })) };
  demoEntries.set(tenant, rows);
  return cloneEntry(entry);
}

export function replaceDemoEntries(tenant: string, entries: Entry[]): Entry[] {
  const next = entries.map((entry) => ({ ...entry, history: entry.history.map((item) => ({ ...item })) }));
  demoEntries.set(tenant, next);
  return next.map(cloneEntry);
}

export function hasBookingConflict(tenant: string, candidate: Pick<Entry, 'area' | 'day' | 'start' | 'end'>): boolean {
  const rows = listDemoEntries(tenant);
  return rows.some((entry) => {
    if (entry.kind !== 'booking' || entry.status === 'cancelled' || entry.status === 'rejected') {
      return false;
    }

    if (entry.area !== candidate.area || entry.day !== candidate.day) {
      return false;
    }

    return candidate.start < entry.end && candidate.end > entry.start;
  });
}

export function demoTenantForUser(userId: string): string {
  return userId || 'demo-tenant';
}

export function canAccessProfileForDemo(profile: string): profile is Profile {
  return Object.prototype.hasOwnProperty.call(profiles, profile);
}
