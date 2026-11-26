// Legge un calendario in formato iCal e restituisce gli eventi di un giorno.
// Gestisce: eventi singoli, ripetizioni giornaliere/settimanali/mensili/annuali (RRULE con
// INTERVAL, BYDAY, UNTIL), date escluse (EXDATE), occorrenze spostate (RECURRENCE-ID),
// eventi annullati. Gli eventi di tutto il giorno non hanno un'ora e vengono saltati.
const pad = n => String(n).padStart(2, '0');
const chiave = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const GIORNI = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function leggiData(valore) {            // "20261116T110000Z", "20261116T110000", "20261116"
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(valore || ''); if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (h === undefined) return { data: new Date(+y, +mo - 1, +d), tuttoIlGiorno: true };
  // Con la Z è ora universale; senza, è l'ora "di parete" del fuso dell'evento, che trattiamo come ora locale.
  return { data: z ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi)) : new Date(+y, +mo - 1, +d, +h, +mi), tuttoIlGiorno: false };
}
function campi(blocco) {
  const out = {};
  for (const riga of blocco.split(/\r?\n/)) { const m = /^([A-Z-]+)((?:;[^:]*)?):(.*)$/.exec(riga); if (!m) continue; (out[m[1]] ||= []).push(m[3].trim()); }
  return out;
}
function regola(testo) { const r = {}; for (const pezzo of (testo || '').split(';')) { const [k, v] = pezzo.split('='); if (k) r[k] = v; } return r; }
const soloGiorno = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const giorniTra = (a, b) => Math.round((soloGiorno(b) - soloGiorno(a)) / 86400000);

function ricorreIl(inizio, rr, giorno) {
  const diff = giorniTra(inizio, giorno); if (diff < 0) return false;
  if (rr.UNTIL) { const fino = leggiData(rr.UNTIL); if (fino && soloGiorno(fino.data) < soloGiorno(giorno)) return false; }
  const ogni = Math.max(1, parseInt(rr.INTERVAL || '1'));
  if (rr.COUNT && diff > 0) {            // limite approssimato per difetto: evita di mostrare ripetizioni finite da tempo
    const passo = { DAILY: 1, WEEKLY: 7, MONTHLY: 30, YEARLY: 365 }[rr.FREQ] || 7;
    const perPasso = rr.FREQ === 'WEEKLY' && rr.BYDAY ? rr.BYDAY.split(',').length : 1;
    if (diff / (passo * ogni) * perPasso >= parseInt(rr.COUNT) + perPasso) return false;
  }
  if (rr.FREQ === 'DAILY') return diff % ogni === 0;
  if (rr.FREQ === 'WEEKLY') {
    const giorni = rr.BYDAY ? rr.BYDAY.split(',').map(g => g.replace(/^[+-]?\d+/, '')) : [GIORNI[inizio.getDay()]];
    if (!giorni.includes(GIORNI[giorno.getDay()])) return false;
    const lun = d => { const x = soloGiorno(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    return Math.round((lun(giorno) - lun(inizio)) / (7 * 86400000)) % ogni === 0;
  }
  if (rr.FREQ === 'MONTHLY') return giorno.getDate() === inizio.getDate() && ((giorno.getFullYear() - inizio.getFullYear()) * 12 + giorno.getMonth() - inizio.getMonth()) % ogni === 0;
  if (rr.FREQ === 'YEARLY') return giorno.getDate() === inizio.getDate() && giorno.getMonth() === inizio.getMonth() && (giorno.getFullYear() - inizio.getFullYear()) % ogni === 0;
  return false;
}

export function eventiDelGiorno(ics, giorno = new Date()) {
  const testo = String(ics || '').replace(/\r?\n[ \t]/g, '');    // righe spezzate
  const oggi = chiave(giorno); const eventi = [], spostate = new Set();
  const blocchi = testo.split('BEGIN:VEVENT').slice(1).map(b => campi(b.split('END:VEVENT')[0]));
  for (const c of blocchi) if (c['RECURRENCE-ID']) { const r = leggiData(c['RECURRENCE-ID'][0]); if (r) spostate.add(`${c.UID?.[0]}|${chiave(r.data)}`); }
  for (const c of blocchi) {
    if ((c.STATUS?.[0] || '') === 'CANCELLED') continue;
    const inizio = leggiData(c.DTSTART?.[0]); if (!inizio || inizio.tuttoIlGiorno) continue;
    let oggiSi;
    if (c['RECURRENCE-ID'] || !c.RRULE) oggiSi = chiave(inizio.data) === oggi;
    else {
      oggiSi = ricorreIl(inizio.data, regola(c.RRULE[0]), giorno);
      if (oggiSi && (c.EXDATE || []).some(riga => riga.split(',').some(v => { const e = leggiData(v); return e && chiave(e.data) === oggi; }))) oggiSi = false;
      if (oggiSi && spostate.has(`${c.UID?.[0]}|${oggi}`)) oggiSi = false;
    }
    if (!oggiSi) continue;
    const fine = leggiData(c.DTEND?.[0]); const minuti = fine ? Math.round((fine.data - inizio.data) / 60000) : null;
    const titolo = (c.SUMMARY?.[0] || 'Senza titolo').replace(/\\([,;])/g, '$1').replace(/\\n/gi, ' ').replace(/\\\\/g, '\\');
    eventi.push({ ora: `${inizio.data.getHours()}:${pad(inizio.data.getMinutes())}`, minuti, titolo });
  }
  return eventi.sort((a, b) => a.ora.padStart(5, '0').localeCompare(b.ora.padStart(5, '0')));
}
