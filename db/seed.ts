import {database} from './index';
import {today, type Entry} from '@/lib/condo';

export function insert(e:Entry,ignore=false){
 return database().prepare(`INSERT ${ignore?'OR IGNORE ':''}INTO entries (id,tenant,kind,title,description,category,location,status,priority,author,assigned,day,start,end,area,created,updated,history,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(e.id,e.tenant,e.kind,e.title,e.description,e.category,e.location,e.status,e.priority,e.author,e.assigned,e.day,e.start,e.end,e.area,e.created,e.updated,JSON.stringify(e.history),e.version);
}
export async function seed(tenant:string){
 const db=database();
 if(await db.prepare('SELECT owner FROM workspaces WHERE owner=?').bind(tenant).first())return;
 const now=new Date().toISOString();
 const d=new Date(`${today()}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+2);const future=d.toISOString().slice(0,10);
 const base:Entry={id:'',tenant,kind:'notice',title:'',description:'',category:'Convivência',location:'',status:'published',priority:'Normal',author:'admin',assigned:'',day:'',start:0,end:0,area:'',created:now,updated:now,history:[],version:0};
 const samples:Partial<Entry>[]=[
  {kind:'notice',title:'Cuidar dos espaços é cuidar de todos.',description:'A limpeza dos reservatórios está programada para o próximo sábado, das 9h às 12h. Organize-se para uma breve interrupção no abastecimento. Agradecemos a colaboração!',category:'Manutenção programada'},
  {kind:'notice',title:'Um lembrete sobre o horário de silêncio',description:'Respeitar o descanso dos vizinhos faz parte de morar bem. Evite ruídos excessivos entre 22h e 8h. Caso precise de apoio, registre uma ocorrência para a administração.',category:'Convivência'},
  {kind:'notice',title:'Os espaços comuns esperam por você',description:'Consulte os horários disponíveis e reserve a churrasqueira, a quadra ou o salão de festas. As reservas passam pela aprovação da administração.',category:'Áreas comuns'},
  {kind:'maintenance',title:'Lâmpada apagada no corredor',description:'A iluminação próxima ao elevador do segundo andar está apagada.',category:'Elétrica',location:'Bloco A · 2º andar',status:'progress',author:'resident',assigned:'employee'},
  {kind:'maintenance',title:'Torneira com vazamento',description:'A torneira do jardim continua pingando mesmo quando fechada.',category:'Hidráulica',location:'Jardim central',status:'open',author:'resident2',priority:'Alta'},
  {kind:'maintenance',title:'Portão da garagem com ruído',description:'O portão faz um ruído durante a abertura. Solicito uma verificação.',category:'Estrutura',location:'Garagem',status:'triage',author:'resident'},
  {kind:'incident',title:'Barulho após o horário de silêncio',description:'Gostaria de apoio para orientar sobre o horário de uso das áreas comuns. Relato fictício para demonstração.',category:'Convivência',location:'Área de lazer',status:'registered',author:'resident'},
  {kind:'booking',title:'Reserva do salão de festas',description:'Encontro com a família.',category:'Reserva',status:'confirmed',author:'resident',day:future,start:18,end:21,area:'Salão de festas'},
  {kind:'booking',title:'Reserva da churrasqueira',description:'Almoço de fim de semana.',category:'Reserva',status:'pending',author:'resident2',day:future,start:11,end:14,area:'Churrasqueira'},
 ];
 const records=samples.map((s,i)=>({...base,...s,id:`${tenant}::sample-${i}`,history:[{at:now,actor:'Administração',text:'Exemplo fictício incluído na demonstração.'}]}));
 const statements=records.map(e=>insert(e,true));
 for(const e of records.filter(e=>e.kind==='booking'))for(let h=e.start;h<e.end;h++)statements.push(db.prepare('INSERT OR IGNORE INTO slots (tenant,area,day,hour,entry_id) VALUES (?,?,?,?,?)').bind(tenant,e.area,e.day,h,e.id));
 statements.push(db.prepare('INSERT OR IGNORE INTO workspaces (owner,created) VALUES (?,?)').bind(tenant,now));
 await db.batch(statements);
}
