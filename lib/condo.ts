export const profiles = {
  admin: { name: 'Carla Martins', role: 'Administradora', unit: 'Administração', initials: 'CM', manager: true },
  syndic: { name: 'Roberto Nunes', role: 'Síndico', unit: 'Gestão', initials: 'RN', manager: true },
  resident: { name: 'Ana Costa', role: 'Moradora', unit: 'Bloco A · 204', initials: 'AC', manager: false },
  resident2: { name: 'Pedro Lima', role: 'Morador', unit: 'Bloco B · 102', initials: 'PL', manager: false },
  employee: { name: 'Marcos Alves', role: 'Funcionário', unit: 'Manutenção', initials: 'MA', manager: false },
} as const;
export type Profile = keyof typeof profiles;
export type Kind = 'notice' | 'booking' | 'maintenance' | 'incident';
export const areas = ['Salão de festas', 'Churrasqueira', 'Quadra esportiva'] as const;
export const statuses: Record<string,string> = { published:'Publicado', archived:'Arquivado', pending:'Pendente', confirmed:'Confirmada', rejected:'Recusada', cancelled:'Cancelado', open:'Aberto', triage:'Em triagem', progress:'Em andamento', waiting:'Aguardando recurso', completed:'Concluído', registered:'Registrada', analysis:'Em análise', closed:'Encerrada' };
export const transitions: Record<Kind,Record<string,string[]>> = {
  notice:{published:['archived'],archived:['published']},
  booking:{pending:['confirmed','rejected','cancelled'],confirmed:['cancelled']},
  maintenance:{open:['triage','cancelled'],triage:['progress','cancelled'],progress:['waiting','completed','cancelled'],waiting:['progress','cancelled'],completed:['triage']},
  incident:{registered:['analysis'],analysis:['closed'],closed:['analysis']},
};
export type Event = { at:string; actor:string; text:string; internal?:boolean };
export type Entry = {id:string; tenant:string; kind:Kind; title:string; description:string; category:string; location:string; status:string; priority:string; author:Profile; assigned:string; day:string; start:number; end:number; area:string; created:string; updated:string; history:Event[]; version:number; masked?:boolean};
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function tomorrow(){const date=new Date(`${today()}T12:00:00-03:00`);date.setDate(date.getDate()+1);return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function visible(e:Entry,p:Profile){return profiles[p].manager || e.kind==='notice'&&e.status==='published' || e.kind==='booking' || e.author===p || e.kind==='maintenance'&&p==='employee'&&e.assigned==='employee';}
export function allowedTransitions(e:Entry,p:Profile){
  const choices=transitions[e.kind][e.status]??[];
  if(profiles[p].manager)return choices;
  if(e.kind==='booking'&&e.author===p)return choices.filter(s=>s==='cancelled');
  if(e.kind==='maintenance'&&p==='employee'&&e.assigned==='employee')return choices.filter(s=>['progress','waiting','completed'].includes(s));
  return [];
}
export function dateLabel(date:string){if(!date)return '';return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(new Date(date.length===10?`${date}T12:00:00-03:00`:date));}
export function timeLabel(hour:number){return `${String(hour).padStart(2,'0')}:00`;}
