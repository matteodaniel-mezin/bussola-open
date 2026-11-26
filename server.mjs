// Bussola: server locale. Legge e scrive il vault Obsidian, serve le pagine.
// Nessuna dipendenza. Ascolta solo su 127.0.0.1.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { eventiDelGiorno } from './calendario.mjs';
import { readFileSync } from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Configurazione: config.local.json nella cartella del progetto (copia di config.esempio.json). Non va su GitHub.
// "vault" è il percorso del tuo vault Obsidian; "~" vale la tua cartella utente. Senza file si usa il vault di esempio.
const CONFIG = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'config.local.json'), 'utf8')); } catch { return {}; } })();
const espandi = p => String(p || '').replace(/^~(?=$|\/)/, os.homedir());
// Senza un vault configurato Bussola non mostra dati: chiede di collegarne uno (lo fa Claude nell'onboarding).
const DA_CONFIGURARE = !process.env.BUSSOLA_VAULT && !CONFIG.vault;
const VAULT = DA_CONFIGURARE ? null : path.resolve(HERE, espandi(process.env.BUSSOLA_VAULT || CONFIG.vault));
// Il vault di esempio (strumenti/crea-esempio.mjs) si usa solo per le prove, indicandolo a mano: BUSSOLA_VAULT=vault-esempio.
const ESEMPIO = !!VAULT && path.basename(VAULT) === 'vault-esempio';
const PIANO = VAULT ? path.join(VAULT, 'Piano') : null;
const PORT = Number(process.env.BUSSOLA_PORT || CONFIG.porta || 4321);
const AREE = ['lavoro', 'gioco', 'amore', 'salute'];
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// ---------- date ----------
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const oggiIso = () => iso(new Date());
const daIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const titoloGiorno = s => { const d = daIso(s); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
function settimanaIso(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const g = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - g);
  const inizio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${pad(Math.ceil(((t - inizio) / 86400000 + 1) / 7))}`;
}
function giorniDellaSettimana(d) {
  const lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(lun); x.setDate(lun.getDate() + i); return iso(x); });
}

// ---------- file ----------
async function leggi(p) { try { return await fs.readFile(p, 'utf8'); } catch { return null; } }
async function scrivi(p, testo) { await fs.mkdir(path.dirname(p), { recursive: true }); const tmp = p + '.tmp'; await fs.writeFile(tmp, testo); await fs.rename(tmp, p); }
async function elenco(dir) { try { return (await fs.readdir(dir)).filter(f => !f.startsWith('.')); } catch { return []; } }

function frontmatter(testo) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(testo || '');
  const dati = {};
  if (m) for (const riga of m[1].split('\n')) { const i = riga.indexOf(':'); if (i > 0) dati[riga.slice(0, i).trim()] = riga.slice(i + 1).trim().replace(/^"(.*)"$/, '$1'); }
  return { dati, corpo: m ? testo.slice(m[0].length) : (testo || '') };
}
const conFrontmatter = (dati, corpo) => `---\n${Object.entries(dati).map(([k, v]) => `${k}: ${v ?? ''}`).join('\n')}\n---\n${corpo}`;
function sezioni(corpo) {
  const out = {}; let nome = '_';
  for (const riga of corpo.split('\n')) { const m = /^##\s+(.+)$/.exec(riga); if (m) { nome = m[1].trim(); out[nome] = []; } else (out[nome] ||= []).push(riga); }
  return out;
}
// "- [x] testo #area (nota)" oppure "- testo #area"
function voce(riga) {
  const m = /^\s*-\s+(?:\[( |x|X)\]\s+)?(.*)$/.exec(riga); if (!m || !m[2].trim()) return null;
  let testo = m[2].trim(); let area = null;
  testo = testo.replace(/\s+#(\w+)\s*$/, (_, a) => { if (AREE.includes(a)) { area = a; return ''; } return _; });
  let tempo = null; testo = testo.replace(/\s+~\((.+?)\)\s*$/, (_, t) => { tempo = t; return ''; });
  let nota = null; testo = testo.replace(/\s+@\((.+?)\)\s*$/, (_, n) => { nota = n; return ''; });
  return { testo, area, nota, tempo, fatto: m[1] ? m[1].toLowerCase() === 'x' : false, casella: m[1] !== undefined };
}
const rigaVoce = v => `- [${v.fatto ? 'x' : ' '}] ${v.testo}${v.nota ? ` @(${v.nota})` : ''}${v.tempo ? ` ~(${v.tempo})` : ''}${v.area ? ` #${v.area}` : ''}`;
// "Demo cliente 11:00 1h" -> testo "Demo cliente", tempo "11:00 · 1 h"
function separaTempo(testo) {
  let ora = null, durata = null;
  testo = testo.replace(/(?:^|\s)(?:alle\s+)?(\d{1,2})[:.](\d{2})(?=\s|$)/i, (_, h, m) => { ora = `${+h}:${m}`; return ' '; });
  testo = testo.replace(/(?:^|\s)(\d{1,3})\s?(min|m|h|ore|ora)(?=\s|$)/i, (_, n, u) => { durata = /^m/i.test(u) ? `${n} min` : `${n} h`; return ' '; });
  return { testo: testo.replace(/\s+/g, ' ').trim(), tempo: [ora, durata].filter(Boolean).join(' · ') || null };
}
const voci = righe => (righe || []).map(voce).filter(Boolean);
const testoLibero = righe => (righe || []).filter(r => !/^\s*-\s/.test(r)).join('\n').trim();

// ---------- giorno ----------
const fileGiorno = d => path.join(PIANO, 'Giorni', `${d}.md`);
async function leggiGiorno(d) {
  const t = await leggi(fileGiorno(d)); if (t == null) return null;
  const { dati, corpo } = frontmatter(t); const s = sezioni(corpo);
  // Righe "- 9:30 Titolo" o, con la fine, "- 10:00-13:30 Titolo": la fine serve a disegnare il blocco lungo quanto l'evento.
  const agendaFile = (s['Agenda'] || []).map(r => /^\s*-\s+(\d{1,2}:\d{2})(?:\s*[-–]\s*(\d{1,2}:\d{2}))?\s+(.+)$/.exec(r)).filter(Boolean).map(m => ({ ora: m[1].replace(/^0/, ''), ...(m[2] ? { fine: m[2].replace(/^0/, '') } : {}), titolo: m[3].trim() }));
  return { data: d, voto: dati.voto ? Number(dati.voto) : null, frase: dati.frase || null, fonte: dati.fonte || null, votoDa: dati.voto_da || null, preparato: String(dati.preparato || '').trim() === 'si', todo: voci(s['Da fare']), proposte: voci(s['Proposte']), agenda: agendaFile, sera: testoLibero(s['Sera']) };
}
async function salvaGiorno(g) {
  const ag = (g.agenda || []).length ? `\n## Agenda\n${g.agenda.map(e => `- ${e.ora}${e.fine ? '-' + e.fine : ''} ${e.titolo}`).join('\n')}\n` : '';
  // "Proposte": cose che Claude suggerisce per quel giorno. Entrano nei da fare solo se le accetti.
  const pr = (g.proposte || []).length ? `\n## Proposte\n${g.proposte.map(v => rigaVoce(v).replace(/^- \[[ x]\] /, '- ')).join('\n')}\n` : '';
  const corpo = `# ${titoloGiorno(g.data)}\n\n## Da fare\n${g.todo.map(rigaVoce).join('\n')}\n${pr}${ag}\n## Sera\n${g.sera || ''}\n`;
  await scrivi(fileGiorno(g.data), conFrontmatter({ tipo: 'giorno', data: g.data, voto: g.voto ?? '', ...(g.frase ? { frase: g.frase } : {}), ...(g.fonte ? { fonte: g.fonte } : {}), ...(g.votoDa && g.voto ? { voto_da: g.votoDa } : {}) }, corpo));
}
async function giornoDiOggi() {
  const d = oggiIso(); let g = await leggiGiorno(d); if (g && !g.preparato) return g;
  // Un giorno preparato in anticipo (frontmatter "preparato: si") riceve comunque abitudini e cose rimaste, la prima volta che diventa oggi.
  const pronto = g;
  // Nuovo giorno: abitudini + cose non fatte dell'ultimo giorno registrato.
  // Abitudini: "- testo #area" vale ogni giorno; "- testo @(lun,mar,mer,gio) #area" solo in quei giorni.
  const SIGLE = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']; const oggiSigla = SIGLE[new Date().getDay()];
  const todo = voci(sezioni(frontmatter(await leggi(path.join(PIANO, 'Abitudini.md')) || '').corpo)['Ogni giorno']).filter(v => { const g = (v.nota || '').toLowerCase().split(/[\s,]+/).filter(x => SIGLE.includes(x)); return !g.length || g.includes(oggiSigla); }).map(v => ({ ...v, fatto: false, nota: (v.nota || '').trim() ? 'abitudine' : 'ogni giorno' }));
  const precedenti = (await elenco(path.join(PIANO, 'Giorni'))).map(f => f.replace('.md', '')).filter(x => x < d).sort();
  if (precedenti.length) {
    const ieri = await leggiGiorno(precedenti.at(-1));
    for (const v of ieri.todo) if (!v.fatto && v.nota !== 'ogni giorno' && v.nota !== 'abitudine' && !todo.some(t => t.testo === v.testo)) todo.push({ ...v, nota: v.nota || 'da prima' });
  }
  if (pronto) {
    const abit = todo.filter(v => ['abitudine', 'ogni giorno'].includes(v.nota) && !pronto.todo.some(t => t.testo === v.testo));
    const resto = todo.filter(v => !abit.includes(v) && !['abitudine', 'ogni giorno'].includes(v.nota) && !pronto.todo.some(t => t.testo === v.testo));
    g = { ...pronto, preparato: false, todo: [...abit, ...pronto.todo, ...resto] }; await salvaGiorno(g); return g;
  }
  g = { data: d, voto: null, frase: null, todo, proposte: [], agenda: [], sera: '' }; await salvaGiorno(g); return g;
}

// Voto stimato, quando nel file non c'è: così ogni giorno ha un numero senza doverlo mettere a mano.
// Parte da 3; conta quante cose sono state fatte, in quante aree, e il tono della nota della sera.
// È una stima grezza: la sera Claude ne scrive una ragionata nel file (voto_da: claude), e puoi sempre cambiarla.
function votoStimato(g) {
  const fatte = g.todo.filter(t => t.fatto), sera = (g.sera || '').toLowerCase(); if (!fatte.length && !sera) return null;
  let v = 3; if (fatte.length >= 4) v += 1; if (fatte.length <= 1) v -= 1; if (new Set(fatte.map(t => t.area).filter(Boolean)).size >= 2) v += 0.5;
  const giu = (sera.match(/poco produttiv|non ho fatto niente|sul divano|stanc|ero morto|perso tempo|male|svogliat/g) || []).length, su = (sera.match(/(?<!poco )produttiv|content|soddisf|bene|bella giornata|carico|felice/g) || []).length;
  v += Math.min(1.5, su * 0.75) - Math.min(2, giu * 0.75);
  return Math.max(1, Math.min(5, Math.round(v)));
}

// ---------- obiettivi, bussola, settimana ----------
const ORIZZONTI = [['due_anni', 'Tra 2 anni'], ['sei_mesi', 'Tra 6 mesi'], ['mese', 'Questo mese']];
async function leggiObiettivi() {
  const t = await leggi(path.join(PIANO, 'Obiettivi.md')); if (t == null) return null;
  const s = sezioni(frontmatter(t).corpo); const out = {};
  for (const [k, titolo] of ORIZZONTI) out[k] = voci(s[titolo]).map(({ testo, area }) => ({ testo, area }));
  return out;
}
async function salvaObiettivi(ob) {
  let corpo = '# Obiettivi\n\nScritti nella piattaforma Bussola. Da qui Claude ricava la settimana e i da fare.\n';
  for (const [k, titolo] of ORIZZONTI) corpo += `\n## ${titolo}\n${(ob[k] || []).filter(o => o.testo?.trim()).map(o => `- ${o.testo.trim()}${AREE.includes(o.area) ? ` #${o.area}` : ''}`).join('\n')}\n`;
  await scrivi(path.join(PIANO, 'Obiettivi.md'), conFrontmatter({ tipo: 'obiettivi', aggiornato: oggiIso() }, corpo));
}
async function leggiBussola() {
  const t = await leggi(path.join(PIANO, 'Bussola.md')); if (t == null) return null;
  const { dati, corpo } = frontmatter(t); const s = sezioni(corpo); const aree = {};
  for (const v of voci(s['Come va adesso'])) { const m = /^(\w+):\s*(\d)/.exec(v.testo); if (m) aree[m[1]] = Number(m[2]); }
  return { allineata: dati.allineata || null, ultimoCheck: dati.ultimo_check || null, lavoro: testoLibero(s['Perché lavoro']), vita: testoLibero(s['Cosa conta nella vita']), aree };
}
async function salvaBussola(b) {
  const corpo = `# Bussola\n\n## Perché lavoro\n${b.lavoro || ''}\n\n## Cosa conta nella vita\n${b.vita || ''}\n\n## Come va adesso\n${AREE.map(a => `- ${a}: ${b.aree?.[a] ?? ''}`).join('\n')}\n`;
  await scrivi(path.join(PIANO, 'Bussola.md'), conFrontmatter({ tipo: 'bussola', allineata: b.allineata || oggiIso(), ultimo_check: b.ultimoCheck || oggiIso().slice(0, 7) }, corpo));
}
async function leggiSettimana(d = new Date()) {
  const t = await leggi(path.join(PIANO, 'Settimane', `${settimanaIso(d)}.md`)); if (t == null) return [];
  return voci(sezioni(frontmatter(t).corpo)['Micro-obiettivi']);
}
// Roadmap: Piano/Roadmap.md. Tappe "## Tappa N: titolo" con righe "Entro: AAAA-MM-GG" e "Traguardo: ...",
// giorni "### AAAA-MM-GG giorno" (o "### Gennaio") con passi "- [ ] testo ~(durata)". "## Il sogno": righe "- **titolo**: testo".
async function leggiRoadmap() {
  const t = await leggi(path.join(PIANO, 'Roadmap.md')); if (t == null) return null;
  const { dati, corpo } = frontmatter(t); const tappe = [], sogno = [], raggiunti = [], entrate = []; let tappa = null, giorno = null, inSogno = false, sez = '', m;
  for (const riga of corpo.split('\n')) {
    if ((m = /^##\s+(.+)$/.exec(riga))) {
      const tm = /^Tappa\s+(\d+):\s*(.+)$/i.exec(m[1].trim()); inSogno = /^il sogno/i.test(m[1].trim()); sez = /^raggiunti/i.test(m[1].trim()) ? 'raggiunti' : /^entrate fisse/i.test(m[1].trim()) ? 'entrate' : ''; giorno = null;
      tappa = tm ? { n: Number(tm[1]), titolo: tm[2].trim(), entro: null, traguardo: null, giorni: [] } : null; if (tappa) tappe.push(tappa); continue;
    }
    if (sez === 'raggiunti' && (m = /^\s*-\s+(\d{4}-\d{2}-\d{2})\s+(.+?)(?::\s+(.*))?$/.exec(riga))) { raggiunti.push({ data: m[1], titolo: m[2].trim(), testo: (m[3] || '').trim() }); continue; }
    if (sez === 'entrate' && (m = /^\s*-\s+(.+?):\s*([\d.]+)\s*€\s*(?:\((.+)\))?/.exec(riga))) { entrate.push({ nome: m[1].trim(), importo: Number(m[2].replace(/\./g, '')), nota: (m[3] || '').trim(), stima: /stima/i.test(m[3] || '') }); continue; }
    if (inSogno && (m = /^\s*-\s+\*\*(.+?)\*\*:?\s*(.*)$/.exec(riga))) { sogno.push({ titolo: m[1].replace(/:$/, ''), testo: m[2].trim() }); continue; }
    if (!tappa) continue;
    if ((m = /^Entro:\s*(\d{4}-\d{2}-\d{2})/i.exec(riga))) { tappa.entro = m[1]; continue; }
    if ((m = /^Traguardo:\s*(.+)$/i.exec(riga))) { tappa.traguardo = m[1].trim(); continue; }
    if ((m = /^###\s+(.+)$/.exec(riga))) { const d = /^(\d{4}-\d{2}-\d{2})\s*(.*)$/.exec(m[1].trim()); giorno = { data: d ? d[1] : null, titolo: d ? d[2] : m[1].trim(), passi: [] }; tappa.giorni.push(giorno); continue; }
    const v = voce(riga); if (!v || !v.casella) continue;
    if (!giorno) { giorno = { data: null, titolo: '', passi: [] }; tappa.giorni.push(giorno); }
    giorno.passi.push({ testo: v.testo, tempo: v.tempo, fatto: v.fatto });
  }
  return { traguardo: dati.traguardo || null, creata: dati.creata || null, tappe, sogno, raggiunti, entrate };
}
async function leggiSegnale() {
  const t = await leggi(path.join(PIANO, 'Segnale.md')); if (t == null) return { stato: null, testo: '', schemi: [] };
  const { dati, corpo } = frontmatter(t); const s = sezioni(corpo);
  return { stato: dati.stato || null, aggiornato: dati.aggiornato || null, testo: testoLibero(s['Bussola']), schemi: voci(s['Cosa hanno in comune i giorni buoni']).map(v => v.testo), correzione: testoLibero(s['Una cosa da cambiare']) };
}
// Riallineamento: Piano/Riallineamento.md. Le domande le prepara l'attività programmata "riallineamento" (ogni settimana e
// ogni mese); l'utente risponde nella chat "Come sto andando", che aggiorna obiettivi e piattaforma e mette "stato: fatto".
async function leggiRiallineamento() {
  const t = await leggi(path.join(PIANO, 'Riallineamento.md')); if (t == null) return null;
  const { dati, corpo } = frontmatter(t); if (String(dati.stato || '').trim() !== 'aperto') return null;
  const domande = voci(sezioni(corpo)['Domande']).map(v => v.testo); if (!domande.length) return null;
  return { data: dati.data || null, tipo: dati.tipo_giro || 'settimana', chat: dati.chat || 'Come sto andando', domande };
}
// Una richiesta in Piano/Richieste.md: l'attività programmata "bussola-piano" la legge e ricalcola settimana e da fare.
async function chiediAClaude(titolo, testo) {
  const p = path.join(PIANO, 'Richieste.md'); const n = new Date();
  const prima = (await leggi(p)) || '# Richieste a Claude\n\nScritte in automatico dalla piattaforma Bussola. Claude le legge, fa il lavoro e le sposta sotto "Fatte".\n\n## Da fare\n\n## Fatte\n';
  const voce = `- ${iso(n)} ${pad(n.getHours())}:${pad(n.getMinutes())} · ${titolo}: ${testo.replace(/\s*\n+\s*/g, ' ')}\n`;
  await scrivi(p, prima.replace('## Da fare\n', `## Da fare\n${voce}`));
}

// ---------- contesti: soldi ----------
// Soldi per cliente: tre righe nella testa della nota del contesto (formato in COME-FUNZIONA.md).
const meseIso = () => oggiIso().slice(0, 7);
function soldiDi(d) {
  const f = String(d.firmato ?? '').trim(); const r = String(d.ricorrente ?? '').trim().toLowerCase();
  const incassi = String(d.incassi || '').split(',').map(x => /^\s*(\d{4}-\d{2})\s+(-?\d+)\s*$/.exec(x)).filter(Boolean).map(m => ({ mese: m[1], euro: +m[2] }));
  if (!f && !r && !incassi.length) return null;
  const daCapire = /capire/i.test(f); const firmato = daCapire ? 0 : (Number(f.replace(/[^\d-]/g, '')) || 0);
  return { firmato, daCapire, ricorrente: /^s[iì]/.test(r), incassi, incassato: incassi.find(x => x.mese === meseIso())?.euro ?? 0 };
}
// Cambia solo alcune righe della testa (frontmatter) di una nota; il resto resta identico. null toglie la riga.
function cambiaTesta(t, cambi) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(t || ''); const righe = m ? m[1].split('\n') : [];
  for (const [k, v] of Object.entries(cambi)) {
    const i = righe.findIndex(r => new RegExp(`^${k}\\s*:`).test(r));
    if (v === null || v === undefined || v === '') { if (i >= 0) righe.splice(i, 1); }
    else if (i >= 0) righe[i] = `${k}: ${v}`; else righe.push(`${k}: ${v}`);
  }
  return (righe.length ? `---\n${righe.join('\n')}\n---\n` : '') + (m ? t.slice(m[0].length) : (t || ''));
}
async function notaContesto(nome) {
  const file = (await elenco(path.join(VAULT, 'Contesti'))).find(f => f === String(nome || '') + '.md'); if (!file) throw new Error('contesto non trovato');
  const p = path.join(VAULT, 'Contesti', file); const t = await leggi(p); return { p, t, dati: frontmatter(t).dati, nome: file.replace('.md', '') };
}
// ---------- vault: lavoro e call ----------
async function lavoro() {
  const out = [];
  for (const f of await elenco(path.join(VAULT, 'Contesti'))) {
    if (!f.endsWith('.md')) continue; const { dati, corpo } = frontmatter(await leggi(path.join(VAULT, 'Contesti', f))); if (dati.categoria === 'personale') continue;
    const s = sezioni(corpo); const pulisci = x => x.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a).replace(/\*\*/g, '');
    const cosa = pulisci(testoLibero(s["Cos'è"]).split('\n')[0] || ''); const aperti = voci(s['Aperto']).map(v => pulisci(v.testo));
    const corto = (x, n) => { const frase = x.split(/(?<=[.?!])\s/)[0].replace(/[:.]$/, ''); return frase.length > n ? frase.slice(0, frase.lastIndexOf(' ', n)) + '…' : frase; };
    const nome = f.replace('.md', '');
    out.push({ nome, tipo: dati.categoria || '', soldi: soldiDi(dati), cartella: dati.cartella || '', tuttiAperti: aperti.slice(0, 12), stato: ({ attivo: 'Attivo', 'in attesa': 'In attesa', archiviato: 'Archiviato' })[(dati.stato || '').toLowerCase()] || (/^(in attesa|aspett|attend)/i.test(aperti[0] || '') ? 'In attesa' : 'Attivo'), scelto: !!dati.stato, cosa: corto(cosa, 110), prossimo: corto(aperti[0] || '', 110), aperti: aperti.length, aggiornato: dati.aggiornato || '' });
  }
  return out.sort((a, b) => b.aperti - a.aperti);
}
async function call() {
  const out = [];
  for (const f of await elenco(path.join(VAULT, 'Diario'))) {
    if (!f.endsWith('.md')) continue; const { dati, corpo } = frontmatter(await leggi(path.join(VAULT, 'Diario', f)));
    // Solo le call e gli incontri: "evento: call" nel frontmatter, oppure il titolo che inizia con "Call"/"Prima call"
    // o che parla di un incontro. Le note della giornata, i vocali e le note di lavoro prima o dopo una call non ci vanno.
    const tit = f.normalize('NFC').replace(/\.md$/, '').slice(11);
    if (dati.evento && !/^call$/i.test(dati.evento)) continue; // evento diverso da call (es. chiacchierata): fuori dalla pagina Call
    if (!(/^call$/i.test(dati.evento || '') || /^((prima|seconda|terza|nuova) )?call\b/i.test(tit) || /\bincontro\b/i.test(tit))) continue;
    const s = sezioni(corpo); const primo = k => { const x = (voci(s[k])[0]?.testo || '').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').split(/(?<=[.:?!])\s/)[0]; return x.length > 120 ? x.slice(0, x.lastIndexOf(' ', 120)) + '…' : x; };
    const tutto = k => { const x = (s[k] || []).join('\n').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a).trim(); return /^(non registrato|nessuna ancora collegata)\.?$/i.test(x) ? '' : x; };   // il grassetto resta: la pagina lo usa per formattare
    const lezioni = [...(s['Lezioni'] || []).join('\n').matchAll(/\[\[([^\]|]+)/g)].map(m => m[1]);
    out.push({ data: dati.data || f.slice(0, 10), titolo: f.replace('.md', '').slice(11), contesto: (dati.contesto || '').replace(/[\[\]"]/g, ''), voto: dati.voto || null, bene: primo('Cosa ho fatto bene'), male: primo('Cosa ho sbagliato'), successo: tutto('Cosa è successo'), esito: tutto('Esito'), beneTutto: tutto('Cosa ho fatto bene'), maleTutto: tutto('Cosa ho sbagliato'), impegni: tutto('Impegni'), lezioni });
  }
  return out.sort((a, b) => b.data.localeCompare(a.data));
}
// ---------- dati fuori dal vault: cartella "dati" del progetto ----------
// calendario.json, soldi.json e progetti.json li aggiorna Claude (attività "bussola-piano") dai connettori.
const DATI = path.resolve(HERE, espandi(process.env.BUSSOLA_DATI || CONFIG.dati || (ESEMPIO ? 'dati-esempio' : 'dati')));
async function leggiJson(nome, vuoto = {}) { try { return JSON.parse(await leggi(path.join(DATI, nome)) || 'null') ?? vuoto; } catch { return vuoto; } }
const perOra = (x, y) => (x.ora || '').padStart(5, '0').localeCompare((y.ora || '').padStart(5, '0'));
const unici = eventi => { const visti = new Set(); return eventi.filter(e => { const k = (e.ora || '') + '|' + e.titolo; if (visti.has(k)) return false; visti.add(k); return true; }).sort(perOra); };

// Calendario: indirizzi iCal privati in config.local.json (riletti ogni 5 minuti); se mancano, dati/calendario.json.
let cacheIcs = { quando: 0, testi: [], indirizzi: 0 };
async function icsTesti() {
  if (Date.now() - cacheIcs.quando < 60000) return cacheIcs;   // riletto ogni minuto
  let cfg = {}; try { cfg = JSON.parse(await leggi(path.join(HERE, 'config.local.json')) || '{}'); } catch { /* file scritto male: come se non ci fosse */ }
  const indirizzi = [].concat(cfg.calendari || [], cfg.calendarioIcs || []).filter(u => typeof u === 'string' && /^https:\/\//.test(u.trim())).map(u => u.trim());
  const testi = [];
  await Promise.all(indirizzi.map(async u => { try { const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (r.ok) testi.push(await r.text()); } catch { /* un calendario che non risponde non blocca gli altri */ } }));
  cacheIcs = { quando: testi.length || !indirizzi.length ? Date.now() : 0, testi, indirizzi: indirizzi.length };
  return cacheIcs;
}
// A quale area appartiene un impegno. Se Claude l'ha scritta in calendario.json ("area") vale quella; altrimenti si ricava dal titolo.
function areaEvento(titolo, calendario) {
  const t = titolo || '';
  if (/famiglia/i.test(calendario || '') || /famiglia|mamma|papà|fratello|sorella|compleanno|nonn[oa]/i.test(t)) return 'amore';
  if (/palestra|allenament|meditazion|corsa|nuoto|yoga|medic|dentist|fisio|visita medica|calcio|calcetto|padel|tennis|basket|bici|ciclismo|\bsci\b|arrampicat|boulder/i.test(t)) return 'salute';
  if (/lezion/i.test(calendario || '') || /call|demo|meeting|riunion|chiamat|startup|career|esame|ripasso|chiamar|preventivo|cliente|workflow|onboarding|lavoro|to-do|visita/i.test(t)) return 'lavoro';
  if (/hackathon|pizza|concerto|festa|bivacco|cinema|aperitivo|pattinaggio|serata|partita|vacanz|cena|gita/i.test(t)) return 'gioco';
  // Quando non si capisce, meglio grigio che un'area sbagliata: l'area vera la scrive Claude in calendario.json.
  return null;
}
// Correzioni dell'utente, in dati/aree.json: { "parola o titolo": "area" }. Le scrive Claude quando gli dici che un'area è sbagliata.
// Se il titolo contiene la parola, vale quell'area, prima di quella scelta da Claude e prima della regola sulle parole.
async function areeScelte() { const a = await leggiJson('aree.json', {}); return Object.entries(a).filter(([k, v]) => k.trim() && AREE.includes(v)).map(([k, v]) => [k.toLowerCase().trim(), v]).sort((x, y) => y[0].length - x[0].length); }
const areaScelta = (mie, titolo) => { const t = (titolo || '').toLowerCase(); return mie.find(([k]) => t.includes(k))?.[1] || null; };
const oraPiu = (o, min) => { const t = Math.min(23 * 60 + 59, parseInt(o) * 60 + +o.split(':')[1] + min); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
async function eventiDi(d, testi, cj) {
  const giorno = iso(d); const mie = await areeScelte();
  const daFile = (cj.eventi || []).filter(e => e.data === giorno).map(e => ({ ora: e.ora || null, ...(e.fine ? { fine: e.fine } : {}), titolo: e.titolo, calendario: e.calendario || null, area: areaScelta(mie, e.titolo) || (AREE.includes(e.area) ? e.area : areaEvento(e.titolo, e.calendario)) }));
  if (!testi.length) return senzaNascosti(giorno, unici(daFile));
  // Con l'indirizzo iCal il calendario personale è letto in diretta. Gli altri calendari, senza quell'indirizzo,
  // restano quelli letti da Claude ogni due ore, così non spariscono.
  // L'area scelta da Claude per lo stesso impegno (stesso giorno e titolo) vale più della regola sulle parole del titolo.
  const scelte = new Map((cj.eventi || []).filter(e => e.data === giorno && AREE.includes(e.area)).map(e => [e.titolo.toLowerCase().trim(), e.area]));
  const vivi = testi.flatMap(t => eventiDelGiorno(t, d)).map(e => ({ ora: e.ora, ...(e.minuti > 0 ? { fine: oraPiu(e.ora, e.minuti) } : {}), titolo: e.titolo, calendario: 'Google Calendar', area: areaScelta(mie, e.titolo) || scelte.get(e.titolo.toLowerCase().trim()) || areaEvento(e.titolo, '') }));
  return senzaNascosti(giorno, unici(vivi.concat(daFile.filter(e => e.calendario && e.calendario !== 'Google Calendar'))));
}
// Eventi da saltare: restano nel tuo Google Calendar (sola lettura), ma Bussola non li mostra.
// dati/nascosti.json: [{ "data": "AAAA-MM-GG", "titolo": "inizio del titolo" }].
async function senzaNascosti(giorno, eventi) {
  const via = (await leggiJson('nascosti.json', [])).filter(n => n.data === giorno).map(n => String(n.titolo).toLowerCase());
  return via.length ? eventi.filter(e => !via.some(v => e.titolo.toLowerCase().startsWith(v))) : eventi;
}

// ---------- cambi del calendario: oggi e domani, controllati ogni minuto ----------
// Si confronta una "foto" degli impegni di oggi e domani con quella di prima. Se qualcosa è nuovo, tolto o spostato:
// avviso del Mac, riga in evidenza nella pagina Oggi, e una richiesta al pianificatore per rivedere le proposte.
// Il file si riscrive solo quando cambia qualcosa, così le pagine non si ridisegnano a vuoto.
const FILE_CAMBI = () => path.join(DATI, 'cambi-calendario.json');
async function fotoCalendario() {
  const { testi } = await icsTesti(); const cj = await leggiJson('calendario.json'); const oggi = new Date(), domani = new Date(); domani.setDate(oggi.getDate() + 1);
  const giorni = {}; for (const d of [oggi, domani]) giorni[iso(d)] = (await eventiDi(d, testi, cj)).filter(e => e.ora).map(e => ({ ora: e.ora, titolo: e.titolo }));
  return { fonte: testi.length ? 'ical' : 'connettore', giorni };
}
function differenze(prima, dopo) {
  const out = []; const per = l => l.reduce((m, e) => ((m[e.titolo] ||= []).push(e.ora), m), {});
  for (const [g, ev] of Object.entries(dopo.giorni)) {
    const vecchi = prima.giorni?.[g]; if (!vecchi) continue;   // giorno appena entrato nella foto (è cambiata la data): niente confronto
    const a = per(vecchi), b = per(ev);
    for (const t of Object.keys(b)) { if (!a[t]) out.push({ giorno: g, tipo: 'nuovo', titolo: t, ora: b[t][0] }); else if (a[t].join() !== b[t].join()) out.push({ giorno: g, tipo: 'spostato', titolo: t, da: a[t][0], ora: b[t][0] }); }
    for (const t of Object.keys(a)) if (!b[t]) out.push({ giorno: g, tipo: 'tolto', titolo: t, da: a[t][0] });
  }
  return out;
}
function fraseCambio(c) { const g = c.giorno === oggiIso() ? 'oggi' : 'domani'; return c.tipo === 'nuovo' ? `Nuovo ${g} alle ${c.ora}: ${c.titolo}` : c.tipo === 'tolto' ? `Tolto ${g}: ${c.titolo} (era alle ${c.da})` : `Spostato ${g}: ${c.titolo}, dalle ${c.da} alle ${c.ora}`; }
function avvisaMac(cambi) {
  if (process.env.BUSSOLA_AVVISI === '0') return;
  const testo = cambi.slice(0, 3).map(fraseCambio).join(' · ') + (cambi.length > 3 ? ` · e altri ${cambi.length - 3}` : '');
  execFile('/usr/bin/osascript', ['-e', `display notification ${JSON.stringify(testo)} with title "Bussola" subtitle "Il calendario è cambiato"`], () => {});
}
let controllando = false;
async function controllaCalendario() {
  if (controllando) return; controllando = true;
  try {
    const foto = await fotoCalendario(); const st = await leggiJson('cambi-calendario.json', { foto: null, cambi: [] });
    if (JSON.stringify(st.foto) === JSON.stringify(foto)) return;
    // Prima volta, o si è appena passati da "letto da Claude" a "in diretta": si salva la foto senza avvisare.
    const nuovi = st.foto && st.foto.fonte === foto.fonte ? differenze(st.foto, foto) : [];
    const quando = new Date().toISOString(); const cambi = nuovi.map(c => ({ ...c, testo: fraseCambio(c), quando, visto: false })).concat(st.cambi || []).slice(0, 30);
    await scrivi(FILE_CAMBI(), JSON.stringify({ foto, cambi }, null, 1));
    if (!nuovi.length) return;
    avvisaMac(nuovi);
    const aperte = (sezioni(frontmatter(await leggi(path.join(PIANO, 'Richieste.md')) || '').corpo)['Da fare'] || []).join('\n');
    if (!/calendario cambiato/.test(aperte)) await chiediAClaude('calendario cambiato', `Il calendario di oggi o domani è cambiato: ${nuovi.map(fraseCambio).join('; ')}. Da fare: rivedere le proposte di quei giorni; se un da fare non ha più senso o va spostato, dirlo tra le proposte.`);
  } catch { /* calendario non raggiungibile un attimo: si riprova al prossimo giro */ } finally { controllando = false; }
}
async function cambiAperti() { const st = await leggiJson('cambi-calendario.json', { cambi: [] }); return (st.cambi || []).filter(c => !c.visto && c.giorno >= oggiIso()); }
async function agenda() {
  const { testi } = await icsTesti(); const cj = await leggiJson('calendario.json');
  const eventi = (await eventiDi(new Date(), testi, cj)).filter(e => e.ora);
  return { collegato: testi.length > 0 || !!cj.aggiornato, fonte: testi.length ? 'ical' : cj.aggiornato ? 'connettore' : null, aggiornato: cj.aggiornato || null, eventi };
}
async function calendario(_, url) {
  const chiesto = url.searchParams.get('mese') || ''; const m = /^\d{4}-(0[1-9]|1[0-2])$/.test(chiesto) ? chiesto : oggiIso().slice(0, 7);
  const primo = daIso(m + '-01'); const { testi } = await icsTesti(); const cj = await leggiJson('calendario.json'); const giorni = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(primo); d.setDate(1 - ((primo.getDay() + 6) % 7) + i); const data = iso(d);
    const eventi = (await eventiDi(d, testi, cj)).map(e => ({ ...e, tipo: 'cal' }));
    const g = await leggiGiorno(data);
    for (const t of g?.todo || []) { const o = /^\d{1,2}:\d{2}/.exec(t.tempo || ''); if (o && !eventi.some(e => e.titolo === t.testo)) eventi.push({ ora: o[0], titolo: t.testo, tipo: 'todo', fatto: t.fatto, area: t.area || null }); }
    { const PREF = /^([^:]{3,40}):\s+/, n = new Map(); for (const e of eventi) { const m = e.tipo === 'todo' && PREF.exec(e.titolo); if (m) n.set(m[1], (n.get(m[1]) || 0) + 1); }
      for (const [k, c] of n) { if (c < 2) continue; const stessi = eventi.filter(e => e.tipo === 'todo' && PREF.exec(e.titolo)?.[1] === k).sort(perOra);
        const uno = { ...stessi[0], titolo: `${k} (${stessi.map(e => e.ora).join(', ')})`, fatto: stessi.every(e => e.fatto) };
        eventi.splice(0, eventi.length, ...eventi.filter(e => !stessi.includes(e)), uno); } }
    giorni.push({ data, n: d.getDate(), nelMese: data.slice(0, 7) === m, oggi: data === oggiIso(), voto: g?.voto || null, eventi: eventi.sort(perOra) });
  }
  const sposta = k => { const d = new Date(primo); d.setMonth(d.getMonth() + k); return iso(d).slice(0, 7); };
  return { mese: m, titolo: `${MESI[primo.getMonth()]} ${primo.getFullYear()}`, prima: sposta(-1), dopo: sposta(1), giorni, fonte: testi.length ? 'ical' : cj.aggiornato ? 'connettore' : null, aggiornato: cj.aggiornato || null, calendari: cj.calendari || [] };
}

// ---------- liste: Piano/Liste/<Nome>.md ----------
const DIR_LISTE = PIANO ? path.join(PIANO, 'Liste') : null;
const nomeLista = n => String(n || '').replace(/[\\/:*?"<>|#^\[\]]/g, ' ').replace(/^[.\s]+/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
async function leggiLista(nome) {
  const t = await leggi(path.join(DIR_LISTE, nome + '.md')); if (t == null) return null;
  const { dati, corpo } = frontmatter(t);
  return { nome, per: dati.per || '', area: AREE.includes(dati.area) ? dati.area : null, voci: voci(corpo.split('\n')).map(({ testo, fatto }) => ({ testo, fatto })) };
}
async function salvaLista(l) { await scrivi(path.join(DIR_LISTE, l.nome + '.md'), conFrontmatter({ tipo: 'lista', per: l.per || '', area: l.area || '' }, `# ${l.nome}\n\n${l.voci.map(v => `- [${v.fatto ? 'x' : ' '}] ${v.testo}`).join('\n')}\n`)); }
async function liste() { const out = []; for (const f of (await elenco(DIR_LISTE)).filter(f => f.endsWith('.md')).sort((a, b) => a.localeCompare(b, 'it'))) out.push(await leggiLista(f.slice(0, -3))); return out.filter(Boolean); }
async function conLista(b, fn) { const l = await leggiLista(nomeLista(b.nome)); if (!l) throw new Error('lista non trovata'); await fn(l); await salvaLista(l); return liste(); }

// ---------- progetti ----------
// Dove sta un programma (gh, pdftotext, uvx, ffmpeg). Prima le cartelle solite di macOS e Linux, poi quelle di Windows,
// poi tutte le cartelle del PATH. Su Windows si cercano anche le estensioni .exe, .cmd e .bat.
// Il server partito all'avvio del computer (launchctl, Utilità di pianificazione) può avere un PATH corto: per questo le cartelle fisse.
async function trovaProgramma(n, piattaforma = process.platform, ambiente = process.env) {
  const win = piattaforma === 'win32'; const sep = win ? ';' : ':';
  const nomi = win ? [`${n}.exe`, `${n}.cmd`, `${n}.bat`, n] : [n];
  const pf = [ambiente.ProgramFiles, ambiente['ProgramFiles(x86)'], ambiente.LOCALAPPDATA && path.join(ambiente.LOCALAPPDATA, 'Programs')].filter(Boolean);
  const cartelle = win
    ? [...pf.flatMap(d => [path.join(d, 'GitHub CLI'), path.join(d, 'poppler', 'Library', 'bin'), path.join(d, 'poppler', 'bin')]), path.join(os.homedir(), '.local', 'bin'), path.join(os.homedir(), 'scoop', 'shims'), 'C:\\ProgramData\\chocolatey\\bin']
    : ['/opt/homebrew/bin', '/usr/local/bin', path.join(os.homedir(), '.local/bin'), '/usr/bin'];
  const tutte = [...new Set([...cartelle, ...String(ambiente.PATH || ambiente.Path || '').split(sep).filter(Boolean)])];
  for (const d of tutte) for (const x of nomi) { const p = path.join(d, x); try { await fs.access(p); return p; } catch { /* prossimo */ } }
  return null;
}
const BIN = n => trovaProgramma(n);
let cachePush = { quando: 0, dati: {} };
async function pushGithub(utente) {
  if (!utente || !/^[\w-]+$/.test(utente)) return {};
  if (Date.now() - cachePush.quando < 10 * 60000) return cachePush.dati;
  const gh = await BIN('gh'); if (!gh) return cachePush.dati;
  const dati = await new Promise(ok => execFile(gh, ['repo', 'list', utente, '--limit', '200', '--json', 'name,pushedAt,description,isPrivate'], { timeout: 10000 }, (err, out) => { try { ok(err ? null : Object.fromEntries(JSON.parse(out).map(r => [r.name, { push: r.pushedAt, descrizione: r.description || '', privato: !!r.isPrivate }]))); } catch { ok(null); } }));
  if (dati) cachePush = { quando: Date.now(), dati };
  return cachePush.dati;
}
async function progetti() {
  const p = await leggiJson('progetti.json', { progetti: [] }); const push = await pushGithub(p.githubUtente || CONFIG.githubUtente); const soldi = await leggiJson('soldi.json');
  const lista = (p.progetti || []).map(x => {
    const github = (x.github || []).map(r => ({ nome: r, push: push[r]?.push || null, descrizione: push[r]?.descrizione || '', privato: push[r]?.privato ?? null }));
    const spese = (x.spese || []).map(n => (soldi.fisse || []).find(f => f.nome.toLowerCase().startsWith(n.toLowerCase()))).filter(Boolean).map(f => ({ nome: f.nome, importo: f.importo }));
    return { ...x, stato: ['In pausa', 'Archiviato'].includes(x.stato) ? x.stato : 'Attivo', github, spese, push: github.map(g => g.push).filter(Boolean).sort().at(-1) || null };
  }).sort((a, b) => (b.push || '').localeCompare(a.push || ''));
  return { githubUtente: p.githubUtente || CONFIG.githubUtente || '', aggiornato: p.aggiornato || null, conteggi: p.conteggi || {}, altri: p.altri ?? null, progetti: lista };
}

// ---------- vocali: audio nella cartella "audio" del progetto, trascrizione in Inbox ----------
const DIR_AUDIO = path.join(HERE, 'audio');
const DOMANDE = ['Cosa ho fatto oggi?', 'Cosa è andato bene, e perché?', 'Cosa è andato male, e perché?', 'Cosa ho imparato?', 'Cosa cambio domani?'];
const inCorso = new Set();
async function metaVocale(id) { try { return JSON.parse(await leggi(path.join(DIR_AUDIO, id + '.json'))); } catch { return null; } }
async function salvaMeta(m) { await scrivi(path.join(DIR_AUDIO, m.id + '.json'), JSON.stringify(m, null, 1)); }
async function vocali() {
  const out = [];
  for (const f of (await elenco(DIR_AUDIO)).filter(f => f.endsWith('.json'))) { const m = await metaVocale(f.slice(0, -5)); if (!m) continue; if (m.stato === 'in corso' && !inCorso.has(m.id)) m.stato = 'interrotta'; out.push({ id: m.id, titolo: m.titolo, tipo: m.tipo, data: m.data, giorni: m.giorni || null, ora: m.ora, secondi: m.secondi || null, stato: m.stato, inizio: (m.testo || '').slice(0, 220), testo: m.testo || '', nota: m.nota || null }); }
  return { domande: DOMANDE, vocali: out.sort((a, b) => (b.data + b.ora).localeCompare(a.data + a.ora)) };
}
async function trascrivi(m) {
  if (process.platform !== 'darwin' || process.arch !== 'arm64') { m.stato = 'errore'; m.errore = 'la trascrizione sul computer funziona solo su un Mac con chip Apple'; return salvaMeta(m); }
  const uvx = await BIN('uvx'); if (!uvx) { m.stato = 'errore'; m.errore = 'uvx non trovato'; return salvaMeta(m); }
  inCorso.add(m.id); m.stato = 'in corso'; delete m.errore; await salvaMeta(m);
  const tmp = path.join(DIR_AUDIO, '.tmp-' + m.id.replace(/\W+/g, '-')); const file = path.join(DIR_AUDIO, m.file);
  const p = spawn(uvx, ['--from', 'mlx-whisper', 'mlx_whisper', file, '--model', 'mlx-community/whisper-large-v3-turbo', '--language', 'it', '--output-dir', tmp, '--output-format', 'txt'], { stdio: 'ignore', env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${path.join(os.homedir(), '.local/bin')}` } });
  p.on('error', async () => { inCorso.delete(m.id); m.stato = 'errore'; await salvaMeta(m); });
  p.on('close', async codice => {
    inCorso.delete(m.id);
    try {
      const txt = (await elenco(tmp)).find(f => f.endsWith('.txt')); const testo = codice === 0 && txt ? (await leggi(path.join(tmp, txt)) || '').replace(/\s*\n\s*/g, ' ').trim() : '';
      await fs.rm(tmp, { recursive: true, force: true });
      if (!testo) { m.stato = 'errore'; m.errore = 'nessun testo riconosciuto'; return await salvaMeta(m); }
      m.testo = testo; m.stato = 'trascritto';
      const sera = m.tipo === 'sera'; m.nota = `${m.data} ${m.ora.replace(':', '')} Vocale - ${sera ? 'sera' : m.titolo.replace(/[\\/:*?"<>|#^\[\]]/g, ' ').slice(0, 50)}.md`;
      await scrivi(path.join(VAULT, 'Inbox', m.nota), conFrontmatter({ tipo: 'vocale', data: m.data, ora: m.ora, audio: file }, `# ${m.titolo}\n\n${sera ? `Risposte a voce alle domande della sera: ${DOMANDE.join(' ')}\n\n` : ''}## Trascrizione\n${testo}\n`));
      // Il vocale della sera va nella nota del suo giorno (m.giorno: prima delle 5 del mattino è ancora "ieri").
      // Se quel giorno ha già una nota, si aggiunge sotto. Poi si chiede a Claude di leggerlo: voto e cose fatte per area.
      if (sera) { const giorno = m.giorno || m.data; const g = await leggiGiorno(giorno); if (g) { g.sera = (g.sera ? g.sera + '\n\n' : '') + testo.slice(0, 3000); await salvaGiorno(g); }
        await chiediAClaude('vocale della sera', `L'utente ha registrato il vocale della sera di ${giorno} (trascrizione in Inbox/${m.nota} e nella sezione Sera di Piano/Giorni/${giorno}.md). Da fare: dare il voto a quel giorno e aggiungere tra i da fare, già spuntate e con la loro area, le cose che dice di aver fatto e che non sono in lista.`); }
      await salvaMeta(m);
    } catch (e) { m.stato = 'errore'; m.errore = String(e.message || e); await salvaMeta(m).catch(() => {}); }
  });
}
async function caricaVocale(buf, url) {
  if (buf.length < 2000) throw new Error('audio vuoto');
  const est = (url.searchParams.get('est') || 'webm').toLowerCase(); if (!['webm', 'm4a', 'mp4', 'mp3', 'wav', 'ogg', 'aac'].includes(est)) throw new Error('formato audio non riconosciuto');
  const tipo = url.searchParams.get('tipo') === 'sera' ? 'sera' : 'vocale'; const n = new Date(); const data = iso(n), ora = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  const titolo = tipo === 'sera' ? 'Vocale della sera' : (String(url.searchParams.get('titolo') || '').replace(/\.[a-z0-9]+$/i, '').trim().slice(0, 80) || 'Vocale');
  const id = `${data} ${ora.replace(':', '')}${pad(n.getSeconds())} ${tipo}`; await fs.mkdir(DIR_AUDIO, { recursive: true });
  const ieri = new Date(n); ieri.setDate(n.getDate() - 1); const giorno = tipo === 'sera' && n.getHours() < 5 ? iso(ieri) : data;
  const m = { id, file: `${id}.${est}`, titolo, tipo, data, ora, giorno, secondi: Number(url.searchParams.get('secondi')) || null, stato: 'in corso' };
  await fs.writeFile(path.join(DIR_AUDIO, m.file), buf); await trascrivi(m); return vocali();
}

// ---------- weekend: Piano/Weekend.md, proposte di cose da fare lontano dallo schermo ----------
async function weekend() {
  const t = await leggi(path.join(PIANO, 'Weekend.md')); if (t == null) return { aggiornato: null, piace: '', proposte: [] };
  const { dati, corpo } = frontmatter(t); const s = sezioni(corpo); const proposte = []; let p = null;
  for (const r of s['Proposte'] || []) {
    const h = /^###\s+(.+)$/.exec(r); if (h) { p = { titolo: h[1].trim(), campi: {}, testo: [] }; proposte.push(p); continue; } if (!p) continue;
    const c = /^-\s*([\wàèéìòù ]+?)\s*:\s*(.*)$/i.exec(r); if (c) p.campi[c[1].trim().toLowerCase()] = c[2].trim(); else if (r.trim()) p.testo.push(r.trim());
  }
  return { aggiornato: dati.aggiornato || null, piace: testoLibero(s['Cosa mi piace']), piaceVoci: voci(s['Cosa mi piace']).map(v => v.testo), proposte: proposte.map(x => ({ titolo: x.titolo, quando: x.campi.quando || '', con: x.campi.con || '', dove: x.campi.dove || '', costo: x.campi.costo || '', serve: x.campi.serve || '', perche: x.campi['perché ora'] || x.campi.perche || '', verificare: x.campi['da verificare'] || '', visto: x.campi['visto su'] || '', area: AREE.includes(x.campi.area) ? x.campi.area : null, stato: x.campi.stato || 'proposta', testo: x.testo.join(' ') })) };
}

// ---------- Fathom: registrazioni delle call ----------
// La chiave API sta in config.local.json ("fathomApiKey"): la incolli tu, Claude non la legge e non la scrive.
// Solo lettura: elenco delle call registrate, riassunto e azioni. Riletto ogni 10 minuti.
let cacheFathom = { quando: 0, dati: null };
async function fathom() {
  if (cacheFathom.dati && Date.now() - cacheFathom.quando < 10 * 60000) return cacheFathom.dati;
  let cfg = {}; try { cfg = JSON.parse(await leggi(path.join(HERE, 'config.local.json')) || '{}'); } catch { /* file scritto male */ }
  const chiave = typeof cfg.fathomApiKey === 'string' ? cfg.fathomApiKey.trim() : ''; if (chiave.length < 20 || /\s/.test(chiave)) { const f = await leggiJson('fathom.json'); return f.aggiornato ? { collegato: true, fonte: 'connettore', aggiornato: f.aggiornato, registrazioni: f.registrazioni || [] } : { collegato: false, registrazioni: [] }; }   // senza chiave: le legge Claude dal connettore e le lascia in dati/fathom.json
  const da = new Date(Date.now() - 90 * 864e5).toISOString(); const voci = []; let cursore = null;
  try {
    for (let pagina = 0; pagina < 4; pagina++) {
      const q = new URLSearchParams({ include_summary: 'true', include_action_items: 'true', created_after: da }); if (cursore) q.set('cursor', cursore);
      const r = await fetch('https://api.fathom.ai/external/v1/meetings?' + q, { headers: { 'X-Api-Key': chiave }, signal: AbortSignal.timeout(15000) });
      if (r.status === 401 || r.status === 403) return { collegato: false, errore: 'Fathom ha rifiutato la chiave: controlla di averla incollata intera.', registrazioni: [] };
      if (!r.ok) return cacheFathom.dati || { collegato: false, errore: `Fathom ha risposto con un errore (${r.status}). Riprovo tra poco.`, registrazioni: [] };
      const j = await r.json(); voci.push(...(j.items || [])); cursore = j.next_cursor; if (!cursore) break;
    }
  } catch { return cacheFathom.dati || { collegato: false, errore: 'Fathom non risponde. Riprovo tra poco.', registrazioni: [] }; }
  const registrazioni = voci.map(m => {
    const inizio = new Date(m.recording_start_time || m.scheduled_start_time || m.created_at), fine = m.recording_end_time ? new Date(m.recording_end_time) : null;
    return { id: String(m.recording_id), titolo: m.title || m.meeting_title || 'Call', data: iso(inizio), ora: `${inizio.getHours()}:${pad(inizio.getMinutes())}`, minuti: fine ? Math.max(1, Math.round((fine - inizio) / 60000)) : null,
      url: m.share_url || m.url || null, con: (m.calendar_invitees || []).filter(p => p.is_external).map(p => p.name || p.email_domain).filter(Boolean).slice(0, 6),
      riassunto: m.default_summary?.markdown_formatted || '', azioni: (m.action_items || []).map(a => ({ testo: a.description, fatta: !!a.completed, di: a.assignee?.name || null })) };
  }).sort((a, b) => (b.data + b.ora.padStart(5, '0')).localeCompare(a.data + a.ora.padStart(5, '0')));
  const dati = { collegato: true, aggiornato: new Date().toISOString(), registrazioni }; cacheFathom = { quando: Date.now(), dati }; return dati;
}

// ---------- lezioni ----------
// Le proposte le scrive il giro orario in Stato.md, sotto "## Da approvare" (una riga "- " per proposta).
// L'utente sceglie dalla pagina Lezioni: la riga esce da Stato.md e va in Piano/Lezioni scelte.md, sotto "## Da fare".
// Il giro orario del vault legge le scelte, crea la lezione o aggiunge l'evento, e le sposta sotto "## Fatte".
const FILE_STATO = () => path.join(VAULT, 'Stato.md');
// "- data ora · scelta · [scelta da Claude · ]testo della proposta"
const RIGA_SCELTA = /^-\s+\S+ \S+ · ([^·]+) · (scelta da Claude · )?(.*)$/;
const FILE_SCELTE = () => path.join(PIANO, 'Lezioni scelte.md');
const idDi = t => { let h = 5381; for (const c of String(t).trim()) h = (h * 33 + c.codePointAt(0)) >>> 0; return h.toString(36); };
const maiuscolaS = t => t.charAt(0).toUpperCase() + t.slice(1);
const senzaLink = t => String(t).replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\*\*/g, '');
function righeDaApprovare(testo) {
  const r = testo.split('\n'); const i = r.findIndex(x => /^##\s+Da approvare\s*$/.test(x)); if (i < 0) return { r, i: -1, fine: -1 };
  let fine = i + 1; while (fine < r.length && !/^##\s/.test(r[fine])) fine++; return { r, i, fine };
}
async function nomiLezioni() { return (await elenco(path.join(VAULT, 'Lezioni'))).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)); }
function leggiProposta(testo, nomi) {
  const link = [...testo.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(m => m[1].trim());
  const esistenti = [...new Set(link.filter(l => nomi.includes(l)))];
  const fonti = [...new Set(link.filter(l => /^\d{4}-\d{2}-\d{2}\s/.test(l)))];
  const tipo = /^\s*(proposta di lezione|lezione nuova)/i.test(testo) ? 'nuova' : /^\s*aggiungere un evento/i.test(testo) ? 'evento' : 'valutare';
  let titolo = (/\*\*(.+?)\*\*/.exec(testo) || /"([^"]{6,160})"/.exec(testo) || /“([^”]{6,160})”/.exec(testo) || [])[1];
  const bersaglio = /^\s*aggiungere un evento a \[\[([^\]|]+)/i.exec(testo)?.[1]?.trim() || esistenti[0];
  if (tipo === 'evento' && bersaglio) titolo = `Nuovo esempio per «${bersaglio}»`;
  if (!titolo) { const piano = senzaLink(testo); const dopo = piano.includes(': ') ? piano.slice(piano.indexOf(': ') + 2) : piano; titolo = dopo.split(/(?<=[.;])\s| — | \(/)[0].replace(/[.;:]$/, ''); if (titolo.length > 120) titolo = titolo.slice(0, 117).replace(/\s\S*$/, '') + '…'; titolo = maiuscolaS(titolo); }
  return { id: idDi(testo), tipo, titolo: maiuscolaS(senzaLink(titolo).replace(/^[\s—-]+|[\s—-]+$/g, '')), testo: senzaLink(testo), fonti, esistenti };
}
async function leggiLezione(nome) {
  const { dati, corpo } = frontmatter(await leggi(path.join(VAULT, 'Lezioni', nome + '.md')) || ''); const s = sezioni(corpo);
  const eventi = (s['Da dove viene'] || []).filter(x => /^\s*-\s/.test(x)).map(x => senzaLink(x.replace(/^\s*-\s+/, '')));
  if (dati.tipo === 'mappa') {
    const idee = (s['Le idee che valgono ovunque'] || []).filter(x => /^\s*\d+\.\s/.test(x)).map(x => senzaLink(x.replace(/^\s*\d+\.\s+/, '')));
    const passi = (s['Dove sono arrivato'] || []).filter(x => /^\s*-\s\[/.test(x)); const nuovo = (s['Cosa c\'è di nuovo'] || []).filter(x => /^\s*-\s/.test(x)).map(x => senzaLink(x.replace(/^\s*-\s+/, '')));
    const concetti = (s['Concetti'] || []).filter(x => /^\s*-\s+\*\*/.test(x)).length;
    return { nome, tipo: 'mappa', stato: dati.stato || 'in corso', aggiornato: dati.aggiornato || null, idee, concetti, fatti: passi.filter(x => /\[x\]/i.test(x)).length, passi: passi.length, nuovo: nuovo.slice(-3).reverse(), ancora: (s['Ancora da capire'] || []).filter(x => /^\s*-\s/.test(x)).map(x => senzaLink(x.replace(/^\s*-\s+/, ''))) };
  }
  return { nome, ambito: dati.ambito || null, aggiornato: dati.aggiornato || null, regola: senzaLink(testoLibero(s['Regola'])), perche: senzaLink(testoLibero(s['Perché'])), eventi };
}
async function lezioni() {
  const nomi = await nomiLezioni(); const st = await leggi(FILE_STATO()) || ''; const { r, i, fine } = righeDaApprovare(st);
  const proposte = i < 0 ? [] : r.slice(i + 1, fine).filter(x => /^-\s/.test(x)).map(x => leggiProposta(x.replace(/^-\s+/, ''), nomi));
  const sc = sezioni(frontmatter(await leggi(FILE_SCELTE()) || '').corpo);
  const scelte = (sc['Da fare'] || []).filter(x => /^-\s/.test(x)).map(x => { const m = RIGA_SCELTA.exec(x); return m ? { id: idDi(m[3]), scelta: m[1].trim(), daClaude: !!m[2], titolo: (/^sì, lezione nuova «([^»]+)»/.exec(m[1].trim()) || [])[1] || leggiProposta(m[3], nomi).titolo } : null; }).filter(Boolean);
  const tutte = []; for (const n of nomi) tutte.push(await leggiLezione(n));
  const mappe = tutte.filter(l => l.tipo === 'mappa'); tutte.splice(0, tutte.length, ...tutte.filter(l => l.tipo !== 'mappa'));
  tutte.sort((a, b) => b.eventi.length - a.eventi.length || String(b.aggiornato).localeCompare(String(a.aggiornato)));
  // Il corso vero è quello con le giornate; gli altri della stessa mappa (senza giornate) sono letture "al volo".
  const cs = await corsi(); for (const m of mappe) { const suoi = cs.filter(x => x.mappa === m.nome), c = suoi.find(x => x.totale) || suoi[0]; m.corso = c ? { id: c.id, titolo: c.titolo, attuale: c.attuale, fatte: c.fatte, totale: c.totale, capitolo: c.capitolo, capitoli: c.capitoli } : null; m.volo = suoi.filter(x => x !== c).map(x => ({ id: x.id, titolo: x.titolo })); }
  return { proposte, scelte, mappe, lezioni: tutte };
}
async function scegliLezione(b) {
  const st = await leggi(FILE_STATO()); if (st == null) throw new Error('Stato.md non trovato'); const { r, i, fine } = righeDaApprovare(st);
  const k = i < 0 ? -1 : r.slice(i + 1, fine).findIndex(x => /^-\s/.test(x) && idDi(x.replace(/^-\s+/, '')) === String(b.id)); if (k < 0) throw new Error('proposta non trovata: ricarica la pagina');
  const riga = r[i + 1 + k]; const testo = riga.replace(/^-\s+/, '');
  const lez = String(b.lezione || ''); const nomi = await nomiLezioni();
  const scelta = b.scelta === 'no' ? 'no' : b.scelta === 'unisci' && nomi.includes(lez) ? `sì, aggiungi a [[${lez}]]` : b.scelta === 'nuova' ? 'sì, lezione nuova' : null;
  if (!scelta) throw new Error('scelta non valida');
  r.splice(i + 1 + k, 1); await scrivi(FILE_STATO(), r.join('\n'));
  const p = FILE_SCELTE(); const n = new Date();
  const prima = (await leggi(p)) || '# Lezioni scelte\n\nScritte dalla pagina Lezioni di Bussola. Il giro orario del vault le legge: con "sì" crea la lezione in Lezioni/ (o aggiunge l\'evento a quella indicata), con "no" la lascia cadere. Poi sposta la riga sotto "Fatte".\n\n## Da fare\n\n## Fatte\n';
  await scrivi(p, prima.replace('## Da fare\n', `## Da fare\n- ${iso(n)} ${pad(n.getHours())}:${pad(n.getMinutes())} · ${scelta} · ${testo}\n`));
  return lezioni();
}
async function annullaScelta(b) {
  const p = FILE_SCELTE(); const t = await leggi(p); if (t == null) throw new Error('niente da annullare'); const r = t.split('\n');
  const a = r.findIndex(x => /^##\s+Da fare/.test(x)); let z = a + 1; while (z < r.length && !/^##\s/.test(r[z])) z++;
  const k = r.slice(a + 1, z).findIndex(x => { const m = RIGA_SCELTA.exec(x); return m && idDi(m[3]) === String(b.id); }); if (a < 0 || k < 0) throw new Error('già sistemata da Claude: non si può più annullare');
  const testo = RIGA_SCELTA.exec(r[a + 1 + k])[3]; r.splice(a + 1 + k, 1); await scrivi(p, r.join('\n'));
  const st = await leggi(FILE_STATO()) || ''; const s = righeDaApprovare(st); if (s.i < 0) throw new Error('sezione Da approvare non trovata');
  s.r.splice(s.i + 1, 0, '', '- ' + testo); await scrivi(FILE_STATO(), s.r.join('\n').replace(/(## Da approvare\n)\n\n/, '$1\n')); return lezioni();
}

// ---------- corso da studiare ----------
// Un corso è una nota .md con "tipo: corso" e "mappa: [[nome della mappa]]", in Inbox o in Lezioni.
// Si apre dalla card "Sto studiando" della pagina Lezioni e si legge qui, con un segnalibro:
// uno per corso, su una parola del testo. Il segnalibro sta in dati/segnalibri.json, il file del corso non si tocca.
const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function corsi() {
  const out = [];
  for (const cartella of ['Lezioni', 'Inbox']) for (const f of await elenco(path.join(VAULT, cartella))) {
    if (!f.endsWith('.md')) continue; const testo = await leggi(path.join(VAULT, cartella, f));
    if (!/^---\n[\s\S]*?^tipo:\s*corso\s*$/m.test(testo || '')) continue;
    const { dati, corpo } = frontmatter(testo); if (dati.tipo !== 'corso') continue;
    const caselle = [...corpo.matchAll(/^\s*-\s+\[( |x|X)\]\s+G\d+\./gm)];
    // Il capitolo da affrontare: la giornata attuale, o la prima casella non spuntata. Titolo e prime righe per la card.
    const g = dati.giornata_attuale || (corpo.match(/^\s*-\s+\[ \]\s+(G\d+)\./m) || [])[1] || null;
    const cap = g ? new RegExp(`^###\\s+${g}\\.\\s+(.+)$`, 'm').exec(corpo) : null;
    const capitolo = cap ? { codice: g, titolo: senzaLink(cap[1]).trim(), anteprima: senzaLink(corpo.slice(cap.index + cap[0].length).split(/^#{1,3}\s/m)[0].split(/\n\s*\n/).map(x => x.trim()).filter(x => x && !/^[-*|>]/.test(x)).slice(0, 3).join(' ')).replace(/\*\*|\*|`/g, '').replace(/\s+/g, ' ').slice(0, 420) } : null;
    // I capitoli del corso ("## Lezione N. Nome (Ga - Gb)") con le giornate fatte di ognuno, per la barra a pezzi della card.
    // Le giornate prima di quella del segnalibro (giornata_attuale) contano come fatte, anche senza casella spuntata.
    const nA = +String(g || '').replace(/\D/g, '') || 0;
    const spuntate = new Set(caselle.filter(c => c[1] !== ' ' || +/G(\d+)/.exec(c[0])[1] < nA).map(c => /G\d+/.exec(c[0])[0]));
    const capitoli = [...corpo.matchAll(/^##\s+Lezione (\d+)\.\s+(.+?)\s*\(G(\d+)\s*-\s*G(\d+)\)\s*$/gm)].map(m => { const da = +m[3], a = +m[4]; let f = 0; for (let n = da; n <= a; n++) if (spuntate.has('G' + n)) f++; return { n: +m[1], nome: senzaLink(m[2]).trim(), da, a, fatte: f }; });
    out.push({ capitolo, capitoli, id: f.slice(0, -3), file: path.join(VAULT, cartella, f), mappa: /\[\[([^\]|]+)/.exec(dati.mappa || '')?.[1]?.trim() || null, titolo: senzaLink((/^#\s+(.+)$/m.exec(corpo) || [])[1] || f.slice(0, -3)).replace(/^Corso:\s*/i, '').replace(/^./, c => c.toUpperCase()), attuale: dati.giornata_attuale || null, fatte: spuntate.size, totale: caselle.length });
  }
  return out;
}
// Markdown → HTML, solo quello che usano i corsi: titoli, paragrafi, elenchi (anche annidati e con caselle), tabelle, codice, citazioni.
// Ogni blocco di testo ha data-b (il suo numero): serve al segnalibro per ritrovare il punto.
function mdHtml(md) {
  let nb = 0; const b = () => ` data-b="${nb++}"`;
  const inl = t => {
    const cod = []; t = t.replace(/`([^`]+)`/g, (_, c) => (cod.push(c), `\u0000${cod.length - 1}\u0000`));
    t = escH(t)
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, x, u) => `<a href="${u}" target="_blank" rel="noopener">${x}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escH(cod[i])}</code>`);
  };
  const righe = md.replace(/\r/g, '').split('\n'); let i = 0; const out = [];
  const voceRx = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
  const lista = () => {   // raccoglie un elenco (con i sotto-elenchi) e lo trasforma in albero per rientro
    const voci = [];
    while (i < righe.length) {
      const r = righe[i], m = voceRx.exec(r);
      if (m) { voci.push({ ind: m[1].length, ord: /\d/.test(m[2]), n: parseInt(m[2]) || 1, testo: m[3] }); i++; continue; }
      if (r.trim() && /^\s{2,}\S/.test(r) && voci.length) { voci[voci.length - 1].testo += ' ' + r.trim(); i++; continue; }
      break;
    }
    const albero = (da, a, ind) => {
      let html = ''; let k = da;
      const ord = voci[da].ord; html += ord ? `<ol${voci[da].n > 1 ? ` start="${voci[da].n}"` : ''}>` : '<ul>';
      while (k < a) {
        let fine = k + 1; while (fine < a && voci[fine].ind > voci[k].ind) fine++;
        let t = voci[k].testo, cas = '';
        const c = /^\[( |x|X)\]\s+/.exec(t); if (c) { t = t.slice(c[0].length); cas = `<span class="cr-box${c[1] !== ' ' ? ' ok' : ''}" aria-hidden="true"></span>`; }
        html += `<li${c ? ' class="cr-cas"' : ''}><span class="cr-t"${b()}>${cas}${inl(t)}</span>${fine > k + 1 ? albero(k + 1, fine, voci[k + 1].ind) : ''}</li>`;
        k = fine;
      }
      return html + (ord ? '</ol>' : '</ul>');
    };
    return voci.length ? albero(0, voci.length, voci[0].ind) : '';
  };
  while (i < righe.length) {
    const r = righe[i];
    if (!r.trim()) { i++; continue; }
    if (/^```/.test(r)) { const cod = []; i++; while (i < righe.length && !/^```/.test(righe[i])) cod.push(righe[i++]); i++; out.push(`<pre${b()}><code>${escH(cod.join('\n'))}</code></pre>`); continue; }
    const h = /^(#{1,4})\s+(.+)$/.exec(r);
    if (h) {
      const liv = h[1].length, t = h[2].trim(); let id = '', cls = '';
      const lz = /^Lezione (\d+)\./.exec(t), g = /^(G\d+)\.\s+(.*)$/.exec(t);
      if (liv === 2 && lz) { id = `l${lz[1]}`; cls = 'cr-lez'; }
      else if (liv === 3 && g) { id = g[1].toLowerCase(); cls = 'cr-g'; out.push(`<h3 id="${id}" class="${cls}"${b()}><span class="cr-pill">${g[1]}</span>${inl(g[2])}</h3>`); i++; continue; }
      else if (liv === 3 && /^Prova finale/.test(t)) cls = 'cr-prova';
      out.push(`<h${liv}${id ? ` id="${id}"` : ''}${cls ? ` class="${cls}"` : ''}${b()}>${inl(t)}</h${liv}>`); i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(r)) { out.push('<hr>'); i++; continue; }
    if (/^\s*\|/.test(r) && /^\s*\|?[\s:|-]+\|/.test(righe[i + 1] || '')) {
      const celle = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const testa = celle(r); i += 2; const corpo = [];
      while (i < righe.length && /^\s*\|/.test(righe[i])) corpo.push(celle(righe[i++]));
      out.push(`<div class="cr-tab"><table><thead><tr>${testa.map(c => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${corpo.map(rr => `<tr>${rr.map(c => `<td${b()}>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (/^>/.test(r)) { const q = []; while (i < righe.length && /^>/.test(righe[i])) q.push(righe[i++].replace(/^>\s?/, '')); out.push(`<blockquote><p${b()}>${inl(q.join(' '))}</p></blockquote>`); continue; }
    if (voceRx.test(r)) { out.push(lista()); continue; }
    const p = []; while (i < righe.length && righe[i].trim() && !/^(#{1,4}\s|```|>|\s*\|)/.test(righe[i]) && !voceRx.test(righe[i])) p.push(righe[i++].trim());
    const testo = p.join(' ');
    out.push(`<p${/^\*\*Da fare oggi/.test(testo) ? ' class="cr-dafare"' : ''}${b()}>${inl(testo)}</p>`);
  }
  return out.join('\n');
}
// PDF del corso: se in config.local.json "corsiPdf" ha il percorso di un PDF per il corso, il lettore mostra quello.
// Le pagine di ogni giornata e lezione si trovano leggendo il testo del PDF con pdftotext (una volta, finché il file non cambia).
let cachePdf = {};
async function pdfCorso(id) {
  let cfg = {}; try { cfg = JSON.parse(await leggi(path.join(HERE, 'config.local.json')) || '{}'); } catch { /* file scritto male */ }
  const file = (cfg.corsiPdf || {})[id]; if (!file) return null;
  let st; try { st = await fs.stat(file); } catch { return null; }
  if (cachePdf[id]?.mtime === st.mtimeMs) return cachePdf[id];
  const pagine = {}, parti = [], voci = []; let totale = 0; const bin = await BIN('pdftotext');
  if (bin) {
    const testo = await new Promise(ok => execFile(bin, ['-layout', file, '-'], { maxBuffer: 50e6 }, (e, out) => ok(e ? '' : out)));
    totale = testo.replace(/\f\s*$/, '').split('\f').length;
    testo.split('\f').forEach((pg, i) => {
      for (const m of pg.matchAll(/^\s*(G\d+)\s+\S/gm)) pagine[m[1].toLowerCase()] = i + 1;   // l'ultima pagina vince: le caselle all'inizio non contano
      const pt = /Parte (\d+) di \d+ del percorso/.exec(pg); if (pt) parti[+pt[1] - 1] = i + 1;
    });
    // Un PDF senza giornate ma con una pagina "Indice": le voci diventano l'indice a sinistra.
    // La pagina di ogni voce si cerca nel testo (il titolo in testa a una pagina), altrimenti vale il numero stampato nell'indice.
    const fogli = testo.split('\f'), ip = fogli.findIndex(pg => /^\s*Indice\s*$/m.test(pg));
    if (ip >= 0 && !Object.keys(pagine).length) {
      const piatto = t => t.replace(/[‐-]\s*\n\s*/g, '').replace(/\s+/g, ' ').toLowerCase();
      const corpi = fogli.map(piatto);
      for (const r of fogli[ip].split('\n')) {
        const m = /^\s*(\d+(?:\.\d+)?)?\s+(\S.*?\S)\s{2,}(\d+)\s*$/.exec(r); if (!m || /^indice$/i.test(m[2])) continue;
        const titolo = m[2].replace(/^\d+\.\d+\s+/, ''), num = m[1] || (/^(\d+\.\d+)\s/.exec(m[2]) || [])[1] || null;
        const chiave = piatto(titolo).slice(0, 40); const qui = corpi.map((c, k) => k > ip && c.includes(chiave) ? k + 1 : 0).filter(Boolean); const p = qui.sort((a, b) => Math.abs(a - m[3]) - Math.abs(b - m[3]))[0] || +m[3];   // la pagina più vicina a quella stampata
        voci.push({ id: 'v' + voci.length, num, testo: titolo, sotto: (!m[1] && !/^Fonti/i.test(titolo)) || /\./.test(num || ''), p });
      }
    }
  }
  return (cachePdf[id] = { file, mtime: st.mtimeMs, pagine, parti, voci, totale });
}
async function corso(_, url) {
  const tutti = await corsi(); if (!tutti.length) throw new Error('nessun corso trovato');
  const id = url?.searchParams?.get('id'); const c = tutti.find(x => x.id === id) || tutti.find(x => x.totale) || tutti[0];
  const { corpo } = frontmatter(await leggi(c.file) || '');
  const indice = [...corpo.matchAll(/^(##|###)\s+(Lezione (\d+)\.\s+(.+?)\s*\(G(\d+)\s*-\s*G(\d+)\)|(G\d+)\.\s+(.+))$/gm)].map(m => m[3] ? { tipo: 'lez', id: `l${m[3]}`, testo: m[4], da: +m[5], a: +m[6] } : { tipo: 'g', id: m[7].toLowerCase(), g: m[7], testo: m[8] });
  const nA = +String(c.attuale || '').replace(/\D/g, '') || 0; const fatte = new Set([...corpo.matchAll(/^\s*-\s+\[(?:x|X)\]\s+(G\d+)\./gm)].map(m => m[1].toLowerCase()).concat(Array.from({ length: Math.max(0, nA - 1) }, (_, i) => 'g' + (i + 1))));
  const sl = (await leggiJson('segnalibri.json', {}))[c.id] || null; const pdf = await pdfCorso(c.id);
  if (!indice.length && pdf?.voci?.length) indice.push(...pdf.voci.map(v => ({ tipo: 'v', id: v.id, num: v.num, testo: v.testo, sotto: v.sotto, p: v.p })));
  return { pdf: pdf ? { pagine: pdf.pagine, parti: pdf.parti } : null, id: c.id, titolo: c.titolo, mappa: c.mappa, attuale: c.attuale, fatte: c.fatte, totale: c.totale, indice: indice.map(x => x.tipo === 'g' ? { ...x, fatta: fatte.has(x.id) } : x), html: mdHtml(corpo.replace(/^#\s+.+\n/m, '')), segnalibro: sl };
}
async function segnaCorso(b) {
  const id = String(b.id || ''); if (!(await corsi()).some(c => c.id === id)) throw new Error('corso non trovato');
  const tutti = await leggiJson('segnalibri.json', {}); const prima = tutti[id] || null;
  // Il segnalibro non si toglie, si sposta soltanto.
  if (b.togli) throw new Error('il segnalibro si può solo spostare');
  tutti[id] = b.p ? { p: Math.max(1, Math.floor(+b.p)), y: Math.min(1, Math.max(0, +b.y || 0)), dove: String(b.dove || '').slice(0, 160), quando: new Date().toISOString() } : { b: Math.max(0, Math.floor(+b.b || 0)), o: Math.max(0, Math.floor(+b.o || 0)), dove: String(b.dove || '').slice(0, 160), quando: new Date().toISOString() };
  await scrivi(path.join(DATI, 'segnalibri.json'), JSON.stringify(tutti, null, 1));
  // Sul PDF il segnalibro dice anche a che giornata sei: la scrive in "giornata_attuale" nella nota del corso,
  // così la barra avanza e il pianificatore (bussola-piano) sa dove sei arrivato.
  if (b.p) {
    const pdf = await pdfCorso(id), gg = pdf && Object.entries(pdf.pagine).filter(([, q]) => q <= tutti[id].p).sort((x, y) => y[1] - x[1])[0]?.[0]?.toUpperCase();
    // Segnalibro sull'ultima pagina del PDF = corso finito: anche l'ultima giornata conta fatta,
    // spuntando la sua casella. Se poi il segnalibro torna indietro, quella spunta (messa da Bussola) si toglie.
    const ultima = pdf && Object.keys(pdf.pagine).sort((x, y) => +y.slice(1) - +x.slice(1))[0]?.toUpperCase();
    const finito = !!(pdf?.totale && tutti[id].p >= pdf.totale && ultima);
    const c = (await corsi()).find(x => x.id === id); const t = gg && c && await leggi(c.file);
    if (t && /^---\n/.test(t)) {
      const fine = t.indexOf('\n---', 4); let fm = t.slice(0, fine), corpo = t.slice(fine);
      fm = /^giornata_attuale:.*$/m.test(fm) ? fm.replace(/^giornata_attuale:.*$/m, `giornata_attuale: ${gg}`) : fm + `\ngiornata_attuale: ${gg}`;
      const casella = g => new RegExp(`^(\\s*-\\s+)\\[( |x|X)\\](\\s+${g}\\.)`, 'm');
      if (finito && casella(ultima).exec(corpo)?.[2] === ' ') { corpo = corpo.replace(casella(ultima), '$1[x]$3'); tutti[id].spunta = ultima; }
      else if (finito && prima?.spunta === ultima) tutti[id].spunta = ultima;
      else if (!finito && prima?.spunta) corpo = corpo.replace(casella(prima.spunta), '$1[ ]$3');
      if (fm + corpo !== t) await scrivi(c.file, fm + corpo);
      if (tutti[id].spunta) await scrivi(path.join(DATI, 'segnalibri.json'), JSON.stringify(tutti, null, 1));
    }
  }
  return { segnalibro: tutti[id] || null };
}


// ---------- ricerca per significato nella pagina Lezioni ----------
// Cerca nelle lezioni, nelle mappe di studio e nel PDF del corso. Il significato lo dà strumenti/vettori (modello di frasi
// italiano di Apple, sul Mac, senza internet): ogni pezzo di testo diventa un vettore e la domanda si confronta con tutti.
// Le parole esatte della domanda (per esempio "NDA") contano un po' in più. I vettori restano in dati/ricerca.json e si
// rifanno solo per i testi cambiati.
const VETTORI = path.join(HERE, 'strumenti', 'vettori');
function vettori(testi) {
  return new Promise((ok, no) => { if (!testi.length) return ok([]);
    const p = spawn(VETTORI, [], { stdio: ['pipe', 'pipe', 'ignore'] }); let out = '';
    p.stdout.on('data', d => out += d); p.on('error', no); p.on('close', c => { try { const v = JSON.parse(out); v.length === testi.length ? ok(v) : no(new Error('vettori incompleti')); } catch { no(new Error('ricerca non disponibile')); } });
    p.stdin.end(JSON.stringify(testi)); });
}
const piano = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const VUOTE = new Set('che chi con per tra fra del della delle dei degli una uno gli le lo la il di da in su ma non come cosa sono era anche piu quella quello questa questo quel quale dove quando mio mia tuo tua sua suo nel nella alle alla allo agli voglio cerco roba cose cosa sulle sulla sui sul'.split(' '));
let indiceCerca = null;
async function pezziDaCercare() {
  const pezzi = [];
  for (const n of await nomiLezioni()) {
    const l = await leggiLezione(n);
    if (l.tipo === 'mappa') { l.idee.forEach((t, i) => pezzi.push({ id: `map:${n}:${i}`, tipo: 'mappa', titolo: n, testo: t })); (l.ancora || []).forEach((t, i) => pezzi.push({ id: `map:${n}:a${i}`, tipo: 'mappa', titolo: n, testo: 'Ancora da capire: ' + t })); }
    else pezzi.push({ id: `lez:${n}`, tipo: 'lezione', titolo: n, testo: [n + '.', l.regola, l.perche, ...l.eventi.slice(0, 3)].filter(Boolean).join(' ') });
  }
  for (const c of await corsi()) {
    const pdf = await pdfCorso(c.id); const bin = await BIN('pdftotext'); if (!pdf || !bin) continue;
    const testo = await new Promise(ok => execFile(bin, [pdf.file, '-'], { maxBuffer: 50e6 }, (e, out) => ok(e ? '' : out)));
    const nomiG = new Map((await corso(null, new URL('http://x/?id=' + encodeURIComponent(c.id)))).indice.filter(z => z.tipo === 'g').map(z => [z.g, z.testo]));
    const giornataDi = p => Object.entries(pdf.pagine).filter(([, q]) => q <= p).sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() || null;
    testo.split('\f').forEach((pg, i) => {
      const p = i + 1; if (p < 3) return; let buf = '';
      const butta = () => { const t = buf.replace(/\s+/g, ' ').trim(); if (t.length >= 60) pezzi.push({ id: `pdf:${c.id}:${p}:${pezzi.length}`, tipo: 'corso', corso: c.id, titolo: c.titolo, pagina: p, giornata: giornataDi(p), nomeGiornata: nomiG.get(giornataDi(p)) || null, testo: t, chiave: `${nomiG.get(giornataDi(p)) || ''}. ${t}` }); buf = ''; };
      for (const par of pg.split(/\n\s*\n/)) { buf += ' ' + par; if (buf.length > 380) butta(); }
      butta();
    });
  }
  return pezzi;
}
async function firmaCerca() {
  const st = []; for (const n of await nomiLezioni()) { try { st.push(n + (await fs.stat(path.join(VAULT, 'Lezioni', n + '.md'))).mtimeMs); } catch { /* sparita */ } }
  for (const c of await corsi()) { const p = await pdfCorso(c.id); if (p) st.push(p.file + p.mtime); }
  return st.join('|');
}
async function indiceRicerca() {
  const firma = await firmaCerca(); if (indiceCerca?.firma === firma) return indiceCerca;
  const vecchio = indiceCerca || await leggiJson('ricerca.json', { voci: [] }); const chiaveDi = p => p.chiave || p.testo; const noti = new Map((vecchio.voci || []).map(v => [chiaveDi(v), v.v]));
  const pezzi = await pezziDaCercare(); const mancano = [...new Set(pezzi.filter(p => !noti.has(chiaveDi(p))).map(chiaveDi))];
  const nuovi = await vettori(mancano); mancano.forEach((t, i) => noti.set(t, nuovi[i]));
  indiceCerca = { firma, voci: pezzi.map(p => ({ ...p, v: noti.get(chiaveDi(p)), piano: piano(chiaveDi(p)) })) };
  await scrivi(path.join(DATI, 'ricerca.json'), JSON.stringify({ firma, voci: indiceCerca.voci.map(({ piano: _, ...x }) => x) }));
  return indiceCerca;
}
async function cerca(_, url) {
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 200); if (q.length < 2) return { q, risultati: [] };
  const ind = await indiceRicerca(); const [qv] = await vettori([q]);
  const parole = piano(q).split(' ').filter(w => w.length >= 2 && !VUOTE.has(w));
  const punti = ind.voci.map(x => {
    let s = 0; for (let k = 0; k < qv.length; k++) s += qv[k] * (x.v?.[k] || 0);
    const trovate = parole.filter(w => (' ' + x.piano + ' ').includes(' ' + (w.length > 5 ? w.slice(0, w.length - 1) : w)));
    return { x, s: s + (parole.length ? 0.22 * trovate.length / parole.length : 0) + (trovate.some(w => w.length <= 4 && /^[a-z]+$/.test(w) && new RegExp('\\b' + w + '\\b', 'i').test(x.testo) && x.testo.includes(w.toUpperCase())) ? 0.15 : 0), trovate };
  }).sort((a, b) => b.s - a.s);
  const visti = new Set(), out = [];
  for (const { x, s, trovate } of punti) {
    const chiave = x.tipo === 'corso' ? `${x.corso}:${x.giornata || x.pagina}` : x.tipo === 'mappa' ? `${x.titolo}:${x.testo.slice(0, 40)}` : x.id; if (visti.has(chiave)) continue; visti.add(chiave);
    let estratto = x.testo; const w = trovate[0]; const i = w ? piano(x.testo).indexOf(w.slice(0, 4)) : -1; if (estratto.length > 240) estratto = (i > 80 ? '…' + estratto.slice(i - 60) : estratto).slice(0, 240).replace(/\s\S*$/, '') + '…';
    out.push({ tipo: x.tipo, titolo: x.titolo, estratto, punti: Math.round(s * 100) / 100, ...(x.tipo === 'corso' ? { corso: x.corso, pagina: x.pagina, giornata: x.giornata, nomeGiornata: x.nomeGiornata } : {}) });
    if (out.length >= 8) break;
  }
  return { q, risultati: out };
}
// ---------- richieste a Claude ----------
async function richieste() {
  const s = sezioni(frontmatter(await leggi(path.join(PIANO, 'Richieste.md')) || '').corpo); const r = k => (s[k] || []).filter(x => /^\s*-\s/.test(x)).map(x => x.replace(/^\s*-\s+/, ''));
  return { aperte: r('Da fare'), fatte: r('Fatte').slice(0, 20) };
}

// Un "segno" che cambia quando cambia il codice delle pagine o un dato che le pagine mostrano.
// Le pagine lo chiedono ogni mezzo minuto: se è cambiato si ridisegnano (o si ricaricano) da sole.
async function segno() {
  const somma = async (dir, giu) => { let n = 0; for (const f of await elenco(dir)) { try { const st = await fs.stat(path.join(dir, f)); if (st.isDirectory()) { if (giu) n += await somma(path.join(dir, f), giu - 1); } else n += st.mtimeMs + st.size; } catch { /* file sparito nel frattempo */ } } return n; };
  const [codice, piano, contesti, diario, dati, audio] = await Promise.all([somma(path.join(HERE, 'public'), 0), somma(PIANO, 2), somma(path.join(VAULT, 'Contesti'), 0), somma(path.join(VAULT, 'Diario'), 0), somma(DATI, 0), somma(DIR_AUDIO, 0)]);
  return { versione: String(Math.round(codice)), dati: [piano, contesti, diario, dati, audio].map(Math.round).join('-'), giorno: oggiIso() };
}

// ---------- API ----------
async function stato() {
  const [bussola, obiettivi] = await Promise.all([leggiBussola(), leggiObiettivi()]);
  const primaVolta = !bussola || !obiettivi;
  const oggi = primaVolta ? null : await giornoDiOggi();
  let ag = await agenda(); if (!ag.eventi.length && oggi?.agenda?.length) ag = { ...ag, collegato: true, fonte: ag.fonte || 'file', eventi: oggi.agenda };
  { // La fine che manca si prende da dati/calendario.json (stesso giorno, stessa ora, titolo simile).
    const cj = await leggiJson('calendario.json'), oggiCal = (cj.eventi || []).filter(e => e.data === oggiIso() && e.fine), nome = t => String(t || '').toLowerCase().replace(/[^a-zà-ú0-9]+/g, ' ').trim();
    ag.eventi = ag.eventi.map(e => { if (e.fine) return e; const c = oggiCal.find(x => x.ora === e.ora && (nome(x.titolo).includes(nome(e.titolo)) || nome(e.titolo).includes(nome(x.titolo)))) || oggiCal.find(x => x.ora === e.ora); return c ? { ...e, fine: c.fine } : e; }); }
  return { esempio: ESEMPIO, nome: CONFIG.nome || '', marchio: CONFIG.titolo || 'Bussola', nascondi: Array.isArray(CONFIG.nascondi) ? CONFIG.nascondi : [], obiettivoSoldi: Number(CONFIG.obiettivoSoldi) || 0, data: oggiIso(), titolo: titoloGiorno(oggiIso()), primaVolta, checkMensile: !primaVolta && bussola.ultimoCheck !== oggiIso().slice(0, 7), riallineamento: primaVolta ? null : await leggiRiallineamento(), oggi, settimana: primaVolta ? [] : await leggiSettimana(), agenda: ag, segnale: await leggiSegnale(), cambi: await cambiAperti() };
}
const rotte = {
  'GET /api/stato': stato,
  'POST /api/cambi/visti': async () => { const st = await leggiJson('cambi-calendario.json', { cambi: [] }); for (const c of st.cambi || []) c.visto = true; await scrivi(FILE_CAMBI(), JSON.stringify(st, null, 1)); return { ok: true }; },
  'GET /api/segno': segno,
  'GET /api/piano': async () => { const giorni = []; for (const d of giorniDellaSettimana(new Date())) giorni.push({ data: d, titolo: titoloGiorno(d), oggi: d === oggiIso(), todo: (await leggiGiorno(d))?.todo || [] }); return { obiettivi: await leggiObiettivi(), bussola: await leggiBussola(), settimana: await leggiSettimana(), roadmap: await leggiRoadmap(), giorni }; },
  'GET /api/calendario': calendario,
  'GET /api/liste': liste,
  'POST /api/liste/nuova': async b => { const nome = nomeLista(b.nome); if (!nome) throw new Error('scrivi un nome'); if (await leggiLista(nome)) throw new Error('esiste già una lista con questo nome'); await salvaLista({ nome, per: '', area: null, voci: [] }); return liste(); },
  'POST /api/liste/per': b => conLista(b, l => { l.per = String(b.per || '').replace(/\s+/g, ' ').trim().slice(0, 120); }),
  'POST /api/liste/aggiungi': b => conLista(b, l => { const t = String(b.testo || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!t) throw new Error('testo vuoto'); l.voci.push({ testo: t, fatto: false }); }),
  'POST /api/liste/spunta': b => conLista(b, l => { const v = l.voci[b.i]; if (!v) throw new Error('voce non trovata'); v.fatto = !v.fatto; }),
  'POST /api/liste/togli': b => conLista(b, l => { if (!l.voci[b.i]) throw new Error('voce non trovata'); l.voci.splice(b.i, 1); }),
  'POST /api/liste/oggi': async b => { let voce; const g = await giornoDiOggi(); const out = await conLista(b, l => { voce = l.voci[b.i]; if (!voce) throw new Error('voce non trovata'); l.voci.splice(b.i, 1); g.todo.push({ testo: voce.testo, area: l.area, nota: l.per || l.nome, tempo: null, fatto: voce.fatto }); }); await salvaGiorno(g); return out; },
  'GET /api/fathom': fathom,
  'GET /api/progetti': progetti,
  'POST /api/progetti/stato': async b => { const p = await leggiJson('progetti.json', { progetti: [] }); const x = (p.progetti || []).find(y => y.nome === b.nome); if (!x) throw new Error('progetto non trovato'); if (!['Attivo', 'In pausa', 'Archiviato'].includes(b.stato)) throw new Error('stato non valido'); x.stato = b.stato; await scrivi(path.join(DATI, 'progetti.json'), JSON.stringify(p, null, 1)); return progetti(); },
  'POST /api/progetti/contesto': async b => { const p = await leggiJson('progetti.json', { progetti: [] }); const x = (p.progetti || []).find(y => y.nome === b.nome); if (!x) throw new Error('progetto non trovato'); const c = String(b.contesto || '').trim().slice(0, 60); const validi = (await elenco(path.join(VAULT, 'Contesti'))).map(f => f.replace('.md', '')); if (c && !validi.includes(c)) throw new Error('contesto non trovato'); x.contesto = c || null; await scrivi(path.join(DATI, 'progetti.json'), JSON.stringify(p, null, 1)); return progetti(); },
  'POST /api/contesti/stato': async b => {
    const nome = String(b.nome || ''); const file = (await elenco(path.join(VAULT, 'Contesti'))).find(f => f === nome + '.md'); if (!file) throw new Error('contesto non trovato');
    const st = String(b.stato || '').toLowerCase(); if (!['', 'attivo', 'in attesa', 'archiviato'].includes(st)) throw new Error('stato non valido');
    const p = path.join(VAULT, 'Contesti', file); const t = await leggi(p); const m = /^---\n([\s\S]*?)\n---\n?/.exec(t);
    // Si tocca solo la riga "stato:" del frontmatter; il resto della nota resta identico.
    const righe = (m ? m[1].split('\n') : []).filter(r => !/^stato\s*:/.test(r)); if (st) righe.push('stato: ' + st);
    await scrivi(p, (righe.length ? `---\n${righe.join('\n')}\n---\n` : '') + (m ? t.slice(m[0].length) : t)); return lavoro();
  },
  'GET /api/soldi': () => leggiJson('soldi.json'),
  'GET /api/vocali': vocali,
  'POST /api/vocali/riprova': async b => { const m = await metaVocale(String(b.id || '')); if (!m) throw new Error('vocale non trovato'); if (!inCorso.has(m.id)) await trascrivi(m); return vocali(); },
  'GET /api/lezioni': lezioni,
  'POST /api/lezioni/scegli': scegliLezione,
  'POST /api/lezioni/annulla': annullaScelta,
  'GET /api/corso': corso,
  'GET /api/cerca': cerca,
  'POST /api/corso/segnalibro': segnaCorso,
  'GET /api/richieste': richieste,
  'POST /api/richieste': async b => { const t = String(b.testo || '').trim().slice(0, 1500); if (!t) throw new Error('scrivi la richiesta'); await chiediAClaude('richiesta dell\'utente', t); return richieste(); },
  'GET /api/impostazioni': async () => { const ics = await icsTesti(); const cj = await leggiJson('calendario.json'), so = await leggiJson('soldi.json'), pr = await leggiJson('progetti.json'); return { vault: VAULT, strumenti: Array.isArray(CONFIG.strumenti) ? CONFIG.strumenti : null, obiettivoSoldi: Number(CONFIG.obiettivoSoldi) || 0, ical: { indirizzi: ics.indirizzi, letti: ics.testi.length }, calendario: cj.aggiornato || null, calendari: cj.calendari || [], soldi: so.aggiornato || null, foglio: so.foglio || null, progetti: pr.aggiornato || null, fathom: await fathom().then(f => ({ collegato: f.collegato, errore: f.errore || null, quante: f.registrazioni.length, fonte: f.fonte || 'chiave', aggiornato: f.aggiornato || null })), github: !!(await BIN('gh')), trascrizione: process.platform === 'darwin' && process.arch === 'arm64' && !!(await BIN('uvx')) && !!(await BIN('ffmpeg')) }; },
  'GET /api/lavoro': lavoro,
  // Soldi di un cliente, corretti dalla pagina: si toccano solo firmato, ricorrente e l'incasso del mese in corso.
  'POST /api/contesti/soldi': async b => {
    const n = await notaContesto(b.nome); const vecchi = String(n.dati.incassi || '').split(',').map(x => x.trim()).filter(x => /^\d{4}-\d{2}\s+-?\d+$/.test(x)).filter(x => !x.startsWith(meseIso()));
    const f = String(b.firmato ?? '').trim(); const firmato = /capire/i.test(f) ? 'da capire' : f === '' ? null : String(Math.max(0, Math.round(Number(f.replace(/[^\d]/g, '')) || 0)));
    const inc = String(b.incassato ?? '').trim(); if (inc !== '') vecchi.push(`${meseIso()} ${Math.max(0, Math.round(Number(inc.replace(/[^\d]/g, '')) || 0))}`);
    vecchi.sort(); await scrivi(n.p, cambiaTesta(n.t, { firmato, ricorrente: b.ricorrente ? 'sì' : 'no', incassi: vecchi.join(', ') || null })); return lavoro();
  },
  'GET /api/call': call,
  'GET /api/giornate': async () => { const file = (await elenco(path.join(PIANO, 'Giorni'))).map(f => f.replace('.md', '')).sort().slice(-35); const giorni = []; for (const d of file) { const g = await leggiGiorno(d); giorni.push({ data: d, titolo: titoloGiorno(d), voto: g.voto, votoDa: g.voto ? (g.votoDa || 'utente') : null, stima: g.voto || d > oggiIso() ? null : votoStimato(g), sera: g.sera, fatte: g.todo.filter(t => t.fatto).map(t => t.testo), totale: g.todo.length, aree: g.todo.filter(t => t.fatto && t.area).reduce((m, t) => (m[t.area] = (m[t.area] || 0) + 1, m), {}) }); } return { giorni, segnale: await leggiSegnale() }; },
  'POST /api/todo/spunta': async b => { const g = await giornoDiOggi(); const v = g.todo[b.i]; if (!v) throw new Error('voce non trovata'); v.fatto = !v.fatto; await salvaGiorno(g); return g; },
  'POST /api/todo/aggiungi': async b => { const g = await giornoDiOggi(); const grezzo = String(b.testo || '').trim().slice(0, 200); const { testo, tempo } = separaTempo(grezzo); if (!testo) throw new Error('testo vuoto'); g.todo.push({ testo, area: AREE.includes(b.area) ? b.area : null, nota: null, tempo, fatto: false }); await salvaGiorno(g); return g; },
  'POST /api/proposte/accetta': async b => { const g = await giornoDiOggi(); const v = (g.proposte || [])[b.i]; if (!v) throw new Error('proposta non trovata'); g.proposte.splice(b.i, 1); g.todo.push({ ...v, fatto: false }); await salvaGiorno(g); return g; },
  'POST /api/proposte/scarta': async b => { const g = await giornoDiOggi(); if (!(g.proposte || [])[b.i]) throw new Error('proposta non trovata'); g.proposte.splice(b.i, 1); await salvaGiorno(g); return g; },
  'GET /api/weekend': weekend,
  'POST /api/weekend/risposta': async b => {
    const p = path.join(PIANO, 'Weekend.md'); const t = await leggi(p); if (t == null) throw new Error('nessuna proposta'); const st = ['sì', 'no', 'proposta'].includes(b.stato) ? b.stato : null; if (!st) throw new Error('risposta non valida');
    // Si cambia solo la riga "- stato:" del blocco con quel titolo; il resto del file resta identico.
    const righe = t.split('\n'); const i = righe.findIndex(r => r.trim() === '### ' + String(b.titolo || '').trim()); if (i < 0) throw new Error('proposta non trovata');
    let j = i + 1; while (j < righe.length && !/^#{2,3}\s/.test(righe[j])) { if (/^-\s*stato\s*:/.test(righe[j])) break; j++; }
    if (j < righe.length && /^-\s*stato\s*:/.test(righe[j])) righe[j] = '- stato: ' + st; else righe.splice(i + 1, 0, '- stato: ' + st);
    await scrivi(p, righe.join('\n')); if (st === 'sì') await chiediAClaude('weekend accettato', `L'utente ha detto sì alla proposta "${String(b.titolo).slice(0, 120)}" in Piano/Weekend.md. Da fare: verificare i dettagli (meteo, orari, costi, cosa portare), scriverli nel blocco della proposta e mettere i passi da fare tra le proposte dei giorni giusti.`);
    return weekend();
  },
  'POST /api/todo/togli': async b => { const g = await giornoDiOggi(); if (!g.todo[b.i]) throw new Error('voce non trovata'); g.todo.splice(b.i, 1); await salvaGiorno(g); return g; },
  // Voto a un giorno passato, dato dalla pagina Giornate. Si tocca solo il voto.
  'POST /api/giorni/voto': async b => { const d = String(b.data || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > oggiIso()) throw new Error('giorno non valido'); const g = await leggiGiorno(d); if (!g) throw new Error('giorno non trovato'); const v = Number(b.voto); g.voto = v >= 1 && v <= 5 ? v : null; g.votoDa = null; await salvaGiorno(g); return { ok: true }; },
  'POST /api/sera': async b => { const g = await giornoDiOggi(); const v = Number(b.voto); if (v >= 1 && v <= 5) { g.voto = v; g.votoDa = null; } if (typeof b.perche === 'string') g.sera = b.perche.trim().slice(0, 2000); await salvaGiorno(g); return g; },
  'POST /api/inizio': async b => {
    await salvaBussola({ lavoro: String(b.lavoro || '').trim(), vita: String(b.vita || '').trim(), aree: b.aree || {}, allineata: oggiIso(), ultimoCheck: oggiIso().slice(0, 7) });
    await salvaObiettivi(b.obiettivi || {});
    if (!(await leggi(path.join(PIANO, 'Abitudini.md')))) await scrivi(path.join(PIANO, 'Abitudini.md'), '# Abitudini\n\nCose che compaiono ogni giorno nei da fare. Una per riga, con l\'area.\n\n## Ogni giorno\n- Allenamento la mattina #salute\n');
    await chiediAClaude('primo allineamento', 'L\'utente ha appena fatto il primo allineamento: ha scritto la bussola (Piano/Bussola.md) e gli obiettivi a 2 anni, 6 mesi e 1 mese (Piano/Obiettivi.md).\n\nDa fare: proporre i micro-obiettivi di questa settimana in Piano/Settimane e i da fare dei prossimi giorni in Piano/Giorni, partendo dagli obiettivi del mese.');
    return stato();
  },
  'POST /api/check-mensile': async b => {
    const bus = await leggiBussola(); const prima = await leggiObiettivi(); await salvaObiettivi(b.obiettivi || prima); await salvaBussola({ ...bus, ultimoCheck: oggiIso().slice(0, 7) });
    await chiediAClaude('controllo del mese', `L'utente ha fatto il controllo mensile degli obiettivi (${oggiIso().slice(0, 7)}).\nNota dell'utente: ${String(b.nota || 'nessuna').slice(0, 1000)}\n\nDa fare: confrontare Piano/Obiettivi.md con la versione di prima, ricalcolare i micro-obiettivi della settimana e i da fare, e segnalare in Piano/Segnale.md se la direzione è cambiata.`);
    return stato();
  },
};

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'); const chiave = `${req.method} ${url.pathname}`;
    if (chiave === 'GET /api/corso/pdf') { const pdf = await pdfCorso(url.searchParams.get('id') || ''); if (!pdf) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'application/pdf', 'cache-control': 'no-cache' }); return res.end(await fs.readFile(pdf.file)); }
    if (chiave === 'POST /api/vocali') { const pezzi = []; let n = 0; for await (const c of req) { n += c.length; if (n > 80e6) throw new Error('audio troppo grande'); pezzi.push(c); } const dati = await caricaVocale(Buffer.concat(pezzi), url); res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); return res.end(JSON.stringify(dati)); }
    if (DA_CONFIGURARE && url.pathname.startsWith('/api/')) {
      // Niente vault: nessun dato da leggere o scrivere. Le pagine mostrano come collegarlo.
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(JSON.stringify(chiave === 'GET /api/segno' ? { versione: 'da-configurare', dati: '', giorno: oggiIso() } : { daConfigurare: true, marchio: CONFIG.titolo || 'Bussola' }));
    }
    if (rotte[chiave]) {
      let corpo = {}; if (req.method === 'POST') { let raw = ''; for await (const c of req) { raw += c; if (raw.length > 100000) throw new Error('troppo grande'); } corpo = raw ? JSON.parse(raw) : {}; }
      const dati = await rotte[chiave](corpo, url); res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); return res.end(JSON.stringify(dati));
    }
    if (req.method !== 'GET') { res.writeHead(404); return res.end(); }
    let rel = url.pathname === '/' ? '/index.html' : url.pathname === '/widget' ? '/widget.html' : url.pathname;
    const file = path.join(HERE, 'public', path.normalize(rel)); if (!file.startsWith(path.join(HERE, 'public'))) { res.writeHead(403); return res.end(); }
    const dati = await fs.readFile(file); res.writeHead(200, { 'content-type': TIPI[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(dati);
  } catch (e) {
    const manca = e.code === 'ENOENT'; res.writeHead(manca ? 404 : 400, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ errore: manca ? 'non trovato' : String(e.message || e) }));
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`Bussola su http://localhost:${PORT} · ${VAULT ? 'vault: ' + VAULT : 'nessun vault collegato: scrivi "vault" in config.local.json'}`));
if (!DA_CONFIGURARE) { setTimeout(controllaCalendario, 3000); setInterval(controllaCalendario, Number(process.env.BUSSOLA_CONTROLLO_MS) || 60000); }
