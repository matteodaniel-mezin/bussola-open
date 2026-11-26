// Bussola — pagine. Barra a sinistra, una pagina per cosa. Stile "giornata guidata".
const radice = document.getElementById('foglio');
// Barra: quattro gruppi. Liste resta raggiungibile da #liste.
const NAV = [['La mia giornata', [['oggi', 'Oggi'], ['calendario', 'Calendario'], ['vocali', 'Vocale della sera'], ['weekend', 'Weekend']]], ['Come sto andando', [['obiettivi', 'Obiettivi'], ['giornate', 'Giornate'], ['lezioni', 'Lezioni'], ['soldi', 'Soldi']]], ['Lavoro', [['contesti', 'Contesti'], ['call', 'Call'], ['progetti', 'Progetti']]]];
const FONDO = [['impostazioni', 'Impostazioni']];
const AREE = ['lavoro', 'gioco', 'amore', 'salute'];
const ORIZZONTI = [['due_anni', 'Tra 2 anni', 'Dove vuoi essere tra due anni? Poche cose, grandi.'], ['sei_mesi', 'Tra 6 mesi', 'Cosa deve essere vero tra sei mesi perché tu sia sulla strada giusta?'], ['mese', 'Questo mese', 'Cosa chiudi entro fine mese?']];
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const punto = a => AREE.includes(a) ? `<i class="p ${a}" role="img" aria-label="${a}"></i>` : '';
const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1);
const eur = n => { const [i, d] = Math.abs(Number(n || 0)).toFixed(2).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+$)/g, '.') + ',' + d; };
const isoLocale = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daIso = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const dataBreve = s => { if (!s) return ''; const d = daIso(s); return `${d.getDate()} ${MESI[d.getMonth()]}`; };
const dataGiorno = s => { const d = daIso(s); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
const quando = s => { if (!s) return '—'; const g = Math.round((daIso(isoLocale(new Date())) - daIso(isoLocale(new Date(s)))) / 864e5); return g <= 0 ? 'oggi' : g === 1 ? 'ieri' : dataBreve(isoLocale(new Date(s))); };
let S = null;            // stato dal server
let bozza = null;        // primo accesso o controllo del mese in corso
let ritoAperto = false;  // pannello di chiusura della giornata
let nuovaAperta = false; // riga per aggiungere un da fare
let pag = 'oggi';        // pagina mostrata
let salto = true;        // si è cambiata pagina: la nuova parte dall'alto
const V = { callSel: 0, progSel: 0, calMese: null, listaNuova: false }; // scelte dentro le pagine

async function api(percorso, corpo) {
  if (corpo) visto = null;   // ho appena cambiato io un dato: il prossimo controllo riparte da qui
  const r = await fetch(percorso, corpo ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) } : undefined);
  const dati = await r.json().catch(() => ({})); if (!r.ok) throw new Error(dati.errore || 'Qualcosa non ha funzionato.'); return dati;
}

// ---------- pezzi comuni ----------
// Icone a linee della barra (disegnate qui, nessuna libreria). barra come nell'esempio, gruppi in maiuscolo e icone.
const ICONE = {"oggi": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/>", "calendario": "<rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16.5\" rx=\"2.5\"/><path d=\"M3 9.5h18M8 2.5v4M16 2.5v4\"/>", "vocali": "<rect x=\"9\" y=\"2.5\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M5 11a7 7 0 0 0 14 0M12 18v3.5\"/>", "weekend": "<path d=\"M3 20 9.5 8l4 7 2.5-4 5 9z\"/><path d=\"M8 20h13\"/>", "obiettivi": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>", "giornate": "<rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"1.5\"/>", "lezioni": "<path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z\"/><path d=\"M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5\"/>", "soldi": "<rect x=\"2.5\" y=\"5.5\" width=\"19\" height=\"13\" rx=\"2.5\"/><path d=\"M2.5 10h19M6.5 15h3\"/>", "contesti": "<circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20.5c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5\"/><path d=\"M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 15.3c1.7.8 2.7 2.6 3 5.2\"/>", "call": "<path d=\"M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.4 10.9a16 16 0 0 0 4.7 4.7l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z\"/>", "progetti": "<path d=\"M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z\"/>", "impostazioni": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z\"/>"};
const icona = k => ICONE[k] ? `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONE[k]}</svg>` : '';
function barra(attiva) {
  const seg = S?.segnale || {}; const st = seg.stato; const cls = st === 'devia' ? 'devia' : st === 'in linea' ? 'linea' : '';
  const voce = ([k, n]) => `<a href="#${k}" ${k === (attiva === 'corso' ? 'lezioni' : attiva) ? 'aria-current="page"' : ''}>${icona(k)}<span>${n}</span></a>`;
  const testo = seg.testo ? seg.testo : 'Claude confronta le tue giornate con la bussola. Ti avvisa qui se stai deviando.';
  // "In linea" in fondo alla barra: una rotta con le tacche e un segno sulla tacca centrale.
  // Se Claude dice che stai deviando, il segno scivola di lato e diventa arancione. Il testo si legge passandoci sopra o cliccando.
  const nome = st === 'devia' ? 'Stai deviando' : st === 'in linea' ? 'In linea' : 'Bussola';
  const SEGNALE = `<a class="stato-b ${cls}" href="#giornate" title="${esc(testo)}"><span class="riga-t"><b>${nome}</b><em>${st === 'devia' ? 'fuori rotta' : st === 'in linea' ? 'sulla rotta' : 'nessun controllo'}</em></span><span class="rotta"><i class="riga"></i>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => `<i class="t" style="left:${k * 12.5}%"></i>`).join('')}<i class="segno" style="left:${st === 'devia' ? 78 : 50}%"></i></span></a>`;
  // Pagine nascoste e nome della piattaforma: "nascondi" e "titolo" in config.local.json.
  const via = new Set(S?.nascondi || []); const nav = NAV.map(([g, voci]) => [g, voci.filter(([k]) => !via.has(k))]).filter(([, voci]) => voci.length);
  return `<nav class="lato" aria-label="Sezioni"><a class="marchio" href="#oggi">${esc(S?.marchio || 'Bussola')}</a>
    ${nav.map(([g, voci]) => `<p class="gruppo">${g}</p>${voci.map(voce).join('')}`).join('')}
    <p class="gruppo">Altro</p>${FONDO.map(voce).join('')}<span class="molla"></span>
    ${S?.esempio ? `<p class="esempio-b" role="note"><b>Dati di esempio</b><span>Persone, clienti e numeri inventati. Quando colleghi il tuo vault spariscono.</span></p>` : ''}${SEGNALE}</nav>`;
}
function pagina(attiva, centro, destra, larga) {
  const su = pag === attiva && !salto ? radice.querySelector('.centro')?.scrollTop || 0 : 0; pag = attiva; salto = false;
  radice.innerHTML = `<div class="app ${destra ? 'con-dx' : ''} ${larga ? 'dx-larga' : ''}">${barra(attiva)}<main class="centro p-${attiva}">${centro}</main>${destra ? `<aside class="destra">${destra}</aside>` : ''}</div>`;
  if (su) radice.querySelector('.centro').scrollTop = su;
  adattaBarra();
}
// "In linea" in fondo alla barra: al massimo 4 righe, poi i puntini; se non c'è posto più piccolo
// e tagliato alle righe che entrano (fino a 2). Non sparisce mai.
function adattaBarra() {
  const l = radice.querySelector('.lato'), sp = l?.querySelector('.segnale span'); if (!sp) return;
  sp.style.webkitLineClamp = ''; sp.classList.remove('stretto'); if (innerWidth < 820) return;
  const troppo = () => l.scrollHeight > l.clientHeight + 1; if (!troppo()) return;
  sp.classList.add('stretto'); for (let n = 3; n >= 2 && troppo(); n--) sp.style.webkitLineClamp = n;
}
const testa = (titolo, sotto, lato = '') => `<header class="testa"><div><h1 class="saluto">${esc(titolo)}</h1><p class="sotto">${esc(sotto)}</p></div>${lato}</header>`;
const pillola = (t, tipo = '') => `<span class="pill ${tipo}">${esc(t)}</span>`;
const scheda = (titolo, lato, dentro, cls = '') => `<section class="carta scheda ${cls}"><div class="scheda-t"><h2>${esc(titolo)}</h2>${lato ? `<span>${lato}</span>` : ''}</div>${dentro}</section>`;
const vuotoBello = (titolo, testo, dopo = '') => `<div class="vuoto-bello"><p class="vt">${titolo}</p><p class="piccolo">${testo}</p>${dopo}</div>`;
const pallini = v => { const n = Math.round(Number(v) / 2); return `<span class="pallini" role="img" aria-label="${v ? 'voto ' + String(v).replace('.', ',') + ' su 10' : 'senza voto'}" title="${v ? String(v).replace('.', ',') + ' su 10' : 'senza voto'}">${[1, 2, 3, 4, 5].map(k => `<i class="${v && k <= n ? 'si' : ''}"></i>`).join('')}<em>${v ? String(v).replace('.', ',') : ''}</em></span>`; };
// Testo del Diario reso leggibile: paragrafi, elenchi, grassetto, passi numerati e frasi citate.
function formatta(x) {
  const dentro = t => esc(t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/&quot;(.+?)&quot;/g, '<q>$1</q>');
  let out = '', lista = false; const chiudi = () => { if (lista) { out += '</ul>'; lista = false; } };
  for (const grezza of String(x).split('\n')) {
    const r = grezza.trim(); if (!r) { chiudi(); continue; }
    const titolo = /^#{1,6}\s+(.*)$/.exec(r); if (titolo) { chiudi(); out += `<p class="tit"><strong>${dentro(titolo[1])}</strong></p>`; continue; }
    const punto = /^[-•*]\s+(.*)$/.exec(r), passo = /^\*\*(\d+)\.\s*(.+?)\*\*\s*(.*)$/.exec(r);
    if (punto) { if (!lista) { out += '<ul>'; lista = true; } out += `<li>${dentro(punto[1])}</li>`; }
    else if (passo) { chiudi(); out += `<div class="passo"><span>${passo[1]}</span><div><strong>${dentro(passo[2])}</strong>${passo[3] ? `<p>${dentro(passo[3])}</p>` : ''}</div></div>`; }
    else { chiudi(); out += `<p>${dentro(r)}</p>`; }
  }
  chiudi(); return out;
}
// Da fare in gruppi: prima le abitudini, poi un gruppo per obiettivo (la "nota"), poi il resto, in fondo le fatte.
// Dentro ogni gruppo, prima le cose con un'ora in ordine di ora. L'ordine nel file non cambia: serve solo a leggere meglio.
function gruppiDaFare(todo) {
  // Per tempo: mattina, pomeriggio, sera, poi quelle senza ora. Le fatte in fondo, chiuse.
  const ora = v => { const m = /^(\d{1,2}):(\d{2})/.exec(v.tempo || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const perOra = (a, b) => (ora(a.v) ?? 9999) - (ora(b.v) ?? 9999) || a.i - b.i;
  const tutte = todo.map((v, i) => ({ v, i })); const aperte = tutte.filter(x => !x.v.fatto).sort(perOra), fatte = tutte.filter(x => x.v.fatto);
  const fascia = x => { const m = ora(x.v); return m == null ? 'Quando vuoi' : m < 13 * 60 ? 'Mattina' : m < 18 * 60 ? 'Pomeriggio' : 'Sera'; };
  const out = []; for (const k of ['Mattina', 'Pomeriggio', 'Sera', 'Quando vuoi']) { const l = aperte.filter(x => fascia(x) === k); if (l.length) out.push([k, l]); }
  if (fatte.length) out.push(['Fatte', fatte]);
  return out;
}
// Più cose con lo stesso inizio ("Ricerca 1 di 4: leggere…", "Ricerca 1 di 4: scrivere…"): l'inizio si scrive una volta sola.
const PREF = /^([^:]{3,40}):\s+(.+)$/;
function prefissoComune(voci) {
  const n = new Map(); for (const { v } of voci) { const m = PREF.exec(v.testo); if (m) n.set(m[1], (n.get(m[1]) || 0) + 1); }
  return new Set([...n].filter(([, c]) => c > 1).map(([k]) => k));
}
function sottogruppi(voci) {
  const comuni = prefissoComune(voci); const out = []; let ult = null;
  for (const x of voci) { const m = PREF.exec(x.v.testo); const k = m && comuni.has(m[1]) ? m[1] : null; const testo = k ? m[2].charAt(0).toUpperCase() + m[2].slice(1) : x.v.testo;
    if (k && k !== ult) out.push({ titolo: k, ore: voci.filter(y => PREF.exec(y.v.testo)?.[1] === k).map(y => /^\d{1,2}:\d{2}/.exec(y.v.tempo || '')?.[0]).filter(Boolean) });
    out.push({ ...x, testo, sotto: !!k }); ult = k; }
  return out;
}
// Un da fare con un'ora che coincide con un impegno di oggi appena spostato o tolto.
function cambioDi(v) {
  const ora = /^\d{1,2}:\d{2}/.exec(v.tempo || '')?.[0]; if (!ora || v.fatto) return '';
  const c = (S?.cambi || []).find(x => x.giorno === S.data && x.da === ora && x.tipo !== 'nuovo'); if (!c) return '';
  return `<span class="cambiato">l’impegno delle ${esc(ora)} ${c.tipo === 'tolto' ? 'è stato tolto' : 'ora è alle ' + esc(c.ora)}</span>`;
}
const riga = (t, len) => `<div class="traccia"><i style="width:${Math.max(0, Math.min(100, len))}%"></i></div>`;
function errore(e) { pagina(pag, `${testa('Bussola non risponde', e.message + ' Controlla che il server sia acceso, poi ricarica.')}`); }

// ---------- oggi ----------
function saluto() { const h = new Date().getHours(); return h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'; }
function chiusura(g) {
  if (ritoAperto) return `<section class="rito carta" aria-label="Chiudi la giornata"><h2>Com'è andata oggi?</h2>
    <div class="voti" role="group" aria-label="Voto alla giornata, da 1 a 5"><span>male</span>${[1, 2, 3, 4, 5].map(n => `<button data-az="voto" data-n="${n}" aria-pressed="${g.voto === n}" aria-label="${n} su 5">${n}</button>`).join('')}<span>bene</span></div>
    <label for="perche">Il momento migliore, cosa ti ha tolto energia, cosa rifaresti diversamente. Oppure <a href="#vocali">dillo a voce</a>.</label>
    <textarea id="perche" data-az="perche" rows="2" placeholder="Scrivi come parli">${esc(g.sera)}</textarea>
    <div class="azioni-oggi"><button class="btn" data-az="rito-fine">Fatto</button><span class="piccolo" id="salvato" role="status"></span></div></section>`;
  const mese = S.checkMensile ? `<a class="btn chiaro" href="#mese">Mese nuovo: rivedi gli obiettivi</a>` : '';
  if (g.voto) return `<div class="azioni-oggi"><div class="chiusa carta"><b>${g.voto} su 5</b><span>${esc(g.sera || 'Giornata chiusa.')}</span><button data-az="rito">Modifica</button></div>${mese}</div>`;
  return `<div class="azioni-oggi"><button class="btn" data-az="rito">Chiudi la giornata</button>${mese}</div>`;
}
const NUMERI = ['Nessuna cosa', 'Una cosa', 'Due cose', 'Tre cose', 'Quattro cose', 'Cinque cose', 'Sei cose', 'Sette cose', 'Otto cose', 'Nove cose', 'Dieci cose'];
function oggi() {
  if (S.primaVolta) return inizio('oggi');
  const g = S.oggi, aperte = g.todo.filter(t => !t.fatto), ag = S.agenda;
  const prima = aperte.find(t => t.tempo) || aperte[0];
  // La frase la scrive Claude ogni mattina nel file del giorno; se manca, se ne compone una semplice.
  // La riga sotto il saluto si conta dal vivo, così cambia appena spunti o aggiungi qualcosa.
  // Di quello che scrive Claude nel file ("frase") si tiene solo la parte su cosa conta di più, mai il numero.
  const np = (g.proposte || []).length; const conta = n => n === 1 ? 'Una cosa ancora da fare' : `${NUMERI[n] || n + ' cose'} ancora da fare`;
  const parole = t => (t.toLowerCase().match(/[a-zà-ú]{5,}/g) || []); let consiglio = (g.frase || '').replace(/^[^.]*\bcos[ae]\b[^.]*\.\s*/i, '').trim();
  // La frase vale solo se parla di una cosa che è ancora in lista e ancora da fare.
  if (consiglio && !aperte.some(t => parole(t.testo).some(w => parole(consiglio).includes(w)))) consiglio = '';
  const sotto = !g.todo.length ? (np ? `Niente in lista. ${np === 1 ? 'C’è una proposta' : 'Ci sono ' + NUMERI[np].toLowerCase().replace(' cose', '') + ' proposte'} qui sotto, scegli tu.` : 'Lista vuota. Premi N per scrivere la prima cosa.')
    : !aperte.length ? (g.voto ? 'Tutto fatto, giornata chiusa.' : 'Tutto fatto. Puoi chiudere la giornata.')
    : `${conta(aperte.length)}. ${consiglio || 'La più importante: ' + prima.testo.charAt(0).toLowerCase() + prima.testo.slice(1) + '.'}`;
  const minDi = o => parseInt(o) * 60 + +String(o).split(':')[1];
  // Ogni voce ha inizio e fine in minuti: la fine viene dal calendario ("fine") o dalla durata del da fare ("11:00 · 2 h"); senza, dura 1 ora.
  const durataTodo = t => { const m = /·\s*(\d+(?:[.,]\d+)?)\s*(h|min)/.exec(t || ''); return m ? Math.round(parseFloat(m[1].replace(',', '.')) * (m[2] === 'h' ? 60 : 1)) : null; };
  const voci = ag.eventi.map(e => ({ ora: e.ora, fine: e.fine || null, titolo: e.titolo, cal: true })).concat(g.todo.filter(t => /^\d{1,2}:\d{2}/.test(t.tempo || '')).map(t => { const o = t.tempo.match(/^\d{1,2}:\d{2}/)[0], d = durataTodo(t.tempo); return { ora: o, fine: d ? `${Math.floor((minDi(o) + d) / 60)}:${String((minDi(o) + d) % 60).padStart(2, '0')}` : null, titolo: t.testo }; }));
  const visti = new Set(); for (const e of voci.sort((a, b) => parseInt(a.ora) * 60 + +a.ora.split(':')[1] - (parseInt(b.ora) * 60 + +b.ora.split(':')[1]))) { const m = PREF.exec(e.titolo); if (!e.cal && m) { if (visti.has(m[1])) e.titolo = m[2].charAt(0).toUpperCase() + m[2].slice(1); visti.add(m[1]); } }
  const perOra = voci.reduce((m, e) => { const h = parseInt(e.ora); (m[h] ||= []).push(e); return m; }, {});
  // Un evento che dura più dell'ora in cui inizia continua nelle ore dopo, fino alla fine vera.
  const segue = {}; for (const e of voci) { if (!e.fine) continue; const f = minDi(e.fine), h0 = parseInt(e.ora); if (f <= (h0 + 1) * 60) continue; e.lungo = true;
    for (let h = h0 + 1; h * 60 < f; h++) (segue[h] ||= []).push({ e, fino: Math.min(60, f - h * 60), ultimo: f <= (h + 1) * 60 }); }
  const chiavi = Object.keys(perOra).map(Number); const da = Math.min(8, ...chiavi), a = Math.max(19, ...chiavi, ...Object.keys(segue).map(Number));
  // L'agenda parte da 3 ore prima di adesso; la mattina si apre con "mostra".
  const inizio = Math.max(da, Math.min(a - 4, new Date().getHours() - 3)); const nascoste = inizio > da; const quantePrima = chiavi.filter(h => h < inizio).reduce((n, h) => n + perOra[h].length, 0);
  pagina('oggi', `<h1 class="saluto">${saluto()}${S?.nome ? ', ' + esc(S.nome) : ''}</h1><p class="sotto giu">${esc(sotto)}</p>
    ${S.riallineamento ? `<section class="cambi riall" role="status"><div><b>${S.riallineamento.domande.length === 1 ? 'Una domanda' : S.riallineamento.domande.length + ' domande'} per riallinearti ${S.riallineamento.tipo === 'mese' ? 'sul mese' : 'sulla settimana'}</b><p>${esc(S.riallineamento.domande[0])}</p><p class="piccolo">Rispondi nella chat «${esc(S.riallineamento.chat)}» di Claude: aggiorna obiettivi e piattaforma.</p></div></section>` : ''}
    ${(S.cambi || []).length ? `<section class="cambi" role="status"><div><b>Il calendario è cambiato</b>${S.cambi.slice(0, 4).map(c => `<p>${esc(c.testo)}</p>`).join('')}${S.cambi.length > 4 ? `<p>e altri ${S.cambi.length - 4}</p>` : ''}</div><button class="pill bianca" data-az="cambi-ok">Ok, visto</button></section>` : ''}
    <ul class="cose">${gruppiDaFare(g.todo).map(([titolo, voci]) => titolo === 'Fatte' && !V.fatteAperte ? `<li class="gruppo-t"><button class="fatte-t" data-az="fatte" aria-expanded="false">Fatte<em>${voci.length}</em><span>mostra</span></button></li>` : `${titolo ? `<li class="gruppo-t">${titolo === 'Fatte' ? `<button class="fatte-t" data-az="fatte" aria-expanded="true">Fatte<em>${voci.length}</em><span>nascondi</span></button>` : `${esc(titolo)}<em>${voci.length}</em>`}</li>` : ''}${sottogruppi(voci).map(({ v, i, testo, sotto, titolo: st, ore }) => st ? `<li class="sotto-t">${esc(st)}${ore.length ? `<em>${ore.map(esc).join(' · ')}</em>` : ''}</li>` : `<li class="card ${v.fatto ? 'f' : ''} ${sotto ? 'in' : ''}"><button class="c" data-az="spunta" data-i="${i}" aria-pressed="${v.fatto}" aria-label="${v.fatto ? 'Segna come da fare' : 'Segna come fatta'}: ${esc(v.testo)}"></button>
      <div class="corpo"><span class="nome">${esc(testo)}</span>${cambioDi(v)}</div>
      <small>${v.tempo ? esc(v.tempo) : ''}</small>${punto(v.area)}<button class="via" data-az="togli" data-i="${i}" aria-label="Togli: ${esc(v.testo)}">×</button></li>`).join('')}`).join('')}</ul>
    ${(g.proposte || []).length ? `<section class="propone" aria-label="Proposte di Claude"><h2>Claude propone <span>scegli tu cosa entra nella giornata</span></h2>${g.proposte.map((v, i) => `<div class="card prop"><div class="corpo"><span class="nome">${esc(v.testo)}</span>${cambioDi(v)}${v.nota || v.area ? `<span class="ob">${punto(v.area)}${v.nota ? 'per: ' + esc(v.nota) : v.area}</span>` : ''}</div><small>${v.tempo ? esc(v.tempo) : ''}</small><button class="pill bianca" data-az="prop-si" data-i="${i}">Aggiungi</button><button class="mini-x" data-az="prop-no" data-i="${i}" aria-label="Scarta: ${esc(v.testo)}">×</button></div>`).join('')}</section>` : ''}
    <form class="nuova ${nuovaAperta ? 'aperta' : ''}" data-az="aggiungi"><input type="text" name="testo" placeholder="Cosa devi fare? Puoi scrivere anche 11:00 o 30 min" aria-label="Aggiungi una cosa da fare" autocomplete="off" maxlength="200" ${nuovaAperta ? '' : 'tabindex="-1"'}></form>
    ${nuovaAperta ? '' : '<button class="aggiungi" data-az="nuova">+ Aggiungi <kbd>N</kbd></button>'}
    <span class="molla"></span>${chiusura(g)}`,
  `<h2 class="dx-t">${esc(S.titolo)}</h2>
    ${nascoste ? `<button class="ag-prima" data-az="ag-prima">${V.agPrima ? 'Nascondi la mattina' : `Prima delle ${inizio}:00${quantePrima ? ` · ${quantePrima === 1 ? '1 cosa' : quantePrima + ' cose'}` : ''} · mostra`}</button>` : ''}${Array.from({ length: a - (V.agPrima ? da : inizio) + 1 }, (_, i) => (V.agPrima ? da : inizio) + i).map(h => `<div class="ora"><span>${h}:00</span><div>${(segue[h] || []).map(c => `<div class="ev cont ${c.e.cal ? 'v' : ''} ${c.ultimo ? 'ultimo' : ''}" style="--fino:${c.fino}" title="${esc(c.e.titolo)} · fino alle ${esc(c.e.fine)}" aria-hidden="true"></div>`).join('')}${(perOra[h] || []).map(e => `<div class="ev ${e.cal ? 'v' : ''} ${e.lungo ? 'lungo' : ''}"><span>${esc(e.titolo)}${e.fine ? `<small>${esc(e.ora)}–${esc(e.fine)}</small>` : ''}</span></div>`).join('')}</div></div>`).join('')}
    ${ag.collegato ? '' : '<p class="piccolo" style="margin-top:14px">Il calendario non è ancora collegato. Vedi Impostazioni.</p>'}`);
}

// ---------- calendario ----------
async function calendario() {
  const c = await api('/api/calendario' + (V.calMese ? '?mese=' + V.calMese : '')); V.cal = c;
  const fonti = c.calendari?.length ? c.calendari : c.fonte === 'ical' ? ['Google Calendar'] : [];
  pagina('calendario', `${testa(maiuscola(c.titolo), 'Lezioni, call e da fare con un’ora, in un posto solo.', `<div class="lato-t"><span class="legenda-aree">${AREE.map(a => `<span>${punto(a)}${a}</span>`).join('')}</span>
      <button class="tondo" data-az="cal" data-m="${c.prima}" aria-label="Mese prima">‹</button><button class="pill bianca" data-az="cal" data-m="">oggi</button><button class="tondo" data-az="cal" data-m="${c.dopo}" aria-label="Mese dopo">›</button></div>`)}
    <div class="sett">${['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map(d => `<span>${d}</span>`).join('')}</div>
    <div class="mese">${c.giorni.map(g => `<button class="cella ${g.nelMese ? '' : 'fuori'}" data-az="giorno" data-d="${g.data}" aria-label="${esc(dataGiorno(g.data))}, ${g.eventi.length} ${g.eventi.length === 1 ? 'impegno' : 'impegni'}"><span class="num ${g.oggi ? 'oggi' : ''}">${g.n}</span>
      ${g.eventi.map(e => `<span class="evm ${e.fatto ? 'fatto' : ''}"><i class="p ${AREE.includes(e.area) ? e.area : ''}"></i><span>${e.ora ? `<b>${esc(e.ora)}</b> ` : ''}${esc(e.titolo)}</span></span>`).join('')}
      <span class="evm altri" hidden></span></button>`).join('')}</div>
    <p class="piccolo nota-pagina">${c.fonte === 'ical' ? 'Il tuo calendario è letto in diretta, ogni minuto; gli altri calendari ogni due ore.' : c.fonte === 'connettore' ? `Letto da Claude dal tuo account Google il ${esc(c.aggiornato)}. Si aggiorna a ogni giro del pianificatore.` : 'Nessun calendario collegato: vedi Impostazioni.'} ${fonti.length ? 'Calendari: ' + fonti.map(esc).join(', ') + '. ' : ''}Il colore è l’area; grigio se non ne ha una. Clicca un giorno per vederlo tutto.</p>`);
  adattaCalendario();
}
// Ogni cella mostra solo gli impegni che ci stanno; il resto diventa "+ N altri" e si legge cliccando il giorno.
function adattaCalendario() {
  const celle = [...radice.querySelectorAll('.cella')]; if (!celle.length) return;
  const posto = Math.max(1, Math.floor((celle[0].clientHeight - 42) / 18));
  for (const c of celle) { const ev = [...c.querySelectorAll('.evm:not(.altri)')], altri = c.querySelector('.altri'); const n = ev.length > posto ? posto - 1 : ev.length; ev.forEach((e, i) => { e.hidden = i >= n; }); altri.hidden = ev.length <= posto; altri.textContent = `+ ${ev.length - n} altri`; }
}
function chiudiGiorno() { radice.querySelector('.pop-giorno')?.remove(); radice.querySelector('.cella.aperta')?.classList.remove('aperta'); }
function apriGiorno(cella) {
  const era = cella.classList.contains('aperta'); chiudiGiorno(); if (era) return;
  const g = V.cal.giorni.find(x => x.data === cella.dataset.d); if (!g) return; cella.classList.add('aperta');
  const pop = document.createElement('div'); pop.className = 'pop-giorno carta'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', dataGiorno(g.data));
  pop.innerHTML = `<h3>${esc(maiuscola(dataGiorno(g.data)))}</h3>${g.eventi.map(e => `<div class="pg ${e.fatto ? 'fatto' : ''}"><b>${esc(e.ora || '')}</b><span>${esc(e.titolo)}<em><i class="p ${AREE.includes(e.area) ? e.area : ''}"></i>${[e.area, e.tipo === 'todo' ? 'da fare' : e.calendario || 'calendario'].filter(Boolean).map(esc).join(' · ')}</em></span></div>`).join('') || '<p class="piccolo">Niente in calendario.</p>'}`;
  radice.querySelector('.app').appendChild(pop);
  const r = cella.getBoundingClientRect(); const l = r.right + 8 + pop.offsetWidth < innerWidth ? r.right + 8 : r.left - pop.offsetWidth - 8;
  pop.style.left = Math.max(8, l) + 'px'; pop.style.top = Math.max(8, Math.min(r.top, innerHeight - pop.offsetHeight - 12)) + 'px';
}

// ---------- lezioni ----------
// Claude propone le lezioni (Stato.md, "Da approvare"); tu scegli qui. Le crea Claude al giro orario.
const dataFonte = f => { const m = /^(\d{4})-(\d{2})-(\d{2})\s+(.*)$/.exec(f); return m ? `${m[4]} · ${+m[3]} ${MESI[+m[2] - 1]}` : f; };
// Ricerca per significato nella pagina Lezioni: cerca in lezioni, mappe e PDF del corso (/api/cerca).
// Mentre scrivi, il resto della pagina si nasconde e compaiono i risultati; un clic apre la lezione o la pagina del corso.
let cercaAttesa, cercaN = 0, cercaUltimi = [];
async function mostraRicerca(q) {
  const box = radice.querySelector('.lz-ris'), centro = radice.querySelector('.centro'); if (!box) return;
  q = q.trim(); V.lzCerca = q; centro.classList.toggle('cercando', q.length >= 2); if (q.length < 2) { box.innerHTML = ''; return; }
  const n = ++cercaN; if (!box.innerHTML) box.innerHTML = '<p class="lz-ris-vuoto">Cerco…</p>';
  let r; try { r = await api('/api/cerca?q=' + encodeURIComponent(q)); } catch (e) { if (n === cercaN) box.innerHTML = `<p class="lz-ris-vuoto">La ricerca non risponde: ${esc(e.message)}</p>`; return; }
  if (n !== cercaN || !box.isConnected) return; cercaUltimi = r.risultati;
  const parole = q.toLowerCase().split(/[^a-zà-ú0-9]+/i).filter(w => w.length >= 3);
  const evid = t => { let h = esc(t); for (const w of parole) h = h.replace(new RegExp(`(?<![a-zà-ú0-9])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, w.length > 4 ? w.length - 1 : w.length)}[a-zà-ú]*)`, 'gi'), '<mark>$1</mark>'); return h; };
  const capo = x => x.tipo === 'corso' ? `${x.giornata ? esc(x.giornata) + ' · ' : ''}${esc(x.nomeGiornata || x.titolo)}` : esc(x.titolo);
  const tag = x => x.tipo === 'corso' ? `Corso · pagina ${x.pagina}` : x.tipo === 'mappa' ? 'Mappa di studio' : 'Lezione';
  box.innerHTML = r.risultati.length ? `<p class="lz-ris-t">${r.risultati.length === 1 ? '1 risultato' : r.risultati.length + ' risultati'}, i più vicini a quello che hai scritto</p>` + r.risultati.map((x, i) => `<button class="lz-ris-r" data-az="lz-apri" data-i="${i}"><span class="lz-ris-tag t-${x.tipo}">${tag(x)}</span><b>${capo(x)}</b><span class="lz-ris-e">${evid(x.estratto)}</span></button>`).join('')
    : '<p class="lz-ris-vuoto">Niente di vicino. Prova con altre parole.</p>';
}
async function lezioni(dati) {
  // Meno testo: mappa corta in cima, poi un menu tra "Da decidere" e "Le tue lezioni", righe al posto delle card.
  const L = dati || await api('/api/lezioni');
  const tipi = { nuova: 'Lezione nuova', evento: 'Esempio in più', valutare: 'Da valutare' };
  const tab = V.lzTab || 'decidere'; const QUANTE = 8;   // si apre sempre su "Da decidere"
  const riga = p => `<div class="r lz-r"><div class="largo">
      <b>${esc(p.titolo)}</b>
      <em>${[p.tipo !== 'nuova' ? `<span class="lz-tipo ${p.tipo}">${tipi[p.tipo]}</span>` : '', p.fonti.length ? esc(p.fonti.map(dataFonte).join(', ')) : '', p.tipo !== 'evento' && p.esistenti[0] ? `simile a «${esc(p.esistenti[0])}»` : ''].filter(Boolean).join(' · ')}</em>
      <details class="we-piu lz-piu"><summary>Leggi</summary><p class="lz-testo">${esc(p.testo)}</p></details></div>
    <div class="lz-az">
      ${p.tipo === 'evento' && p.esistenti[0] ? `<button class="btn" data-az="lz" data-s="unisci" data-l="${esc(p.esistenti[0])}" data-id="${p.id}">Aggiungi</button><button class="btn chiaro" data-az="lz" data-s="nuova" data-id="${p.id}">A sé</button>` : `<button class="btn" data-az="lz" data-s="nuova" data-id="${p.id}">Tienila</button>`}
      ${p.tipo !== 'evento' && p.esistenti[0] ? `<button class="btn chiaro" data-az="lz" data-s="unisci" data-l="${esc(p.esistenti[0])}" data-id="${p.id}" title="Diventa un esempio in più di «${esc(p.esistenti[0])}»">Unisci</button>` : ''}
      <button class="btn chiaro" data-az="lz" data-s="no" data-id="${p.id}">No</button></div></div>`;
  const lezione = l => `<details class="r lz-r lz-tua" data-nome="${esc(l.nome)}"><summary><span class="largo"><b>${esc(l.nome)}</b>${l.regola ? `<em>${esc(l.regola)}</em>` : ''}</span><span class="quando">${l.eventi.length === 1 ? '1 volta' : `${l.eventi.length} volte`}</span></summary>
    <div class="lz-dentro">${l.perche ? `<p class="lz-testo"><b>Perché.</b> ${esc(l.perche)}</p>` : ''}${l.eventi.map(e => `<p class="lz-testo">${esc(e)}</p>`).join('')}</div></details>`;
  const titoloIdea = i => i.split(/(?<=\.)\s/)[0];
  // Con un corso: titolo e passi, barra intera, il prossimo passo con "Studia", la mappa chiusa sotto.
  const studio = m => { const c = m.corso, k = c.capitolo, caps = c.capitoli || [], gn = +String(k?.codice || c.attuale || 'G1').replace(/\D/g, '') || 1, cOra = caps.find(x => gn >= x.da && gn <= x.a); return `<article class="carta lz-mappa lz-studio">
      <div class="lz-b-t"><h2>${esc(m.nome.split(',')[0])}</h2><span class="lz-b-passi">${c.fatte} di ${c.totale} giornate</span></div>
      ${caps.length ? `<div class="lz-cap-b" role="img" aria-label="${c.fatte} di ${c.totale} giornate, in ${caps.length} capitoli">${caps.map(x => `<span class="${x === cOra ? 'qui' : ''}" style="flex:${x.a - x.da + 1}" title="${esc(x.nome)} · G${x.da}–G${x.a}"><i style="width:${Math.round(100 * x.fatte / (x.a - x.da + 1))}%"></i></span>`).join('')}</div>
      ${cOra ? `<p class="lz-cap-r">Capitolo ${caps.indexOf(cOra) + 1} di ${caps.length} · ${esc(cOra.nome)} · ${cOra.fatte} di ${cOra.a - cOra.da + 1} giornate</p>` : ''}` : `<span class="lz-barra lz-b-barra" role="img" aria-label="${c.fatte} di ${c.totale} giornate"><i style="width:${c.totale ? Math.round(100 * c.fatte / c.totale) : 0}%"></i></span>`}
      <div class="lz-b-pross"><div><p class="lz-b-et">Prossimo</p><p class="lz-b-cosa">${k ? `${esc(k.codice)} · ${esc(k.titolo)}` : esc(c.attuale || 'Giornata 1')}</p></div>
        <a class="btn" href="#corso" data-corso="${esc(c.id)}">Studia</a></div>
      ${(m.volo || []).map(v => `<a class="lz-volo" href="#corso" data-corso="${esc(v.id)}"><span>Da guardare al volo</span><b>${esc(v.titolo)}</b></a>`).join('')}
      <details class="we-piu lz-b-piu"><summary>${m.idee.length ? `<span class="lz-b-chip">${m.idee.length} ${m.idee.length === 1 ? 'idea imparata' : 'idee imparate'}</span>` : ''}${m.ancora.length ? `<span class="lz-b-chip">${m.ancora.length} da capire</span>` : ''}<span class="lz-b-apri">Apri la mappa</span></summary>
      <ol class="lz-idee">${m.idee.map(i => { const [t, ...r] = i.split(/(?<=\.)\s/); return `<li><b>${esc(t)}</b> ${esc(r.join(' '))}</li>`; }).join('')}</ol>
      ${m.nuovo.length ? `<p class="lz-sotto">Cosa c'è di nuovo</p>${m.nuovo.map(n => `<p class="lz-testo">${esc(n)}</p>`).join('')}` : ''}
      ${m.ancora.length ? `<p class="lz-sotto">Ancora da capire</p>${m.ancora.map(n => `<p class="lz-testo">${esc(n)}</p>`).join('')}` : ''}</details></article>`; };
  const mappa = m => m.corso ? studio(m) : `<article class="carta lz-mappa"><div class="lz-mt"><div><p class="lz-da">${m.stato === 'finita' ? 'Finita' : 'Sto studiando'} · ${m.fatti} di ${m.passi} passi${m.aggiornato ? ' · aggiornata il ' + esc(dataBreve(String(m.aggiornato).slice(0, 10))) : ''}</p><h2>${esc(m.nome)}</h2></div>
      <span class="lz-barra" role="img" aria-label="${m.fatti} di ${m.passi} passi"><i style="width:${m.passi ? Math.round(100 * m.fatti / m.passi) : 0}%"></i></span></div>
    ${m.idee.length ? `<ul class="lz-idee-c">${m.idee.slice(0, 3).map(i => `<li>${esc(titoloIdea(i))}</li>`).join('')}</ul>` : ''}
    ${m.corso ? `<div class="lz-corso"><a class="btn" href="#corso" data-corso="${esc(m.corso.id)}">Studia il corso</a><span>${m.corso.attuale ? `Sei a ${esc(m.corso.attuale)} · ` : ''}${m.corso.fatte} di ${m.corso.totale} giornate fatte</span></div>` : ''}
    <details class="we-piu"><summary>Tutta la mappa${m.ancora.length ? ` · ${m.ancora.length} cose ancora da capire` : ''}</summary>
      <ol class="lz-idee">${m.idee.map(i => { const [t, ...r] = i.split(/(?<=\.)\s/); return `<li><b>${esc(t)}</b> ${esc(r.join(' '))}</li>`; }).join('')}</ol>
      ${m.nuovo.length ? `<p class="lz-sotto">Cosa c'è di nuovo</p>${m.nuovo.map(n => `<p class="lz-testo">${esc(n)}</p>`).join('')}` : ''}
      ${m.ancora.length ? `<p class="lz-sotto">Ancora da capire</p>${m.ancora.map(n => `<p class="lz-testo">${esc(n)}</p>`).join('')}` : ''}</details></article>`;
  const voci = [['decidere', 'Da decidere', L.proposte.length], ['tue', 'Le tue lezioni', L.lezioni.length]].concat(L.scelte.length ? [['scelte', 'Scelte da te', L.scelte.length]] : []);
  const elenco = tab === 'decidere' ? L.proposte : tab === 'tue' ? L.lezioni : [];
  const mostra = V.lzTutte ? elenco : elenco.slice(0, QUANTE);
  pagina('lezioni', `${testa('Lezioni', 'Claude le propone da call, vocali e lavori. Tu scegli quali tenere.')}
    <div class="lz-resto">
    ${(L.mappe || []).map(mappa).join('')}
    <nav class="lz-menu" aria-label="Lezioni">${voci.map(([k, n, q]) => `<button class="${k === tab ? 'su' : ''}" data-az="lz-tab" data-t="${k}" aria-pressed="${k === tab}">${n} <em>${q}</em></button>`).join('')}<form class="lz-cerca" role="search" data-az="lz-cerca"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" name="q" value="${esc(V.lzCerca || '')}" placeholder="Cerca…" title="Cerca nelle lezioni e nel corso, anche con parole diverse" aria-label="Cerca nelle lezioni e nel corso" autocomplete="off" maxlength="200"></form></nav>
    <section class="lz-ris" aria-live="polite"></section>
    ${tab === 'decidere' ? (L.proposte.length ? `<section class="carta righe lz-lista">${mostra.map(riga).join('')}</section>` : vuotoBello('Nessuna proposta da decidere', L.scelte.length ? `Le altre le ha già scelte Claude: le trovi in "Scelte da te" (${L.scelte.length}).` : 'Quando Claude trova una cosa che vale la pena ricordare, la trovi qui.')) : ''}
    ${tab === 'tue' ? `<section class="carta righe lz-lista">${mostra.map(lezione).join('')}</section>` : ''}
    ${tab === 'scelte' && L.scelte.length ? `<h2 class="capo-sez">Scelte da te <span class="piccolo">Claude le sistema al prossimo giro, entro un'ora</span></h2><section class="carta righe lz-scelte">${L.scelte.map(s => `<div class="r"><span class="quando">${s.scelta.startsWith('no') ? 'Scartata' : s.scelta.startsWith('sì, aggiungi') ? 'Unita' : 'Tenuta'}</span><span class="lz-nome">${esc(s.titolo)}${s.daClaude ? ' <em class="lz-chi">scelta da Claude</em>' : ''}${s.scelta.startsWith('sì, aggiungi') || s.scelta.startsWith('no (') ? `<small class="lz-dove">${esc(s.scelta.replace(/^sì, aggiungi (a|alla lezione nuova) /, '→ ').replace(/\[\[|\]\]/g, '«').replace(/«([^«]+)«/, '«$1»').replace(/^no \((.*)\)$/, '$1'))}</small>` : ''}</span><button class="link" data-az="lz-annulla" data-id="${s.id}">Annulla</button></div>`).join('')}</section>` : ''}
    ${elenco.length > QUANTE ? `<button class="aggiungi lz-tutte" data-az="lz-tutte">${V.lzTutte ? 'Mostra meno' : `Guarda tutte (${elenco.length})`}</button>` : ''}
    <p class="piccolo nota-pagina">Con "Tienila" Claude scrive la lezione nella cartella Lezioni e la collega alle giornate da cui viene; con "No" la lascia cadere.</p></div>`);
  if (V.lzCerca) mostraRicerca(V.lzCerca);
  if (V.lzApri) { const d = [...radice.querySelectorAll('.lz-tua')].find(x => x.dataset.nome === V.lzApri); V.lzApri = null; if (d) { d.open = true; d.classList.add('trovata'); d.scrollIntoView({ block: 'center' }); } }
  if (V.lzMappa) { V.lzMappa = false; const d = radice.querySelector('.lz-b-piu'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); } }
}

// ---------- corso ----------
// Il corso legato alla mappa "Sto studiando", da leggere qui, con l'indice delle giornate a destra.
// Segnalibro: con lo strumento Segnalibro un clic su una parola mette lì una linea rossa con il segnalibro
// (uno per corso; un altro clic lo sposta). Riaprendo il corso compare "Vai al segnalibro". Il segnalibro sulla linea lo toglie.
const SEGNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>';
async function corso(dati) {
  const C = dati || await api('/api/corso' + (V.corsoId ? '?id=' + encodeURIComponent(V.corsoId) : ''));
  V.corsoId = C.id; V.corsoDati = C; const att = String(C.attuale || '').toLowerCase();
  const idx = C.indice.map(x => x.tipo === 'v' ? `<a class="cr-i-g cr-i-v${x.sotto ? ' sotto' : ''}" href="#corso" data-vai="${x.id}"><b>${x.num && !x.sotto ? esc(x.num) : ''}</b><span>${esc(x.testo)}</span></a>` : x.tipo === 'lez' ? `<p class="cr-i-lez">${esc(x.testo)} <em>G${x.da}–G${x.a}</em></p>`
    : `<a class="cr-i-g${x.fatta ? ' fatta' : ''}${x.id === att ? ' ora' : ''}" href="#corso" data-vai="${x.id}"><b>${x.g}</b><span>${esc(x.testo)}</span></a>`).join('');
  const sl = C.segnalibro;
  // Lettore a schermo intero: niente barra laterale, testo grande al centro, indice a sinistra, solo il segnalibro.
  const su = pag === 'corso' && !salto ? radice.querySelector('.lt-scorri')?.scrollTop || 0 : 0; pag = 'corso'; salto = false;
  const usaPdf = !!C.pdf, z = zoomPdf();
  // Niente barra in alto: a sinistra un binario di tre icone (Lezioni, Indice, Segnalibro),
  // l'indice accanto, il PDF fino in cima. Lo zoom compare nell'angolo in basso a destra quando muovi il mouse sul PDF.
  const RI = { esci: '<path d="M19 12H5M12 19l-7-7 7-7"/>', indice: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>' };
  const ri = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${RI[k]}</svg>`;
  const idxAperto = innerWidth > 900 ? !V.idxNo : !!V.idxSu;
  radice.innerHTML = `<div class="lt lt-b${V.idxSu ? ' idx-su' : ''}${V.idxNo ? ' idx-no' : ''}">
    <nav class="lt-rail" aria-label="Comandi del lettore">
      <a class="lt-r" href="#lezioni" title="Torna a Lezioni" aria-label="Torna a Lezioni">${ri('esci')}</a>
      <button class="lt-r" data-az="lt-idx" aria-pressed="${idxAperto}" title="Indice" aria-label="Indice">${ri('indice')}</button>
      <button class="lt-r lt-segna${V.segnaOn ? ' su' : ''}" data-az="cr-segna" aria-pressed="${!!V.segnaOn}" title="${V.segnaOn ? 'Annulla il segnalibro (Esc)' : 'Segnalibro: poi clicca nel punto dove sei arrivato'}" aria-label="Segnalibro">${SEGNA}</button></nav>
    <nav class="lt-indice cr-indice" aria-label="Giornate del corso"><p class="lt-i-tit">${esc(C.titolo)}</p><p class="lz-da lt-i-sotto">${!C.totale ? 'Da guardare al volo' : `${C.attuale ? `Sei a ${esc(C.attuale)} · ` : ''}${C.fatte} di ${C.totale} giornate fatte`}</p>${idx}</nav>
    <div class="lt-centro"><main class="lt-scorri">${sl && !V.segnaVisto && (!usaPdf || sl.p) ? `<a class="lt-vai" href="#corso" data-vai="cr-qui">Vai al tuo segnalibro${sl.dove ? ` <b>${esc(sl.dove)}</b>` : ''} →</a>` : ''}
      ${usaPdf ? `<div class="pdf-pagine${V.segnaOn ? ' segna' : ''}" style="--z:${z}"><p class="pdf-carica">Apro il PDF…</p></div>` : `<article class="cr-testo lt-testo${V.segnaOn ? ' segna' : ''}">${C.html}</article>`}</main>
      ${V.segnaOn ? `<p class="lt-avviso">${usaPdf ? 'Clicca sulla pagina dove sei arrivato' : 'Clicca sulla parola dove sei arrivato'} · Esc per annullare</p>` : ''}
      ${usaPdf ? `<div class="lt-zoom" role="group" aria-label="Grandezza della pagina"><button data-az="pdf-zoom" data-d="-1" aria-label="Pagina più piccola" title="Più piccola">−</button><span>${Math.round(z * 100)}%</span><button data-az="pdf-zoom" data-d="1" aria-label="Pagina più grande" title="Più grande">+</button></div>` : ''}</div></div>`;
  const centro = radice.querySelector('.lt-centro'); let fermo;
  centro.addEventListener('mousemove', () => { centro.classList.add('vivo'); clearTimeout(fermo); fermo = setTimeout(() => centro.classList.remove('vivo'), 2200); });
  if (usaPdf) return mostraPdf(C, su);
  comePdf(radice.querySelector('.lt-testo'), C);
  if (su) radice.querySelector('.lt-scorri').scrollTop = su;
  lineaSegno(); document.fonts?.ready.then(lineaSegno);
}
// Il PDF del corso: le pagine vere, disegnate con PDF.js (public/vendor/pdfjs) solo quando arrivano vicino allo schermo.
// A 100% la pagina è larga quanto la colonna, si parte dal 70%; − e + la rimpiccioliscono o ingrandiscono (la scelta resta in questo browser).
// Segnalibro: pagina e altezza nella pagina (0-1), salvati come prima in segnalibri.json.
const ZOOM = [0.6, 0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75];
function zoomPdf() { let z = 0.7; try { z = +localStorage.getItem('bussola:zoomPdf') || 0.7; } catch { /* niente memoria: 70% */ } return ZOOM.includes(z) ? z : 0.7; }   // si parte dal 70%
let pdfLib = null; const pdfDoc = {};
async function mostraPdf(C, su) {
  const box = radice.querySelector('.pdf-pagine'); if (!box) return;
  try {
    if (!pdfLib) { pdfLib = await import('/vendor/pdfjs/pdf.min.mjs'); pdfLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs'; }
    pdfDoc[C.id] ||= pdfLib.getDocument('/api/corso/pdf?id=' + encodeURIComponent(C.id)).promise;
    const doc = await pdfDoc[C.id]; if (!box.isConnected) return;
    const v1 = (await doc.getPage(1)).getViewport({ scale: 1 }); box.style.setProperty('--ar', `${v1.width} / ${v1.height}`);
    const ancore = {}; for (const [g, p] of Object.entries(C.pdf.pagine || {})) (ancore[p] ||= []).push(g);
    C.indice.filter(x => x.tipo === 'v').forEach(x => (ancore[x.p] ||= []).push(x.id));
    (C.pdf.parti || []).forEach((p, i) => { const l = C.indice.filter(x => x.tipo === 'lez')[i]; if (l && p) (ancore[p] ||= []).push(l.id); });
    box.innerHTML = Array.from({ length: doc.numPages }, (_, i) => `<div class="pdf-p" data-p="${i + 1}">${(ancore[i + 1] || []).map(a => `<span class="pdf-ancora" id="${a}"></span>`).join('')}<canvas></canvas></div>`).join('');
    const sc = radice.querySelector('.lt-scorri'); if (su) sc.scrollTop = su;
    if (V.corsoPag) { box.querySelector(`.pdf-p[data-p="${V.corsoPag}"]`)?.scrollIntoView({ block: 'start' }); V.corsoPag = null; }
    const oss = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) disegnaPagina(doc, e.target); }), { root: sc, rootMargin: '1600px 0px' });
    box.querySelectorAll('.pdf-p').forEach(d => oss.observe(d)); box._oss = oss; box._doc = doc;
    lineaPdf();
  } catch (err) { box.innerHTML = `<p class="pdf-carica">Non riesco ad aprire il PDF: ${esc(err.message)}</p>`; }
}
async function disegnaPagina(doc, div) {
  const w = div.clientWidth; if (!w || div._w === w) return; div._w = w;
  const pg = await doc.getPage(+div.dataset.p), v = pg.getViewport({ scale: 1 }), r = devicePixelRatio || 1;
  const vp = pg.getViewport({ scale: (w / v.width) * r }); const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
  await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  if (div._w === w) div.querySelector('canvas').replaceWith(cv);
}
function ridisegnaPdf() { const box = radice.querySelector('.pdf-pagine'); if (!box?._doc) return; box.querySelectorAll('.pdf-p').forEach(d => { d._w = 0; box._oss.unobserve(d); box._oss.observe(d); }); }
// La linea del segnalibro non taglia il testo: si aggancia allo spazio sopra la riga cliccata
// (o la prima riga sotto il clic), e va da un margine all'altro del testo. Le righe vengono dal testo del PDF (PDF.js).
const righeCache = {};
async function righePdf(p) {
  const doc = radice.querySelector('.pdf-pagine')?._doc; if (!doc) return null; const k = V.corsoId + '#' + p;
  return righeCache[k] ||= (async () => {
    const pg = await doc.getPage(p), vp = pg.getViewport({ scale: 1 }), tc = await pg.getTextContent(); const r = [];
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue; const [, , c, dd, e, f] = it.transform, h = it.height || Math.hypot(c, dd) || 10;
      const top = vp.height - f - h, bot = vp.height - f + h * 0.22, x0 = e, x1 = e + (it.width || 0);
      const l = r.find(q => Math.abs(q.top - top) < h * 0.5); if (l) { l.top = Math.min(l.top, top); l.bot = Math.max(l.bot, bot); l.x0 = Math.min(l.x0, x0); l.x1 = Math.max(l.x1, x1); } else r.push({ top, bot, x0, x1 });
    }
    r.sort((m, n) => m.top - n.top); return { W: vp.width, H: vp.height, r };
  })();
}
async function agganciaPdf(p, y) {
  const R = await righePdf(p).catch(() => null); if (!R || !R.r.length) return { y, x0: 0.06, x1: 0.94 };
  const yy = y * R.H; let i = R.r.findIndex(l => yy >= l.top - 2 && yy <= l.bot + 2); if (i < 0) i = R.r.findIndex(l => l.top > yy); if (i < 0) i = R.r.length - 1;
  const l = R.r[i], ny = (l.top + l.bot) / 2;
  const testo = R.r.filter(q => q.top > R.H * 0.04 && q.bot < R.H * 0.95); const x0 = Math.min(...testo.map(q => q.x0)), x1 = Math.max(...testo.map(q => q.x1));
  return { y: ny / R.H, x0: x0 / R.W, x1: x1 / R.W };
}
// Segnalibro sul PDF: niente riga sul testo. Una linguetta rossa "Sei qui" esce dal bordo destro
// della pagina all'altezza della riga, e un puntino rosso nel margine sinistro segna la riga. Non si toglie: si sposta soltanto.
async function lineaPdf() {
  radice.querySelectorAll('.pdf-pagine .pdf-segno').forEach(x => x.remove()); const sl = V.corsoDati?.segnalibro; if (!sl?.p) return;
  const d = radice.querySelector(`.pdf-p[data-p="${sl.p}"]`); if (!d) return;
  const a = await agganciaPdf(sl.p, sl.y); if (!d.isConnected) return; radice.querySelectorAll('.pdf-pagine .pdf-segno').forEach(x => x.remove());
  const s = document.createElement('div'); s.className = 'pdf-segno'; s.id = 'cr-qui'; s.style.top = (a.y * 100) + '%'; s.style.setProperty('--x', (Math.max(0.01, a.x0 - 0.022) * 100) + '%');
  s.innerHTML = `<i class="pdf-punto" aria-hidden="true"></i><span class="pdf-ling" title="Sei qui. Per spostarlo usa l'icona Segnalibro a sinistra">Sei qui</span>`; d.append(s);
}
async function segnaPdf(e, d) {
  const r = d.getBoundingClientRect(), p = +d.dataset.p, y = (await agganciaPdf(p, Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))).y;
  const C = V.corsoDati, gg = Object.entries(C.pdf.pagine || {}).filter(([, q]) => q <= p).sort((a, b) => b[1] - a[1])[0];
  const x = gg && C.indice.find(i => i.id === gg[0]), v = !x && C.indice.filter(i => i.tipo === 'v' && i.p <= p).pop(); const dove = x ? `${x.g} · ${x.testo}` : v ? `${v.testo} · pagina ${p}` : `pagina ${p}`;
  const res = await api('/api/corso/segnalibro', { id: V.corsoId, p, y, dove: dove.slice(0, 120) });
  V.segnaOn = false; V.segnaVisto = true; await corso();   // si ricarica: la giornata del segnalibro cambia giornate fatte e barra
}
// Il testo del corso con l'aspetto del PDF del corso: fogli bianchi, una lezione per foglio con la testata verde,
// i riquadri "A cosa ti serve", "Da fare oggi", "Prova finale" e le fonti piccole. Cambia solo la forma: data-b e id restano, il segnalibro funziona uguale.
function comePdf(art, C) {
  if (!art) return;
  for (const h of [...art.querySelectorAll('h3:not(.cr-g)')]) {
    const t = h.textContent.trim(), cls = /^A cosa ti serve/.test(t) ? 'pdf-serve' : /^Parole chiave/.test(t) ? 'pdf-parole' : /^Prova finale/.test(t) ? 'pdf-prova' : /^Fonti/.test(t) ? 'pdf-fonti' : null; if (!cls) continue;
    const box = document.createElement('div'); box.className = cls; h.before(box);
    for (let n = h; n && (n === h || !/^H[23]$/.test(n.tagName) && !n.classList.contains('cr-dafare')); ) { const nx = n.nextElementSibling; box.append(n); n = nx; }
  }
  const caps = [...art.querySelectorAll('h2.cr-lez')];
  caps.forEach((h, i) => {
    const m = /^Lezione (\d+)\.\s+(.+?)\s*\(G(\d+)\s*-\s*G(\d+)\)/.exec(h.textContent); if (!m) return; const n = m[4] - m[3] + 1;
    h.innerHTML = `<span class="cr-pill pdf-num">${m[1]}</span> ${esc(m[2])}`;
    const t = document.createElement('header'); t.className = 'pdf-lez'; h.before(t);
    t.innerHTML = `<p class="pdf-ord">Parte ${i + 1} di ${caps.length} del percorso</p>`; t.append(h);
    t.insertAdjacentHTML('beforeend', `<p class="pdf-meta">G${m[3]}–G${m[4]} · ${n} ${n === 1 ? 'giornata' : 'giornate'}</p>`);
  });
  for (const h of art.querySelectorAll('h2:not(.cr-lez)')) { h.classList.add('pdf-h2'); if (/^Caselle/.test(h.textContent)) h.nextElementSibling?.classList.add('pdf-caselle'); }
  const fogli = []; let cur = null;
  for (const el of [...art.children]) {
    if (el.classList.contains('cr-linea')) continue;
    if (!cur || el.classList.contains('pdf-lez') || (el.tagName === 'H2' && /^Caselle/.test(el.textContent))) { cur = document.createElement('section'); cur.className = 'pdf-foglio'; fogli.push(cur); }
    cur.append(el);
  }
  art.prepend(...fogli);
  fogli[0]?.insertAdjacentHTML('afterbegin', `<p class="pdf-alto">Corso · ${C.totale} giornate · ${caps.length} lezioni</p><h1 class="pdf-tit">${esc(C.titolo)}</h1>`);
}
// Il punto del segnalibro: blocco (data-b) e posizione della parola dentro il suo testo.
function puntoIn(el, o) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, k = o;
  while ((n = w.nextNode())) { if (k < n.data.length) { const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + 1); return r; } k -= n.data.length; }
  return null;
}
function lineaSegno() {
  const art = radice.querySelector('.cr-testo'); if (!art) return; art.querySelector('.cr-linea')?.remove();
  const sl = V.corsoDati?.segnalibro, el = sl && art.querySelector(`[data-b="${sl.b}"]`); if (!el) return;
  const box = puntoIn(el, sl.o)?.getClientRects()[0] || el.getBoundingClientRect(), a = art.getBoundingClientRect();
  const l = document.createElement('div'); l.className = 'cr-linea'; l.id = 'cr-qui'; l.style.top = Math.round(box.top - a.top - 3) + 'px';
  l.innerHTML = `<span class="cr-flag" title="Sei qui">${SEGNA}</span>`;
  art.append(l);
}
async function mettiSegno(e) {
  const pos = document.caretPositionFromPoint?.(e.clientX, e.clientY); const rg = !pos && document.caretRangeFromPoint?.(e.clientX, e.clientY);
  const nodo = pos ? pos.offsetNode : rg?.startContainer, off = pos ? pos.offset : rg?.startOffset;
  const blocco = (nodo?.nodeType === 3 ? nodo.parentElement : nodo)?.closest('[data-b]'); if (!blocco) return;
  let o = 0; const w = document.createTreeWalker(blocco, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n && n !== nodo; n = w.nextNode()) o += n.data.length;
  o += nodo.nodeType === 3 ? off : 0; const testo = blocco.textContent; while (o > 0 && !/\s/.test(testo[o - 1])) o--;   // all'inizio della parola
  const art = radice.querySelector('.cr-testo'); const titoli = [...art.querySelectorAll('h2, h3.cr-g')].filter(h => h === blocco || h.compareDocumentPosition(blocco) & Node.DOCUMENT_POSITION_FOLLOWING);
  const h = titoli[titoli.length - 1], g = h?.querySelector('.cr-pill'); const dove = h ? (g ? `${g.textContent} · ${h.textContent.slice(g.textContent.length)}` : h.textContent) : '';
  const r = await api('/api/corso/segnalibro', { id: V.corsoId, b: +blocco.dataset.b, o, dove: dove.slice(0, 120) });
  V.corsoDati.segnalibro = r.segnalibro; V.segnaOn = false; V.segnaVisto = true; await corso(V.corsoDati);
}
radice.addEventListener('click', async e => {
  const vai = e.target.closest('[data-vai]'), apri = e.target.closest('[data-corso]');
  if (apri) { V.corsoId = apri.dataset.corso; V.segnaVisto = false; V.segnaOn = false; return; }
  if (vai) { e.preventDefault(); const dest = document.getElementById(vai.dataset.vai); if (vai.dataset.vai === 'cr-qui') { V.segnaVisto = true; radice.querySelector('.cr-vai')?.remove(); } dest?.scrollIntoView({ block: vai.dataset.vai === 'cr-qui' ? 'center' : 'start' }); if (V.idxSu) { V.idxSu = false; radice.querySelector('.lt')?.classList.remove('idx-su'); } return; }   // salto diretto: il corso è lungo
  const pp = V.segnaOn && pag === 'corso' && e.target.closest('.pdf-p'); if (pp && !e.target.closest('button, a')) { e.preventDefault(); try { await segnaPdf(e, pp); } catch (err) { alert(err.message); } return; }
  if (V.segnaOn && pag === 'corso' && e.target.closest('.cr-testo') && !e.target.closest('button, a')) { e.preventDefault(); try { await mettiSegno(e); } catch (err) { alert(err.message); } }
});
let pdfAttesa; addEventListener('resize', () => { if (pag === 'corso') { lineaSegno(); clearTimeout(pdfAttesa); pdfAttesa = setTimeout(ridisegnaPdf, 200); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && V.segnaOn && pag === 'corso') { V.segnaOn = false; corso(V.corsoDati); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && V.weApri && pag === 'weekend') { V.weApri = null; weekend(V.weDati); } });
radice.addEventListener('click', e => { if (e.target.classList?.contains('we-ov')) { V.weApri = null; weekend(V.weDati); } });

// ---------- weekend ----------
async function weekend(dati) {
  const w = dati || await api('/api/weekend'); const aperte = w.proposte.filter(p => p.stato === 'proposta'), si = w.proposte.filter(p => p.stato === 'sì'), no = w.proposte.filter(p => p.stato === 'no');
  const riga = (t, v) => v ? `<div class="we-r"><span>${t}</span><p>${esc(v)}</p></div>` : '';
  const carta = p => `<article class="carta we ${p.stato === 'sì' ? 'scelta' : ''}"><div class="scheda-t"><h2>${esc(p.titolo)}</h2>${p.stato === 'sì' ? pillola('Si fa', 'verde') : p.stato === 'no' ? pillola('No', 'grigia') : ''}</div>
    <p class="we-q">${punto(p.area)}${esc([p.quando, p.con ? 'con ' + p.con : ''].filter(Boolean).join(' · '))}</p>${p.testo ? `<p class="testo">${esc(p.testo)}</p>` : ''}
    ${p.dove ? `<p class="we-dove">${esc(p.dove)}</p>` : ''}
    <div class="we-fatti">${p.costo ? `<span><b>Costo</b>${esc(p.costo.split(/[.:]/)[0])}</span>` : ''}${p.visto ? `<span><b>Visto su</b>${esc(p.visto.split(/[,.]/)[0])}</span>` : ''}</div>
    ${p.serve || p.perche || p.verificare || p.visto ? `<button class="we-apri" data-az="we-apri" data-t="${esc(p.titolo)}">Tutti i dettagli</button>` : ''}
    <div class="we-az">${p.stato === 'proposta' ? `<button class="btn" data-az="we" data-s="sì" data-t="${esc(p.titolo)}">Sì, organizzala</button><button class="btn chiaro" data-az="we" data-s="no" data-t="${esc(p.titolo)}">No</button>` : `<button class="link" data-az="we" data-s="proposta" data-t="${esc(p.titolo)}">Rimetti tra le proposte</button>`}</div></article>`;
  V.weDati = w;
  // Dettagli in un foglio al centro: a sinistra su fondo grigio i dati veloci
  // e i due bottoni uno sopra l'altro; a destra il giro, il perché, cosa portare e cosa verificare. Le card non si allungano più.
  const lista = t => String(t || '').split(/[,;]\s+|\.\s+/).map(x => x.replace(/\.$/, '').trim()).filter(Boolean);
  const fp = V.weApri && w.proposte.find(p => p.titolo === V.weApri);
  const costoBreve = fp?.costo ? fp.costo.split(/\.\s/)[0].replace(/\.$/, '') : '', costoResto = fp?.costo ? fp.costo.slice(costoBreve.length).replace(/^\.\s*/, '').trim() : '';
  const giro = fp ? (fp.testo || fp.dove || '') : '';
  const foglio = !fp ? '' : `<div class="we-ov" data-az-fuori="we-chiudi"><div class="we-foglio" role="dialog" aria-modal="true" aria-label="${esc(fp.titolo)}">
    <div class="we-f-sx"><p class="we-q">${punto(fp.area)}${esc(fp.area || '')}</p><h2>${esc(fp.titolo)}</h2>
      ${[['Quando', fp.quando], ['Con chi', fp.con], ['Dove', fp.testo ? fp.dove : ''], ['Costo', costoBreve]].filter(x => x[1]).map(([k, v]) => `<div class="we-f-d"><span>${k}</span><p>${esc(v)}</p></div>`).join('')}
      <div class="we-f-az">${fp.stato === 'proposta' ? `<button class="btn" data-az="we" data-s="sì" data-t="${esc(fp.titolo)}">Sì, organizzala</button><button class="btn chiaro" data-az="we" data-s="no" data-t="${esc(fp.titolo)}">No, non questa</button>` : `<button class="btn chiaro" data-az="we" data-s="proposta" data-t="${esc(fp.titolo)}">Rimetti tra le proposte</button>`}</div></div>
    <div class="we-f-dx"><button class="we-chiudi" data-az="we-chiudi" aria-label="Chiudi" title="Chiudi (Esc)">✕</button>
      ${giro ? `<p class="we-f-t">Il giro</p><p>${esc(giro)}</p>` : ''}${fp.perche ? `<p class="we-f-t">Perché ora</p><p>${esc(fp.perche)}</p>` : ''}${costoResto ? `<p class="we-f-t">Sul costo</p><p>${esc(costoResto)}</p>` : ''}
      <div class="we-f-liste">${fp.serve ? `<div><p class="we-f-t">Da portare</p><ul class="we-f-porta">${lista(fp.serve).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${fp.verificare ? `<div><p class="we-f-t">Da verificare prima</p><ul class="we-f-verifica">${lista(fp.verificare).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</div>
      ${fp.visto ? `<p class="we-f-visto">Visto su ${esc(fp.visto)}</p>` : ''}</div></div></div>`;
  pagina('weekend', `${testa('Weekend', 'Cose da fare lontano dallo schermo. Claude propone, tu dici sì o no.')}
    ${w.piaceVoci?.length ? `<div class="chips"><span class="piccolo">Cosa ti piace</span>${w.piaceVoci.map(v => `<span class="pill bianca">${esc(v)}</span>`).join('')}</div>` : ''}
    ${si.length ? `<h2 class="capo-sez">Si fa</h2><div class="griglia we-g">${si.map(carta).join('')}</div>` : ''}
    ${aperte.length ? `<h2 class="capo-sez">Proposte</h2><div class="griglia we-g">${aperte.map(carta).join('')}</div>` : ''}
    ${!si.length && !aperte.length ? vuotoBello('Nessuna proposta, per ora', 'Claude guarda il calendario a metà settimana: se sabato o domenica sei libero, qui trovi due o tre idee con chi, dove e quanto costa.') : ''}
    ${no.length ? `<details class="we-no"><summary>Scartate (${no.length})</summary><div class="griglia we-g">${no.map(carta).join('')}</div></details>` : ''}
    <p class="piccolo nota-pagina">Claude non prenota e non compra niente. Quando dici sì controlla meteo, orari e costi, e ti mette i passi tra le proposte dei giorni giusti.</p>${foglio}`);
  if (fp) radice.querySelector('.we-chiudi')?.focus();
}

// ---------- liste ----------
async function liste(dati) {
  const l = dati || await api('/api/liste'); V.liste = l;
  pagina('liste', `${testa('Liste', 'Cose da fare che non hanno ancora un giorno. Quando ne scegli una, passa in Oggi.')}
    <div class="chips">${l.map(x => `<span class="pill scura">${esc(x.nome)} <em>${x.voci.filter(v => !v.fatto).length}</em></span>`).join('')}
      ${V.listaNuova ? `<form data-az="lista-nuova" class="chip-form"><input name="nome" placeholder="Nome della lista" aria-label="Nome della nuova lista" maxlength="60" autocomplete="off"></form>` : `<button class="pill bianca" data-az="lista-apri">+ Nuova lista</button>`}<span class="errore" id="msg" role="status"></span></div>
    <div class="colonne">${l.map(x => { const fatte = x.voci.filter(v => v.fatto).length; return `<section class="carta lista"><div class="scheda-t"><h2>${esc(x.nome)}</h2><span>${fatte} di ${x.voci.length}</span></div>
      <input class="per" data-per="${esc(x.nome)}" value="${esc(x.per)}" placeholder="A quale obiettivo serve?" aria-label="A cosa serve la lista ${esc(x.nome)}" maxlength="120" autocomplete="off">
      ${riga('', x.voci.length ? 100 * fatte / x.voci.length : 0)}
      <ul>${x.voci.map((v, i) => `<li class="${v.fatto ? 'f' : ''}"><button class="c" data-az="lista-spunta" data-nome="${esc(x.nome)}" data-i="${i}" aria-pressed="${v.fatto}" aria-label="${v.fatto ? 'Segna come da fare' : 'Segna come fatta'}: ${esc(v.testo)}"></button><span>${esc(v.testo)}</span>
        <button class="mini" data-az="lista-oggi" data-nome="${esc(x.nome)}" data-i="${i}" title="Sposta nei da fare di oggi">in Oggi</button><button class="mini" data-az="lista-togli" data-nome="${esc(x.nome)}" data-i="${i}" aria-label="Togli: ${esc(v.testo)}">×</button></li>`).join('')}</ul>
      <form data-az="lista-aggiungi" data-nome="${esc(x.nome)}"><input name="testo" placeholder="+ Aggiungi una riga" aria-label="Aggiungi una riga a ${esc(x.nome)}" maxlength="200" autocomplete="off"></form></section>`; }).join('') }</div>${l.length ? '' : vuotoBello('Ancora nessuna lista', 'Una lista tiene le cose che non hanno ancora un giorno. Parti da una di queste, o creane una con il nome che vuoi.', `<div class="chips">${['Cose veloci', 'Lavoro', 'Casa', 'Personale'].map(n => `<button class="pill bianca" data-az="lista-rapida" data-nome="${n}">+ ${n}</button>`).join('')}</div>`)}`);
}

// ---------- obiettivi ----------
async function obiettivi() {
  if (S.primaVolta) return inizio('obiettivi');
  const p = await api('/api/piano'); const b = p.bussola || {}; const fatte = p.settimana.filter(m => m.fatto).length;
  const colonna = (t, s, dentro) => `<section class="col"><h2>${t}</h2><p class="piccolo">${s}</p>${dentro}</section>`;
  const ob = k => (p.obiettivi?.[k] || []).map(o => `<div class="card ob-card"><div class="corpo"><span class="nome">${esc(o.testo)}</span>${o.area ? `<span class="ob">${punto(o.area)}${o.area}</span>` : ''}</div></div>`).join('') || '<p class="vuoto">Ancora niente.</p>';
  pagina('obiettivi', `${testa('Obiettivi', 'Da dove vuoi arrivare a cosa fai questa settimana. Ogni colonna nasce da quella prima.', `<div class="lato-t"><a class="pill bianca" href="#mese">Rivedi gli obiettivi</a></div>`)}
    <div class="ob-alto"><section class="carta bussola"><p class="piccolo">La tua bussola</p><p class="grande">${esc(b.lavoro || '')}</p><p class="vita">${esc(b.vita || '')}</p>
      <div class="aree-ora">${AREE.map(a => `<span>${punto(a)}${a} <b>${b.aree?.[a] ?? '–'}</b></span>`).join('')}<span class="piccolo">come va adesso, da 1 a 5</span></div></section>${lineaRoadmap(p.roadmap, true)}</div>
    ${V.rmAperta ? lineaRoadmap(p.roadmap, false) : ''}
    <div class="quattro">${colonna('Tra 2 anni', '', ob('due_anni'))}${colonna('Tra 6 mesi', '', ob('sei_mesi'))}${colonna('Questo mese', '', ob('mese'))}
      ${colonna('Questa settimana', p.settimana.length ? `${fatte} di ${p.settimana.length}` : '', p.settimana.map(m => `<div class="card ob-card ${m.fatto ? 'f' : ''}"><i class="c finta ${m.fatto ? 'si' : ''}"></i><div class="corpo"><span class="nome">${esc(m.testo)}</span>${m.area ? `<span class="ob">${punto(m.area)}${m.area}</span>` : ''}</div></div>`).join('') || vuotoBello('In arrivo', 'I passi della settimana li propone Claude dagli obiettivi del mese. Compaiono qui al prossimo giro.'))}</div>
`);
}
// Roadmap come linea del tempo: ogni pallino alla sua data, "oggi" alla data di oggi.
// Piccola accanto alla bussola; un clic la apre grande sotto, con dettagli, sogno e prossimi giorni.
function lineaRoadmap(r, piccola) {
  if (!r?.tappe?.length) return '';
  const oggi = isoLocale(new Date());
  const punti = puntiRoadmap(r).map(p => ({ ...p, tot: p.passi.length, f: p.passi.filter(x => x.fatto).length }));
  const fatta = p => p.tot && p.f === p.tot; const corr = punti.findIndex(p => !fatta(p));
  const inizio = daIso(r.creata || oggi), fine = daIso(punti[punti.length - 1].entro || oggi);
  const x = s => Math.max(0, Math.min(100, 100 * (daIso(s) - inizio) / ((fine - inizio) || 1)));
  const entro = s => s ? `entro il ${dataBreve(s)}${s.slice(0, 4) !== oggi.slice(0, 4) ? ' ' + s.slice(0, 4) : ''}` : '';
  const stato = (p, i) => fatta(p) ? 'rm-fatta' : p.entro && p.entro < oggi ? 'rm-tardi' : i === corr ? 'rm-ora' : '';
  const xo = x(oggi);
  // Raggiunti (pallino verde alla sua data) e entrate fisse verso l'obiettivo di config.local.json ("obiettivoSoldi") (a righe se è una stima).
  const ragg = r.raggiunti || [], entrate = r.entrate || [], tot = entrate.reduce((a, e) => a + e.importo, 0), euro = n => n.toLocaleString('it-IT');
  const barra = entrate.map(e => `<i class="${e.stima ? 'stima' : ''}" style="width:${Math.min(100, 100 * e.importo / (obSoldi() || tot || 1))}%"></i>`).join('');
  const ultimo = ragg.slice().sort((a, b) => a.data < b.data ? 1 : -1)[0];
  const prossimo = corr < 0 ? 'Tutte le tappe sono fatte.' : `${punti[corr].titolo}, ${entro(punti[corr].entro)}`;
  // Traguardi raggiunti vicini (meno del 9% della linea) diventano un pallino solo, "3 raggiunti", con l'elenco passandoci sopra:
  // prima le etichette si sovrapponevano.
  const gruppiR = []; for (const q of ragg.slice().sort((a, b) => a.data < b.data ? -1 : 1)) { const g = gruppiR[gruppiR.length - 1]; if (g && x(q.data) - x(g[0].data) < 9) g.push(q); else gruppiR.push([q]); }
  if (piccola) return `<button class="carta rm-mini" data-az="rm-apri" aria-expanded="${!!V.rmAperta}"><span class="rm-mt"><b>Roadmap</b><span>${V.rmAperta ? 'chiudi' : 'apri'}</span></span>
    <span class="rm-linea"><i class="rm-base"></i><i class="rm-fatto-l" style="width:${xo}%"></i>${punti.map((p, i) => `<i class="rm-p ${stato(p, i)} ${i === punti.length - 1 ? 'fine' : ''}" style="left:${x(p.entro)}%"></i>`).join('')}${gruppiR.map(g => `<i class="rm-v" style="left:${x(g[g.length - 1].data)}%" title="${esc(g.map(y => y.titolo + ', ' + dataBreve(y.data)).join(' · '))}"></i>`).join('')}<i class="rm-oggi" style="left:${xo}%"></i></span>
    <span class="rm-capi"><span>${esc(dataBreve(isoLocale(inizio)))}</span><span>${esc(dataBreve(isoLocale(fine)))} ${fine.getFullYear()}</span></span>
    <span class="rm-prossimo"><em>Prossima tappa</em>${esc(prossimo)}</span>
    ${ultimo ? `<span class="rm-prossimo rm-ultimo"><em>${ragg.length > 1 ? `${ragg.length} raggiunti · l’ultimo` : 'Raggiunto'}</em>${esc(ultimo.titolo)}, ${esc(dataBreve(ultimo.data))}</span>` : ''}
    ${entrate.length ? `<span class="rm-entrate"><em>Entrate fisse al mese: ${euro(tot)} €${obSoldi() ? ` di ${euro(obSoldi())} €` : ''}</em><span class="rm-conta-barra">${barra}</span></span>` : ''}</button>`;
  const tip = (sopra, titolo, corpo) => `<span class="rm-tip" role="tooltip"><span class="sopra">${sopra}</span><b>${titolo}</b>${corpo}</span>`;
  const dettagli = p => { const aperti = p.passi.filter(q => !q.fatto); return `${p.traguardo ? `<span class="tr">${esc(p.traguardo)}</span>` : ''}<span class="rm-barra"><i style="width:${p.tot ? Math.round(p.f / p.tot * 100) : 0}%"></i></span><span class="sopra">${p.f} di ${p.tot} passi fatti${p.entro && p.entro < oggi && !fatta(p) ? ' · in ritardo' : ''}</span>${aperti.length ? `<ul>${aperti.slice(0, 4).map(q => `<li>${esc(q.testo)}</li>`).join('')}${aperti.length > 4 ? `<li class="altri">e altri ${aperti.length - 4}</li>` : ''}</ul>` : ''}`; };
  const lato = v => v < 20 ? 'a-sx' : v > 80 ? 'a-dx' : '';
  const pallini = punti.map((p, i) => { const v = x(p.entro); return `<div class="rm-g ${stato(p, i)} ${lato(v)} ${i % 2 ? 'giu' : ''} ${i === punti.length - 1 ? 'fine' : ''}" tabindex="0" style="left:${v}%" aria-label="${esc(p.sopra)}: ${esc(p.titolo)}"><i></i><span class="rm-et"><b>${esc(p.nome)}</b>${esc(dataBreve(p.entro))}</span>${tip(`${esc(maiuscola(p.sopra))} · ${entro(p.entro)}`, esc(p.titolo), dettagli(p))}</div>`; }).join('');
  const sogno = r.sogno?.length ? `<div class="rm-sogno"><span class="piccolo">Dopo la bandiera</span>${r.sogno.map(q => `<div class="rm-sogno-voce" tabindex="0"><i></i>${esc(q.titolo)}${tip('Il sogno', esc(q.titolo), `<span class="tr">${esc(q.testo)}</span>`)}</div>`).join('')}</div>` : '';
  const contatore = entrate.length ? `<div class="rm-conta"><div class="rm-conta-t"><span>Entrate fisse al mese</span><b>${euro(tot)} €${obSoldi() ? ` di ${euro(obSoldi())} €` : ''}</b></div>
    <div class="rm-conta-barra" role="img" aria-label="${euro(tot)} euro al mese">${barra}</div>
    <div class="rm-conta-voci">${entrate.map(e => `<span><i class="${e.stima ? 'stima' : ''}"></i>${esc(e.nome)} ${euro(e.importo)} €${e.nota ? ` · ${esc(e.nota)}` : ''}</span>`).join('')}${obSoldi() ? `<span class="manca">mancano ${euro(Math.max(0, obSoldi() - tot))} €</span>` : ''}</div></div>` : '';
  const SPUNTA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5l2.6 2.6L12 5.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const conquiste = gruppiR.map(g => { const q = g[g.length - 1]; const v = x(q.data); const uno = g.length === 1;
    const corpo = uno ? (q.testo ? `<span class="tr">${esc(maiuscola(q.testo))}</span>` : '') : `<ul>${g.map(y => `<li><b>${esc(y.titolo)}</b> · ${esc(dataBreve(y.data))}</li>`).join('')}</ul>`;
    return `<div class="rm-g rm-ragg ${lato(v)}" tabindex="0" style="left:${v}%" aria-label="Raggiunto: ${esc(g.map(y => y.titolo).join(', '))}"><i>${SPUNTA}</i><span class="rm-et"><b>${uno ? esc(q.titolo.split(/\s/)[0]) : `${g.length} raggiunti`}</b>${uno ? 'raggiunto' : `${esc(dataBreve(g[0].data))} – ${esc(dataBreve(q.data))}`}</span>${tip(uno ? `Raggiunto · ${dataBreve(q.data)}` : 'Raggiunti', uno ? esc(q.titolo) : `${g.length} traguardi`, corpo)}</div>`; }).join('');
  const prossimi = r.tappe.flatMap(t => t.giorni).filter(g => g.data && g.data >= oggi).slice(0, 5);
  const passo = q => `<div class="rm-passo ${q.fatto ? 'f' : ''}"><i class="c finta ${q.fatto ? 'si' : ''}"></i><span>${esc(q.testo)}${q.tempo ? ` <em>${esc(q.tempo)}</em>` : ''}</span></div>`;
  const giorni = prossimi.map(g => `<div class="rm-giorno ${g.data === oggi ? 'oggi' : ''}"><p class="piccolo">${g.data === oggi ? 'Oggi' : maiuscola(dataGiorno(g.data))}</p>${g.passi.map(passo).join('')}</div>`).join('');
  return `<section class="carta scheda roadmap rm-grande"><div class="scheda-t"><h2>Roadmap</h2><span>${esc(r.traguardo || '')}</span></div>
    ${contatore}
    <div class="rm-tempo"><i class="rm-base"></i><i class="rm-fatto-l" style="width:${xo}%"></i>${pallini}${conquiste}<div class="rm-g rm-qui" style="left:${xo}%"><span class="rm-et"><b>Oggi</b>${esc(dataBreve(oggi))}</span></div></div>
    ${sogno}${giorni ? `<p class="piccolo rm-sotto">I prossimi giorni di lavoro</p><div class="rm-giorni">${giorni}</div>` : ''}</section>`;
}
// Roadmap (Piano/Roadmap.md): una strada dalla partenza alla bandiera. Un pallino per tappa (per mese nella tappa con i mesi),
// il segnaposto "oggi" dove dovresti essere secondo la data, i dettagli passandoci sopra. Sotto il sogno e i prossimi giorni.
const MESI_INTERI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const STRADA = 'M 30 272 C 120 272 150 236 250 241 S 400 286 500 261 S 650 226 750 251 S 955 276 942 214 S 880 164 780 174 S 640 201 540 176 S 380 139 280 164 S 62 176 76 120 S 170 68 280 80 S 440 111 540 86 S 700 54 800 79 S 952 96 946 36';
const BANDIERA = '<svg class="rm-bandiera" viewBox="0 0 30 40" aria-hidden="true"><path d="M4 38V3" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M5 4h21l-6 7 6 7H5z" fill="currentColor"/></svg>';
const SEGNAPOSTO = '<svg class="rm-pin-ico" viewBox="0 0 28 38" aria-hidden="true"><path d="M14 37s12-15 12-24a12 12 0 0 0-24 0c0 9 12 24 12 24z" fill="var(--lavoro)"/><circle cx="14" cy="13" r="5.5" fill="#fff"/></svg>';
function puntiRoadmap(r) {
  const out = [];
  for (const t of r.tappe) {
    const mesi = t.giorni.filter(g => !g.data && MESI_INTERI.includes(g.titolo.toLowerCase()));
    if (!mesi.length) { out.push({ nome: `Tappa ${t.n}`, sopra: `Tappa ${t.n}`, titolo: maiuscola(t.titolo), entro: t.entro, traguardo: t.traguardo, passi: t.giorni.flatMap(g => g.passi), fisse: [] }); continue; }
    const anno = Number(String(t.entro).slice(0, 4)) || new Date().getFullYear();
    const fisse = t.giorni.filter(g => !mesi.includes(g)).flatMap(g => g.passi.map(x => `${g.titolo}: ${x.testo}`));
    mesi.forEach((g, i) => {
      const ultimo = i === mesi.length - 1, m = MESI_INTERI.indexOf(g.titolo.toLowerCase());
      out.push({ nome: maiuscola(g.titolo), sopra: `Tappa ${t.n}, ${g.titolo}`, titolo: ultimo ? maiuscola(t.titolo) : `${maiuscola(t.titolo)}: ${g.titolo}`, entro: isoLocale(new Date(anno, m + 1, 0)), traguardo: ultimo ? t.traguardo : null, passi: g.passi, fisse });
    });
  }
  return out;
}
function vistaRoadmap(r) {
  if (!r?.tappe?.length) return '';
  const oggi = isoLocale(new Date());
  const punti = puntiRoadmap(r).map(p => ({ ...p, tot: p.passi.length, f: p.passi.filter(x => x.fatto).length }));
  const entro = s => s ? `entro il ${dataBreve(s)}${s.slice(0, 4) !== oggi.slice(0, 4) ? ' ' + s.slice(0, 4) : ''}` : '';
  const fatta = p => p.tot && p.f === p.tot;
  const corr = punti.findIndex(p => !fatta(p));
  const stato = (p, i) => fatta(p) ? 'rm-fatta' : p.entro && p.entro < oggi ? 'rm-tardi' : i === corr ? 'rm-ora' : '';
  const tip = (sopra, titolo, corpo) => `<span class="rm-tip" role="tooltip"><span class="sopra">${sopra}</span><b>${titolo}</b>${corpo}</span>`;
  const dettagli = p => {
    const aperti = p.passi.filter(x => !x.fatto);
    return `${p.traguardo ? `<span class="tr">${esc(p.traguardo)}</span>` : ''}<span class="rm-barra"><i style="width:${p.tot ? Math.round(p.f / p.tot * 100) : 0}%"></i></span><span class="sopra">${p.f} di ${p.tot} passi fatti${p.entro && p.entro < oggi && !fatta(p) ? ' · in ritardo' : ''}</span>
      ${aperti.length ? `<ul>${aperti.slice(0, 4).map(x => `<li>${esc(x.testo)}</li>`).join('')}${aperti.length > 4 ? `<li class="altri">e altri ${aperti.length - 4}</li>` : ''}</ul>` : ''}${p.fisse.length ? `<span class="sopra">${esc(p.fisse.join(' · '))}</span>` : ''}`;
  };
  const pallini = punti.map((p, i) => `<div class="rm-punto ${stato(p, i)} ${i === punti.length - 1 ? 'bandiera' : ''}" tabindex="0" data-u="${i + 1}" aria-label="${esc(p.sopra)}: ${esc(p.titolo)}">${i === punti.length - 1 ? BANDIERA : ''}<span class="rm-nome">${esc(p.nome)}</span>${tip(`${esc(maiuscola(p.sopra))} · ${entro(p.entro)}`, esc(p.titolo), dettagli(p))}</div>`).join('');
  // Oggi: tra il punto prima e quello dopo, in proporzione ai giorni passati. 0 = partenza, 1 = primo pallino, ecc.
  const date = [r.creata || oggi, ...punti.map(p => p.entro)];
  const suStrada = d => { for (let i = 1; i < date.length; i++) if (d <= date[i]) { const a = daIso(date[i - 1]), b = daIso(date[i]); return i - 1 + Math.max(0, Math.min(1, (daIso(d) - a) / ((b - a) || 1))); } return punti.length; };
  const u = suStrada(oggi);
  const prossimo = corr < 0 ? 'Tutti i pallini sono fatti.' : `Prossimo pallino: ${punti[corr].titolo}, ${entro(punti[corr].entro)}.`;
  const pin = `<div class="rm-pin" tabindex="0" data-u="${u}" aria-label="Oggi">${SEGNAPOSTO}${tip(`Oggi · ${dataBreve(oggi)}`, 'Sei qui', `<span class="tr">${esc(prossimo)}</span>`)}</div>`;
  const sogno = r.sogno?.length ? `<div class="rm-sogno"><span class="piccolo">Dopo la bandiera</span>${r.sogno.map(s => `<div class="rm-sogno-voce" tabindex="0"><i></i>${esc(s.titolo)}${tip('Il sogno', esc(s.titolo), `<span class="tr">${esc(s.testo)}</span>`)}</div>`).join('')}</div>` : '';
  const prossimi = r.tappe.flatMap(t => t.giorni).filter(g => g.data && g.data >= oggi).slice(0, 5);
  const passo = x => `<div class="rm-passo ${x.fatto ? 'f' : ''}"><i class="c finta ${x.fatto ? 'si' : ''}"></i><span>${esc(x.testo)}${x.tempo ? ` <em>${esc(x.tempo)}</em>` : ''}</span></div>`;
  const giorni = prossimi.map(g => `<div class="rm-giorno ${g.data === oggi ? 'oggi' : ''}"><p class="piccolo">${g.data === oggi ? 'Oggi' : maiuscola(dataGiorno(g.data))}</p>${g.passi.map(passo).join('')}</div>`).join('');
  return `<section class="carta scheda roadmap"><div class="scheda-t"><h2>Roadmap</h2><span>${esc(r.traguardo || '')}</span></div>
    <div class="rm-mappa" data-n="${punti.length}"><svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path class="rm-strada" d="${STRADA}"/><path class="rm-fatto" d=""/></svg><span class="rm-partenza" data-u="0"></span>${pallini}${pin}</div>
    ${sogno}${giorni ? `<p class="piccolo rm-sotto">I prossimi giorni di lavoro</p><div class="rm-giorni">${giorni}</div>` : ''}</section>`;
}
// Mette pallini e segnaposto sulla strada (le coordinate dipendono dal disegno) e colora il tratto già percorso.
function disponiRoadmap() {
  const m = radice.querySelector('.rm-mappa'); if (!m) return;
  const strada = m.querySelector('.rm-strada'), L = strada.getTotalLength(), n = Number(m.dataset.n) || 1;
  const lungo = u => L * Math.max(0, Math.min(1, u / n));
  for (const el of m.querySelectorAll('[data-u]')) {
    const p = strada.getPointAtLength(lungo(Number(el.dataset.u))), x = p.x / 10, y = p.y / 3;
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.classList.toggle('a-sx', x < 25); el.classList.toggle('a-dx', x > 72); el.classList.toggle('sotto', y < 45);
  }
  const fine = lungo(Number(m.querySelector('.rm-pin')?.dataset.u || 0)), pezzi = [];
  for (let k = 0; k <= 80; k++) { const p = strada.getPointAtLength(fine * k / 80); pezzi.push(`${k ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
  m.querySelector('.rm-fatto').setAttribute('d', pezzi.join(' '));
}

// ---------- giornate ----------
async function giornate() {
  const d = await api('/api/giornate'); const seg = d.segnale; const per = Object.fromEntries(d.giorni.map(g => [g.data, g]));
  const oggiD = daIso(isoLocale(new Date())); const lun = new Date(oggiD); lun.setDate(oggiD.getDate() - ((oggiD.getDay() + 6) % 7) - 28);
  const celle = Array.from({ length: 35 }, (_, i) => { const x = new Date(lun); x.setDate(lun.getDate() + i); const k = isoLocale(x); return { k, g: per[k], oggi: x.getTime() === oggiD.getTime(), dopo: x > oggiD }; });
  for (const g of d.giorni) { g.v = g.voto || g.stima || null; g.auto = !g.voto && !!g.stima || g.votoDa === 'claude'; }
  const votati = d.giorni.filter(g => g.v || g.fatte.length).reverse(); const ultimi14 = d.giorni.slice(-14); const conta = Object.fromEntries(AREE.map(a => [a, ultimi14.reduce((n, g) => n + (g.aree?.[a] || 0), 0)])); const max = Math.max(1, ...Object.values(conta));
  // le giornate in testa a sinistra; a destra prima la cosa da cambiare, poi i giorni buoni e le aree, in fondo come stai andando.
  const settimane = []; for (let w = 0; w < 5; w++) settimane.push(celle.slice(w * 7, w * 7 + 7));
  const primaUtile = settimane.findIndex(w => w.some(c => c.g?.v || c.oggi)); const celleUtili = settimane.slice(Math.max(0, primaUtile)).flat();
  const votiSett = d.giorni.filter(g => g.v && daIso(g.data) >= new Date(oggiD.getTime() - 6 * 864e5)); const media = votiSett.length ? (votiSett.reduce((n, g) => n + g.v, 0) / votiSett.length).toFixed(1).replace('.', ',') : null;
  const st = seg.stato === 'devia' ? 'devia' : seg.stato === 'in linea' ? 'linea' : '';
  pagina('giornate', `${testa('Giornate', 'Il voto di ogni sera, e cosa hanno in comune i giorni buoni.')}
    <div class="due"><div class="pila">
      ${scheda(`Ultime ${settimane.length - Math.max(0, primaUtile)} settimane`, `<span class="legenda">1 ${[1, 2, 3, 4, 5].map(n => `<i class="v${n}"></i>`).join('')} 5</span>`, `<div class="calore"><div class="capo">${['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map(x => `<span>${x}</span>`).join('')}</div>
        ${celleUtili.map(c => `<div class="q ${c.g?.v ? 'v' + c.g.v : ''} ${c.g?.auto ? 'auto' : ''} ${c.oggi ? 'oggi' : ''} ${c.dopo ? 'dopo' : ''}" title="${esc(dataGiorno(c.k))}${c.g?.sera ? ': ' + esc(c.g.sera) : ''}">${c.g?.v || (c.oggi ? 'oggi' : '')}</div>`).join('')}</div><p class="piccolo" style="margin-top:10px">I voti li dà Claude. Per cambiarne uno clicca il numero accanto al giorno, qui sotto.</p>`)}
      <section class="carta righe giorni" data-allinea="1">${votati.map(g => `<div class="r"><span class="quando">${esc(dataGiorno(g.data))}</span><label class="voto dai ${g.v ? 'v' + g.v : 'senza'}" title="${g.auto ? 'Voto dato da Claude. Clicca per cambiarlo' : g.voto ? 'Voto dato da te. Clicca per cambiarlo' : 'Dai un voto a questo giorno'}">${g.v || '+'}<select data-voto-giorno="${g.data}" aria-label="Voto di ${esc(dataGiorno(g.data))}"><option value="">lascia fare a Claude</option>${[1, 2, 3, 4, 5].map(n => `<option ${g.voto === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><button class="largo nota-g" data-az="apri-nota" aria-expanded="false" title="Clicca per leggerla tutta">${g.fatte.length ? `<b>${esc(g.fatte.join(' · '))}</b>` : ''}${g.sera ? `<em>${esc(g.sera)}</em>` : ''}${!g.fatte.length && !g.sera ? '<em>Senza note.</em>' : ''}</button></div>`).join('') || vuotoBello('Il primo voto arriva stasera', 'Quando chiudi la giornata con un voto e una riga, compare qui. Dopo una decina di giorni si vede cosa hanno in comune quelli buoni.', '<a class="pill bianca" href="#oggi">Vai a Oggi</a>')}</section></div>
    <div class="pila stretta gg-dx">
      <section class="carta gg-cambia"><p class="gg-et">Una cosa da cambiare</p><p class="gg-testo">${esc(seg.correzione || 'Nessuna, per ora. Claude ne sceglie una sola, la domenica, solo se serve.')}</p></section>
      ${scheda('Cosa hanno in comune i giorni buoni', '', seg.schemi.length ? seg.schemi.map(x => `<p class="schema">${esc(x)}</p>`).join('') : '<p class="piccolo">Claude lo trova leggendo le tue giornate. Servono almeno dieci giorni con il voto.</p>')}
      ${scheda('Le quattro aree', 'ultime due settimane', AREE.map(a => `<div class="barra-area">${punto(a)}<span>${a}</span>${riga('', 100 * conta[a] / max)}<em>${conta[a]}</em></div>`).join('') + '<p class="piccolo gg-aree-nota">Cose fatte per area.</p>', 'gg-aree')}
      <section class="carta gg-stato ${st}"><p class="gg-et"><i></i>${st === 'devia' ? 'Stai deviando' : st === 'linea' ? 'In linea' : 'Come stai andando'}${media ? `<span>media 7 giorni <b>${media}</b> su 5</span>` : ''}</p><p class="gg-testo piccola" title="${esc(seg.testo || '')}">${esc(seg.testo || 'Claude confronta le tue giornate con la bussola ogni sera dopo le 21.')}</p></section></div></div>`);
  adattaElenchi();
}

// ---------- contesti ----------
// Elenco a righe: contesto, prossimo passo e soldi.
// L'obiettivo di entrate al mese si sceglie in config.local.json ("obiettivoSoldi"); 0 = non mostrarlo.
const obSoldi = () => Number(S?.obiettivoSoldi) || 0;
const euro = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+$)/g, '.') + ' €';
async function contesti(dati) {
  const tutti = dati || await api('/api/lavoro'); V.ctxDati = tutti; const f = V.ctx || 'Tutti'; const vivi = tutti.filter(c => c.stato !== 'Archiviato');
  const l = f === 'Tutti' ? vivi : tutti.filter(c => c.stato === f); const quanti = s => tutti.filter(c => c.stato === s).length;
  const firmato = vivi.reduce((s, c) => s + (c.soldi?.firmato || 0), 0);
  const colSoldi = c => {
    const s = c.soldi; const aperto = V.soldiApri === c.nome;
    const pop = aperto ? `<form class="soldi-pop carta" data-soldi="soldi" data-nome="${esc(c.nome)}"><div class="sp-t"><b>${esc(c.nome)} · soldi</b><button type="button" class="mini-x" data-soldi="soldi-chiudi" aria-label="Chiudi">✕</button></div>
      <label><span>Firmato al mese</span><span class="campo"><input name="firmato" inputmode="numeric" value="${s ? (s.daCapire ? 'da capire' : s.firmato) : ''}" placeholder="0"><em>€ / mese</em></span></label>
      <p class="piccolo">Conta solo con un messaggio scritto: cifra, cosa si fa, da quando. Se la cifra non si sa ancora scrivi “da capire”.</p>
      <label><span>Incassato a ${MESI_LUNGHI[new Date().getMonth()]}</span><span class="campo"><input name="incassato" inputmode="numeric" value="${s ? s.incassato : ''}" placeholder="0"><em>€</em></span></label>
      <label class="sp-ric"><span>Ricorrente</span><input type="checkbox" name="ricorrente" role="switch" ${s?.ricorrente ? 'checked' : ''}></label>
      <div class="sp-piede"><span class="piccolo">Li aggiorna anche Claude.</span><button class="pill scura">Salva</button></div></form>` : '';
    if (!s) return `<button class="soldi-cella vuota" data-soldi="soldi-apri" data-nome="${esc(c.nome)}" aria-expanded="${aperto}"><span class="vuoto-trat">—</span><span class="mostra">+ soldi</span></button>${pop}`;
    return `<button class="soldi-cella" data-soldi="soldi-apri" data-nome="${esc(c.nome)}" aria-expanded="${aperto}"><span class="sc-r1"><b class="${s.firmato || s.daCapire ? '' : 'zero'}">${s.daCapire ? 'da capire' : euro(s.firmato) + ' / mese'}</b>${s.ricorrente ? '<span class="pill verde pmini">ricorrente</span>' : ''}</span><span class="piccolo">incassato ${euro(s.incassato)}</span></button>${pop}`;
  };
  const statoSel = c => `<label class="pill stato pmini ${c.stato === 'Attivo' ? 'verde' : 'grigia'}"><span>${esc(c.stato)}</span><svg viewBox="0 0 8 5" aria-hidden="true"><path d="M1 1l3 3 3-3"/></svg><select data-stato="${esc(c.nome)}" aria-label="Stato di ${esc(c.nome)}">${['Attivo', 'In attesa', 'Archiviato'].map(s => `<option ${s === c.stato ? 'selected' : ''}>${s}</option>`).join('')}</select></label>`;
  const riga = c => `<div class="r ${V.soldiApri === c.nome ? 'su' : ''}"><div class="ctx-nome"><b><i class="p ${c.stato === 'Attivo' ? 'salute' : ''}"></i>${esc(c.nome)}</b><span class="ctx-meta">${c.tipo ? esc(c.tipo) : ''}${statoSel(c)}</span></div>
    <p class="ctx-pp">${esc(c.prossimo || 'Nessun prossimo passo')}</p><div class="ctx-soldi">${colSoldi(c)}</div></div>`;
  pagina('contesti', `${testa('Contesti', 'Clienti, progetti e persone. A che punto siamo e qual è il prossimo passo.')}
    <div class="chips ctx-chips">${[['Tutti', vivi.length], ['Attivo', quanti('Attivo')], ['In attesa', quanti('In attesa')], ['Archiviato', quanti('Archiviato')]].map(([n, q]) => `<button class="pill ${n === f ? 'scura' : 'bianca'}" data-az="ctx" data-f="${n}" aria-pressed="${n === f}">${n === 'Attivo' ? 'Attivi' : n === 'Archiviato' ? 'Archiviati' : n} <em>${q}</em></button>`).join('')}<span class="errore" id="msg" role="status"></span>
      <span class="molla"></span><span class="ctx-tot" title="Somma del firmato al mese dei contesti non archiviati.">Firmato al mese <b>${euro(firmato)}</b>${obSoldi() ? ` <span>su ${euro(obSoldi())}</span>` : ''}</span></div>
    ${l.length ? `<section class="carta righe ctx-lista"><div class="r intest"><span class="ctx-nome">Contesto</span><span class="ctx-pp">Prossimo passo</span><span class="ctx-soldi">Soldi · ${MESI_LUNGHI[new Date().getMonth()]}</span></div>${l.map(riga).join('')}</section>`
      : vuotoBello(f === 'Archiviato' ? 'Niente in archivio' : 'Nessun contesto qui', f === 'Archiviato' ? 'Per archiviare un contesto scegli “Archiviato” dal menu sotto il suo nome. Resta nel taccuino, sparisce solo da qui.' : 'Cambia filtro per vedere gli altri.')}
    <p class="piccolo nota-pagina">Arriva dalla cartella Contesti del taccuino. Si aggiorna quando lavori con Claude.</p>`);
}
const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// Clic e moduli del riquadro dei soldi in Contesti (data-soldi, separati da data-az).
radice.addEventListener('click', async e => {
  const b = e.target.closest('button[data-soldi]'); if (!b) return; const az = b.dataset.soldi, d = b.dataset;
  try {
    if (az === 'soldi-apri') { V.soldiApri = V.soldiApri === d.nome ? null : d.nome; await contesti(V.ctxDati); radice.querySelector('.soldi-pop input')?.focus(); }
    else if (az === 'soldi-chiudi') { V.soldiApri = null; await contesti(V.ctxDati); }
  } catch (err) { if (!dice(err.message)) errore(err); }
});
radice.addEventListener('submit', async e => {
  const form = e.target; const az = form.dataset.soldi; if (!az) return; e.preventDefault(); e.stopImmediatePropagation();
  try {
    if (az === 'soldi') { V.ctxDati = await api('/api/contesti/soldi', { nome: form.dataset.nome, firmato: form.firmato.value, incassato: form.incassato.value, ricorrente: form.ricorrente.checked }); V.soldiApri = null; await contesti(V.ctxDati); }
  } catch (err) { if (!dice(err.message)) errore(err); }
}, true);

// ---------- call ----------
async function call() {
  const [c, m1, f] = await Promise.all([api('/api/call'), api('/api/calendario'), api('/api/fathom').catch(() => ({ collegato: false, registrazioni: [] }))]);
  const m2 = await api('/api/calendario?mese=' + m1.dopo); const oggiK = isoLocale(new Date());
  const visti = new Set(); const prossime = m1.giorni.concat(m2.giorni).filter(g => g.data >= oggiK).flatMap(g => g.eventi.filter(e => e.tipo === 'cal' && /call|demo|chiamata|meeting|incontro|visita/i.test(e.titolo)).map(e => ({ ...e, data: g.data })))
    // Una call di oggi già iniziata non è più "prossima".
    .filter(e => { if (e.data > oggiK) return true; const m = /^(\d{1,2}):(\d{2})/.exec(e.ora || ''); if (!m) return true; const ora = new Date(); return +m[1] * 60 + +m[2] > ora.getHours() * 60 + ora.getMinutes(); }).filter(e => { const k = e.data + e.titolo; if (visti.has(k)) return false; visti.add(k); return true; }).slice(0, 4);
  const fsel = V.callTipo === 'f' ? f.registrazioni.find(r => r.id === V.fathomSel) : null; const sel = fsel ? null : (c[V.callSel] || c[0]); const stesso = sel ? f.registrazioni.filter(r => r.data === sel.data) : [];
  const dettF = fsel ? `<h2 class="dx-titolo">${esc(fsel.titolo)}</h2><p class="piccolo">${esc([dataGiorno(fsel.data), fsel.ora, fsel.minuti ? fsel.minuti + ' min' : '', fsel.con.length ? 'con ' + fsel.con.join(', ') : ''].filter(Boolean).join(' · '))}</p>
    ${fsel.url ? `<p style="margin-top:12px"><a class="pill bianca" href="${esc(fsel.url)}" target="_blank" rel="noopener">Apri la registrazione in Fathom</a></p>` : ''}
    <div class="dettaglio">${fsel.azioni.length ? `<section class="blocco"><h3>Cose da fare uscite dalla call</h3><div class="prosa"><ul>${fsel.azioni.map(a => `<li class="${a.fatta ? 'fatta' : ''}">${esc(a.testo)}${a.di ? ` <q>${esc(a.di)}</q>` : ''}</li>`).join('')}</ul></div></section>` : ''}
    ${fsel.riassunto ? `<section class="blocco"><h3>Riassunto di Fathom</h3><div class="prosa">${formatta(fsel.riassunto)}</div></section>` : '<p class="piccolo">Fathom non ha ancora un riassunto per questa call.</p>'}</div>` : '';
  const blocco = (t, x, cls = '') => x ? `<section class="blocco ${cls}"><h3>${t}</h3><div class="prosa">${formatta(x)}</div></section>` : '';
  const lungo = (sel?.successo || '').length > 700;
  pagina('call', `${testa('Call', 'Per ognuna: com’è andata, cosa tenere, cosa cambiare.')}
    ${prossime.length ? `<h2 class="capo-sez">Prossime</h2><div class="coppia">${prossime.map(e => `<div class="carta mini-card"><b>${esc(e.titolo)}</b><span>${esc(dataGiorno(e.data))}${e.ora ? ' · ' + esc(e.ora) : ''}</span></div>`).join('')}</div>` : ''}
    <nav class="lz-menu call-menu" aria-label="Call"><button class="${V.callTab !== 'f' ? 'su' : ''}" data-az="call-tab" data-t="d" aria-pressed="${V.callTab !== 'f'}">Fatte <em>${c.length}</em></button><button class="${V.callTab === 'f' ? 'su' : ''}" data-az="call-tab" data-t="f" aria-pressed="${V.callTab === 'f'}">Registrate da Fathom <em>${f.collegato ? f.registrazioni.length : ''}</em></button></nav>
    ${V.callTab === 'f' ? f.collegato ? `<section class="carta righe call-lista">${f.registrazioni.map(x => `<button class="r ${x === fsel ? 'sel' : ''}" data-az="fathom-sel" data-id="${esc(x.id)}"><span class="largo"><b>${esc(x.titolo)}</b><em>${esc(x.con.join(', ') || 'registrazione')}</em></span><span class="quando">${esc(dataBreve(x.data))}</span><span class="quando">${x.minuti ? x.minuti + ' min' : ''}</span></button>`).join('') || '<p class="piccolo vuota">Nessuna registrazione negli ultimi tre mesi.</p>'}</section>` : vuotoBello('Fathom non è ancora collegato', esc(f.errore || 'Serve la tua chiave di Fathom: incollala nel file di configurazione, come spiegato in Impostazioni.'), '<a class="pill bianca" href="#impostazioni">Vai a Impostazioni</a>') : `<section class="carta righe call-lista">${c.map((x, i) => `<button class="r ${x === sel ? 'sel' : ''}" data-az="call-sel" data-i="${i}"><span class="largo"><b>${esc(x.titolo)}</b><em>${esc(x.contesto)}</em></span><span class="quando">${esc(dataBreve(x.data))}</span>${pallini(x.voto)}</button>`).join('') || '<p class="piccolo vuota">Nessuna call nel taccuino.</p>'}</section>`}
    <p class="piccolo nota-pagina">Le call “Fatte” arrivano dal Diario del taccuino, con voto e lezioni. Le registrazioni arrivano da Fathom, in sola lettura.</p>`,
  fsel ? dettF : sel ? `<h2 class="dx-titolo">${esc(sel.titolo)}</h2><p class="piccolo">${esc([sel.contesto, dataBreve(sel.data), sel.voto ? 'voto ' + String(sel.voto).replace('.', ',') : 'senza voto'].filter(Boolean).join(' · '))}</p>
    ${stesso.map(r => `<p style="margin-top:10px"><button class="pill bianca" data-az="fathom-sel" data-id="${esc(r.id)}" title="${esc(r.titolo)}">Apri la registrazione di Fathom${stesso.length > 1 ? ': ' + esc(r.titolo) : ''}</button></p>`).join('')}
    <div class="dettaglio">${blocco('In breve', sel.esito)}${blocco('Andato bene', sel.beneTutto, 'bene')}${blocco('Da migliorare', sel.maleTutto, 'male')}${blocco('Impegni', sel.impegni)}
    ${sel.lezioni.length ? `<section class="blocco"><h3>Lezioni</h3>${sel.lezioni.map(l => `<p class="lezione">${esc(l)}</p>`).join('')}</section>` : ''}
    ${sel.successo ? (lungo ? `<details class="blocco racconto"><summary><h3>Cosa è successo, per esteso</h3></summary><div class="prosa">${formatta(sel.successo)}</div></details>` : blocco('Cosa è successo', sel.successo)) : ''}
    ${!sel.esito && !sel.beneTutto && !sel.maleTutto && !sel.impegni && !sel.successo ? '<p class="piccolo">Nel Diario questa nota non ha ancora dettagli.</p>' : ''}</div>` : '', true);
  adattaElenchi();
}

// ---------- vocali ----------
let reg = null; // registrazione in corso
let giroVocali = null;
const durata = s => s == null ? '' : s < 60 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`;
async function vocali(dati) {
  const v = dati || await api('/api/vocali'); clearTimeout(giroVocali);
  const stato = x => x.stato === 'trascritto' ? '' : pillola(x.stato === 'in corso' ? 'sto trascrivendo' : x.stato === 'interrotta' ? 'interrotta' : 'non riuscita', 'grigia');
  pagina('vocali', `${testa('Vocali', 'Parla, il Mac trascrive e lascia il testo nel taccuino.')}
    <section class="carta sera"><button class="rec ${reg ? 'attivo' : ''}" data-az="rec" data-tipo="sera" aria-label="${reg ? 'Ferma e trascrivi' : 'Registra il vocale della sera'}"><i></i></button>
      <div class="sera-t"><h2>${reg ? 'Sto registrando' : 'Vocale della sera'}</h2><p class="testo">${reg ? `<span id="tempo">0:00</span> · premi di nuovo per fermare e trascrivere.` : 'Rispondi a voce alle stesse cinque domande, ogni sera. Due minuti. Dopo scegli solo il voto.'}</p>
        <p class="piccolo" id="msg" role="status"></p></div>
      <ol>${v.domande.map(q => `<li>${esc(q)}</li>`).join('')}</ol></section>
    <div class="capo-riga"><h2 class="capo-sez">Trascritti</h2><span class="piccolo"><button class="link" data-az="rec" data-tipo="vocale" ${reg ? 'disabled' : ''}>Registra un altro vocale</button> · <label class="link">carica un audio<input type="file" id="file-audio" accept="audio/*,video/mp4" hidden></label></span></div>
    <section class="carta righe">${v.vocali.map(x => `<details class="r voc"><summary><span class="largo"><b>${esc(x.titolo)}</b><em>${esc(x.inizio || (x.stato === 'in corso' ? 'Trascrizione in corso, ci vuole circa un decimo della durata.' : ''))}</em></span>${stato(x)}<span class="quando">${esc(x.giorni?.length > 1 ? `${daIso(x.giorni[0]).getDate()}-${dataBreve(x.giorni.at(-1))}` : dataBreve(x.giorni?.[0] || x.data))}</span><span class="quando">${durata(x.secondi)}</span></summary>
      <div class="intero">${x.testo ? `<p class="testo">${esc(x.testo)}</p>` : ''}${x.stato !== 'trascritto' && x.stato !== 'in corso' ? `<button class="pill bianca" data-az="riprova" data-id="${esc(x.id)}">Riprova la trascrizione</button>` : ''}${x.nota ? `<p class="piccolo">Nel taccuino: Inbox/${esc(x.nota)}</p>` : ''}</div></details>`).join('') || vuotoBello('Ancora nessun vocale', 'Premi il tasto rosso qui sopra e rispondi alle cinque domande. La trascrizione compare qui dopo qualche secondo.')}</section>
    <p class="piccolo nota-pagina">La trascrizione avviene sul Mac, senza mandare l’audio fuori. Gli audio restano nella cartella del progetto; nel taccuino va solo il testo, in Inbox.</p>`);
  if (reg) aggiornaTempo();
  if (v.vocali.some(x => x.stato === 'in corso')) giroVocali = setTimeout(() => { if (pag === 'vocali' && !reg && !radice.querySelector('details[open]')) vocali().catch(() => {}); }, 5000);
}
function aggiornaTempo() { const t = document.getElementById('tempo'); if (!t || !reg) return; const s = Math.floor((Date.now() - reg.t0) / 1000); t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
setInterval(aggiornaTempo, 1000);
async function mandaAudio(blob, tipo, secondi, titolo) {
  const est = /mp4|m4a|aac/.test(blob.type) ? 'm4a' : /mpeg|mp3/.test(blob.type) ? 'mp3' : /wav/.test(blob.type) ? 'wav' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
  const q = new URLSearchParams({ tipo, est, ...(secondi ? { secondi: String(Math.round(secondi)) } : {}), ...(titolo ? { titolo } : {}) });
  const r = await fetch('/api/vocali?' + q, { method: 'POST', body: blob }); const dati = await r.json().catch(() => ({})); if (!r.ok) throw new Error(dati.errore || 'Non sono riuscito a salvare l’audio.'); return dati;
}
async function registra(tipo) {
  if (reg) { reg.mr.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Questo browser non registra audio. Usa “carica un audio”.');
  const flusso = await navigator.mediaDevices.getUserMedia({ audio: true }); const mr = new MediaRecorder(flusso); const pezzi = [];
  reg = { mr, t0: Date.now() };
  mr.ondataavailable = e => { if (e.data.size) pezzi.push(e.data); };
  mr.onstop = async () => { const secondi = (Date.now() - reg.t0) / 1000; reg = null; flusso.getTracks().forEach(t => t.stop()); try { await vocali(await mandaAudio(new Blob(pezzi, { type: mr.mimeType || 'audio/webm' }), tipo, secondi)); } catch (e) { await vocali().catch(() => {}); const m = document.getElementById('msg'); if (m) m.textContent = e.message; } };
  mr.start(); vocali().catch(() => {});
}

// ---------- progetti ----------
async function progetti() {
  const [p, ctx] = await Promise.all([api('/api/progetti'), api('/api/lavoro')]); const f = V.progF || 'Tutti'; const vivi = p.progetti.filter(x => x.stato !== 'Archiviato'); const elenco = f === 'Tutti' ? vivi : p.progetti.filter(x => x.stato === f); const quanti = s => p.progetti.filter(x => x.stato === s).length;
  const sel = elenco.find(x => x.nome === V.progNome) || elenco[0]; const k = p.conteggi || {}; const nomi = [...new Set(ctx.map(c => c.nome).concat('Personale'))].sort((a, b) => a.localeCompare(b, 'it'));
  const sez = (t, righe) => righe.length ? `<h3>${t}</h3>${righe.map(([a, b, url, sotto]) => `<div class="coppia-r"><span>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(a)}</a>` : esc(a)}${sotto ? `<small>${esc(sotto)}</small>` : ''}</span><em>${esc(b)}</em></div>`).join('')}` : '';
  const giu = pag === 'progetti' ? radice.querySelector('.tab')?.scrollTop || 0 : 0;
  pagina('progetti', `${testa('Progetti', 'Per ognuno: dov’è il codice, dov’è online, dov’è il database.')}
    <div class="chips">${[['Tutti', vivi.length], ['Attivo', quanti('Attivo')], ['In pausa', quanti('In pausa')], ['Archiviato', quanti('Archiviato')]].map(([n, q]) => `<button class="pill ${n === f ? 'scura' : 'bianca'}" data-az="prog-f" data-f="${n}" aria-pressed="${n === f}">${n === 'Attivo' ? 'Attivi' : n === 'Archiviato' ? 'Archiviati' : n} <em>${q}</em></button>`).join('')}
      <span class="molla"></span>${[['GitHub', k.github], ['Vercel', k.vercel], ['Supabase', k.supabase]].map(([n, q]) => `<span class="fonte"><i class="p salute"></i>${n} <em>${q ?? '–'}</em></span>`).join('')}</div>
    <section class="carta righe tab"><div class="r capo"><span class="largo">Progetto</span><span class="c1">GitHub</span><span class="c2">Vercel</span><span class="c3">Supabase</span><span class="c4">Push</span></div>
      ${elenco.map((x, i) => `<button class="r ${x === sel ? 'sel' : ''}" data-az="prog-sel" data-nome="${esc(x.nome)}"><span class="largo"><b>${esc(x.nome)}</b>${x.contesto ? `<em>${esc(x.contesto)}${x.stato === 'In pausa' ? ' · in pausa' : ''}</em>` : `<em class="manca">senza contesto${x.stato === 'In pausa' ? ' · in pausa' : ''}</em>`}</span>
        <span class="c1">${esc(x.github[0]?.nome || (x.locale ? 'solo sul Mac' : '—'))}${x.github.length > 1 ? ` <em>+${x.github.length - 1}</em>` : ''}</span><span class="c2">${esc(x.vercel?.[0]?.url || x.locale || '—')}</span><span class="c3">${esc(x.supabase?.[0]?.nome || '—')}</span><span class="c4">${esc(x.push ? quando(x.push) : x.locale ? 'sul Mac' : '—')}</span></button>`).join('') || vuotoBello(f === 'Archiviato' ? 'Niente in archivio' : 'Nessun progetto qui', f === 'Archiviato' ? 'Per archiviare un progetto aprilo e scegli “Archiviato” dal menu accanto al nome. Su GitHub e Vercel non cambia nulla.' : 'Cambia filtro per vedere gli altri.')}</section>
    <p class="piccolo nota-pagina">${p.altri ? `Altri ${p.altri} repository non sono in elenco: backup e prove. ` : ''}I push arrivano da GitHub in diretta; Vercel e Supabase li aggiorna Claude (ultimo: ${esc(dataBreve(p.aggiornato))}).</p>`,
  sel ? `<div class="scheda-t"><h2 class="dx-titolo">${esc(sel.nome)}</h2><label class="pill stato ${sel.stato === 'Attivo' ? 'verde' : 'grigia'}"><span>${esc(sel.stato)}</span><svg viewBox="0 0 8 5" aria-hidden="true"><path d="M1 1l3 3 3-3"/></svg><select data-prog-stato="${esc(sel.nome)}" aria-label="Stato di ${esc(sel.nome)}">${['Attivo', 'In pausa', 'Archiviato'].map(s => `<option ${s === sel.stato ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div><p class="testo">${esc(sel.descrizione || sel.github.find(g => g.descrizione)?.descrizione || 'Nessuna descrizione.')}</p>
    <label class="campo-riga"><span>Contesto</span><select class="pill scelta bianca" data-prog="${esc(sel.nome)}" aria-label="Contesto di ${esc(sel.nome)}"><option value="">da scegliere</option>${nomi.map(n => `<option ${n === sel.contesto ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><span class="errore" id="msg" role="status"></span></label>
    <div class="dettaglio">${sez('GitHub', sel.github.map(g => [g.nome, [g.privato ? 'privato' : g.privato === false ? 'pubblico' : '', g.push ? 'push ' + quando(g.push) : ''].filter(Boolean).join(' · '), `https://github.com/${p.githubUtente || ''}/${g.nome}`, g.descrizione]))}${sez('Vercel', (sel.vercel || []).map(v => [v.url, v.nome, 'https://' + v.url]))}${sel.locale ? sez('Sul Mac', [[sel.locale, 'solo su questo computer', 'http://' + sel.locale, sel.cartella || '']]) : ''}${!sel.github.length && !sel.locale ? '<p class="piccolo" style="margin-top:14px">Nessun repository collegato.</p>' : ''}${!(sel.vercel || []).length && !sel.locale ? '<h3>Vercel</h3><p class="piccolo">Non è online.</p>' : ''}
    ${sez('Supabase', (sel.supabase || []).map(s => [s.nome, [s.regione, s.stato].filter(Boolean).join(' · ')]))}${sez('Spese collegate', sel.spese.map(s => [s.nome, `€ ${eur(s.importo)} al mese`]))}</div>` : '', true);
  if (giu && radice.querySelector('.tab')) radice.querySelector('.tab').scrollTop = giu;
}

// ---------- soldi ----------
async function soldi() {
  const s = await api('/api/soldi');
  if (!s.aggiornato) return pagina('soldi', `${testa('Entrate e uscite', 'Ancora nessun dato. Claude li legge dal tuo foglio al prossimo giro del pianificatore.')}`);
  const liq = Object.entries(s.liquidita || {}).map(([k, v]) => `${k} ${eur(v)}`).join(' · '); const giorno = new Date().getDate();
  const tutte = (s.categorie || []).filter(c => c[1] > 0).sort((a, b) => b[1] - a[1]); const cat = tutte.length > 6 ? tutte.slice(0, 5).concat([['Altre ' + (tutte.length - 5), tutte.slice(5).reduce((n, c) => n + c[1], 0)]]) : tutte; const maxC = Math.max(1, ...cat.map(c => c[1])); const maxA = Math.max(1, ...(s.andamento || []).flatMap(a => [a[1], a[2]]));
  const num = (t, v, sotto) => `<div class="carta numero"><span>${t}</span><b>€ ${eur(v)}</b><em>${esc(sotto)}</em></div>`;
  pagina('soldi', `${testa('Entrate e uscite', `Dal foglio ${s.foglioNome || ''}, aggiornato al ${dataBreve(s.aggiornato)}. Qui si legge soltanto.`, s.foglio ? `<div class="lato-t"><a class="pill bianca" href="${esc(s.foglio)}" target="_blank" rel="noopener">Apri il foglio</a></div>` : '')}
    <div class="numeri">${num('Disponibile', s.disponibile, 'liquidità meno le spese fisse ancora da pagare')}${num('Liquidità', s.liquiditaTotale, liq)}${num(`Entrate di ${s.meseNome || 'questo mese'}`, s.mese.entrate, '')}${num(`Uscite di ${s.meseNome || 'questo mese'}`, s.mese.uscite, `saldo del mese ${s.mese.saldo < 0 ? '−' : '+'} ${eur(Math.abs(s.mese.saldo))}`)}</div>
    <div class="due"><div class="pila">
      ${scheda('Spese fisse del mese', `${eur(s.fisseTotale)} · restano ${eur(s.fisseResiduo)}`, `<div class="righe piatte">${(s.fisse || []).map(f => `<div class="r"><span class="nome-f">${esc(f.nome.replace(/\s*\(abbonamento\)/i, ''))}</span><span class="largo tenue">giorno ${f.giorno}${!f.pagata && f.giorno >= giorno ? ` · tra ${f.giorno - giorno} giorni` : ''}</span>${pillola(f.pagata ? 'Pagata' : 'Da pagare', f.pagata ? 'verde' : 'grigia')}<span class="imp">€ ${eur(f.importo)}</span></div>`).join('')}</div>`)}
      ${scheda('Ultimi movimenti', '<a class="link" href="#movimenti">Vedi tutti</a>', `<div class="righe piatte" id="mov-corti">${(s.movimenti || []).slice(0, 14).map(m => `<div class="r"><span class="quando">${esc(dataBreve(m[0]))}</span><span class="largo">${esc(m[4])}</span><span class="cat">${esc(m[3])}</span><span class="imp ${m[2] === 'Entrata' ? 'piu' : ''}">${m[2] === 'Entrata' ? '+' : '−'} ${eur(m[5])}</span></div>`).join('')}</div>`, 'cresce')}</div>
    <div class="pila stretta">
      ${scheda('Uscite per categoria', s.meseNome || '', cat.map(c => `<div class="barra-area"><span class="largo-f">${esc(c[0])}</span>${riga('', 100 * c[1] / maxC)}<em>${eur(c[1])}</em></div>`).join(''))}
      ${scheda('Andamento', 'entrate e uscite', `<div class="andamento">${(s.andamento || []).map(a => `<div><div class="colonnine" title="${esc(a[0])}: entrate ${eur(a[1])}, uscite ${eur(a[2])}"><i class="e" style="height:${100 * a[1] / maxA}%"></i><i class="u" style="height:${100 * a[2] / maxA}%"></i></div><span>${esc(a[0])}</span></div>`).join('')}</div><p class="legenda-a"><i class="p salute"></i>entrate <i class="p nero"></i>uscite</p>`, 'cresce')}</div></div>`);
  adattaSoldi();
}
// Nella scheda entrano solo le righe intere che ci stanno: niente riga tagliata, niente sfumatura.
// Elenchi lunghi: niente scorrimento interno. Si mostrano le righe che entrano fino a "fine"
// (in Giornate: il fondo della colonna di destra), poi "Mostra altre". Sul telefono le prime 6.
function adattaElenco(lista, fine, chiave) {
  if (!lista) return;
  const righe = [...lista.children].filter(r => r.classList.contains('r')); righe.forEach(r => { r.hidden = false; });
  let piede = lista.querySelector(':scope > .mostra-altre');
  if (!piede) { piede = document.createElement('button'); piede.className = 'mostra-altre'; piede.dataset.az = 'mostra-altre'; piede.dataset.k = chiave; lista.append(piede); }
  lista.style.minHeight = '';
  if ((V.tutte || {})[chiave]) { piede.hidden = righe.length <= 6; piede.textContent = 'Mostra meno'; return; }
  let n = righe.length; const alto = 44;
  if (innerWidth < 1180 || !fine) n = Math.min(6, righe.length);
  else { const fondo = r => r.getBoundingClientRect().bottom; while (n > 3 && fondo(righe[n - 1]) + (n < righe.length ? alto : 0) > fine) n--; }
  righe.forEach((r, i) => { r.hidden = i >= n; });
  piede.hidden = n >= righe.length; piede.textContent = `Mostra altre (${righe.length - n})`;
  // In Giornate la card finisce alla stessa altezza della colonna di destra.
  if (lista.dataset.allinea && fine && innerWidth >= 1180) { const top = lista.getBoundingClientRect().top; if (fine - top > lista.offsetHeight) lista.style.minHeight = `${Math.floor(fine - top)}px`; }
}
function adattaElenchi() {
  if (pag === 'giornate') {
    // Le due colonne arrivano fino in fondo allo schermo: l'elenco si riempie di righe, si allunga la card delle quattro aree
    // ("In linea" resta corta).
    const dx = radice.querySelector('.gg-dx'), c = radice.querySelector('.centro'); if (!dx || !c) return;
    const aree = dx.querySelector('.gg-aree'), ultima = dx.lastElementChild; if (aree) { aree.style.minHeight = ''; aree.classList.remove('compatta'); }
    ultima.classList.add('intera'); // "In linea" per intero se c'è posto, altrimenti 3 righe
    let fine = ultima.getBoundingClientRect().bottom;
    if (innerWidth >= 1180 && aree) { const fondo = Math.floor(c.getBoundingClientRect().bottom - parseFloat(getComputedStyle(c).paddingBottom)) - 2; if (fine > fondo) { aree.classList.add('compatta'); fine = ultima.getBoundingClientRect().bottom; } if (fine > fondo) { ultima.classList.remove('intera'); fine = ultima.getBoundingClientRect().bottom; } if (fondo > fine) { aree.style.minHeight = `${Math.floor(aree.offsetHeight + fondo - fine)}px`; fine = fondo; } }
    adattaElenco(radice.querySelector('.giorni'), fine, 'giornate');
  }
  if (pag === 'call') { const c = radice.querySelector('.centro'), nota = c?.querySelector('.nota-pagina'); adattaElenco(radice.querySelector('.call-lista'), c ? c.getBoundingClientRect().bottom - parseFloat(getComputedStyle(c).paddingBottom) - (nota ? nota.offsetHeight + 14 : 0) : 0, 'call-' + (V.callTab || 'd')); }
}
function adattaSoldi() {
  const box = document.getElementById('mov-corti'); if (!box) return; const righe = [...box.children]; righe.forEach(r => { r.hidden = false; });
  const scheda = box.closest('.scheda'); if (getComputedStyle(scheda).overflow !== 'hidden') { box.style.removeProperty('--riga'); return righe.forEach((r, i) => { r.hidden = i >= 8; }); }
  // Quante righe da almeno 32 px ci stanno; poi si allargano un filo per riempire la scheda fino in fondo, senza vuoto sotto.
  const posto = scheda.getBoundingClientRect().bottom - 8 - box.getBoundingClientRect().top; const n = Math.max(1, Math.min(righe.length, Math.floor(posto / 32)));
  righe.forEach((r, i) => { r.hidden = i >= n; }); box.style.setProperty('--riga', Math.min(44, posto / n) + 'px');
}
async function movimenti() {
  const s = await api('/api/soldi'); const f = V.movF || 'Tutti'; const tutti = s.movimenti || []; const l = f === 'Tutti' ? tutti : tutti.filter(m => m[2] === f);
  const somma = k => tutti.filter(m => m[2] === k).reduce((n, m) => n + Number(m[5] || 0), 0);
  pagina('soldi', `${testa('Movimenti', `Gli ultimi ${tutti.length} dal foglio ${s.foglioNome || ''}, senza i giri tra i tuoi conti.`, `<div class="lato-t"><a class="pill bianca" href="#soldi">‹ Entrate e uscite</a>${s.foglio ? `<a class="pill bianca" href="${esc(s.foglio)}" target="_blank" rel="noopener">Apri il foglio</a>` : ''}</div>`)}
    <div class="chips">${[['Tutti', tutti.length], ['Entrata', tutti.filter(m => m[2] === 'Entrata').length], ['Uscita', tutti.filter(m => m[2] === 'Uscita').length]].map(([n, q]) => `<button class="pill ${n === f ? 'scura' : 'bianca'}" data-az="mov" data-f="${n}" aria-pressed="${n === f}">${n === 'Entrata' ? 'Entrate' : n === 'Uscita' ? 'Uscite' : n} <em>${q}</em></button>`).join('')}<span class="piccolo">entrate ${eur(somma('Entrata'))} · uscite ${eur(somma('Uscita'))}</span></div>
    <section class="carta righe tab-mov"><div class="r capo"><span class="quando">Data</span><span class="largo">Cosa</span><span class="cat">Categoria</span><span class="cat">Conto</span><span class="imp">Importo</span></div>
      ${l.map(m => `<div class="r"><span class="quando">${esc(dataBreve(m[0]))}</span><span class="largo">${esc(m[4])}</span><span class="cat">${esc(m[3])}</span><span class="cat">${esc(m[1])}</span><span class="imp ${m[2] === 'Entrata' ? 'piu' : ''}">${m[2] === 'Entrata' ? '+' : '−'} ${eur(m[5])}</span></div>`).join('') || '<p class="piccolo vuota">Nessun movimento.</p>'}</section>
    <p class="piccolo nota-pagina">Per quelli più vecchi apri il foglio. Qui si legge soltanto.</p>`);
  radice.querySelector('.centro').className = 'centro p-movimenti';   // stessa voce della barra di Entrate e uscite, ma regole sue
}

// ---------- impostazioni ----------
// Loghi dei servizi per la pagina Impostazioni: originali. Obsidian, GitHub, Vercel e Supabase da Simple Icons (CC0),
// Google Calendar e Sheets da Wikimedia Commons, Fathom dal suo sito, OpenAI (per Whisper) da Simple Icons.
const LOGHI = {"obsidian": "<svg fill=\"#7C3AED\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z\"/></svg>", "gcal": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 200 200\"> <g> <g transform=\"translate(3.75 3.75)\"> <path fill=\"#FFFFFF\" d=\"M148.882,43.618l-47.368-5.263l-57.895,5.263L38.355,96.25l5.263,52.632l52.632,6.579l52.632-6.579 l5.263-53.947L148.882,43.618z\"/> <path fill=\"#1A73E8\" d=\"M65.211,125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c0.829,3.158,2.276,5.605,4.342,7.342 c2.053,1.737,4.553,2.592,7.474,2.592c2.987,0,5.553-0.908,7.697-2.724s3.224-4.132,3.224-6.934c0-2.868-1.132-5.211-3.395-7.026 s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921,0,5.382-0.789,7.382-2.368c2-1.579,3-3.737,3-6.487 c0-2.447-0.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684,0-4.816,0.711-6.395,2.145s-2.724,3.197-3.447,5.276 l-9.039-3.763c1.197-3.395,3.395-6.395,6.618-8.987c3.224-2.592,7.342-3.895,12.342-3.895c3.697,0,7.026,0.711,9.974,2.145 c2.947,1.434,5.263,3.421,6.934,5.947c1.671,2.539,2.5,5.382,2.5,8.539c0,3.224-0.776,5.947-2.329,8.184 c-1.553,2.237-3.461,3.947-5.724,5.145v0.539c2.987,1.25,5.421,3.158,7.342,5.724c1.908,2.566,2.868,5.632,2.868,9.211 s-0.908,6.776-2.724,9.579c-1.816,2.803-4.329,5.013-7.513,6.618c-3.197,1.605-6.789,2.421-10.776,2.421 C73.408,129.263,69.145,127.934,65.211,125.276z\"/> <path fill=\"#1A73E8\" d=\"M121.25,79.961l-9.974,7.25l-5.013-7.605l17.987-12.974h6.895v61.197h-9.895L121.25,79.961z\"/> <path fill=\"#EA4335\" d=\"M148.882,196.25l47.368-47.368l-23.684-10.526l-23.684,10.526l-10.526,23.684L148.882,196.25z\"/> <path fill=\"#34A853\" d=\"M33.092,172.566l10.526,23.684h105.263v-47.368H43.618L33.092,172.566z\"/> <path fill=\"#4285F4\" d=\"M12.039-3.75C3.316-3.75-3.75,3.316-3.75,12.039v136.842l23.684,10.526l23.684-10.526V43.618h105.263 l10.526-23.684L148.882-3.75H12.039z\"/> <path fill=\"#188038\" d=\"M-3.75,148.882v31.579c0,8.724,7.066,15.789,15.789,15.789h31.579v-47.368H-3.75z\"/> <path fill=\"#FBBC04\" d=\"M148.882,43.618v105.263h47.368V43.618l-23.684-10.526L148.882,43.618z\"/> <path fill=\"#1967D2\" d=\"M196.25,43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z\"/> </g> </g> </svg>", "gsheets": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 88\"> <path d=\"M 42,0 64,22 53,24 42,22 40,11 Z\" fill=\"#188038\" /> <path d=\"M 42,22 V 0 H 6 C 2.685,0 0,2.685 0,6 v 76 c 0,3.315 2.685,6 6,6 h 52 c 3.315,0 6,-2.685 6,-6 V 22 Z\" fill=\"#34a853\" /> <path d=\"M 12,34 V 63 H 52 V 34 Z M 29.5,58 H 17 v -7 h 12.5 z m 0,-12 H 17 V 39 H 29.5 Z M 47,58 H 34.5 V 51 H 47 Z M 47,46 H 34.5 V 39 H 47 Z\" fill=\"#fff\" /> </svg>", "github": "<svg fill=\"#181717\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12\"/></svg>", "vercel": "<svg fill=\"#000000\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M24 22.525H0l12-21.05 12 21.05z\"/></svg>", "supabase": "<svg fill=\"#3FCF8E\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z\"/></svg>", "microfono": "<svg viewBox=\"0 0 48 48\"><circle cx=\"24\" cy=\"24\" r=\"21\" fill=\"#1f1d1a\"/><rect x=\"19\" y=\"11\" width=\"10\" height=\"17\" rx=\"5\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.4\"/><path d=\"M14 23a10 10 0 0 0 20 0M24 33v5\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><circle cx=\"35\" cy=\"13\" r=\"3\" fill=\"#d9534a\"/></svg>", "fathom": "<svg viewBox=\"0 0 151 153\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M0.921341 102.282V133.75C0.921341 142.004 6.05756 149.478 13.7776 151.959C26.8963 156.161 38.9436 146.302 38.9436 133.578V121.731L0.921341 102.282Z\" fill=\"#007299\"/> <path d=\"M131.888 95.7704C129.031 95.7704 126.132 95.1181 123.402 93.7281L11.8239 36.9625C2.58091 32.2579 -1.71496 20.9347 2.59143 11.3757C7.08689 1.36768 18.7877 -2.78095 28.3773 2.09476L139.934 58.8497C149.292 63.6078 153.578 75.5298 148.893 85.0566C145.564 91.8463 138.852 95.7704 131.867 95.7704H131.888Z\" fill=\"#00BEFF\"/> <path d=\"M75.8841 124.447C73.0272 124.447 70.1283 123.795 67.3974 122.405L11.8239 94.1344C2.58091 89.4298 -1.71496 78.1066 2.59143 68.5477C7.08689 58.5396 18.7877 54.391 28.3878 59.2667L83.9403 87.5266C93.2988 92.2847 97.5841 104.207 92.8996 113.733C89.57 120.523 82.8584 124.447 75.8736 124.447H75.8841Z\" fill=\"#00BEFF\"/> </svg>", "openai": "<svg fill=\"#000000\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"/></svg>"};
async function impostazioni() {
  const i = await api('/api/impostazioni');
  // Un clic su una tessera la apre: due righe su cosa fa quel servizio in Bussola.
  const COSA = { obsidian: 'Il taccuino: Bussola legge e scrive qui giornate, obiettivi, lezioni e contesti.', gcal: 'Porta in Bussola lezioni, call ed eventi. Il tuo calendario si aggiorna ogni minuto.', gsheets: 'Il foglio dei soldi: entrate, uscite e spese fisse, riletto da Claude ogni due ore.', fathom: 'Registra le call. Claude ne legge riassunti e cose da fare per la pagina Call.', github: 'Dove sta il codice dei progetti. Bussola mostra gli ultimi push in diretta.', vercel: 'Dove sono online i siti dei progetti, con i loro indirizzi.', supabase: 'I database dei progetti, con regione e stato.', openai: 'Trasforma i vocali in testo sul Mac. L\'audio non esce mai dal computer.' };
  const t = (logo, nome, ok, testo) => `<button class="carta imp-t ${ok ? '' : 'spento'} ${(V.impSu || []).includes(logo) ? 'su' : ''}" data-az="imp-t" data-k="${logo}" title="${esc(testo)}" aria-expanded="${(V.impSu || []).includes(logo)}"><span class="imp-logo">${LOGHI[logo]}</span><b>${nome}</b>${pillola(ok ? 'Collegato' : 'Da collegare', ok ? 'verde' : 'grigia')}${ok ? '' : `<p class="piccolo">${esc(testo)}</p>`}<span class="imp-cosa"><b>${nome}</b><span>${esc(COSA[logo] || testo)}</span></span></button>`;
  const cal = i.ical.letti > 0 ? 'Il tuo calendario è letto in diretta, ogni minuto. Gli altri calendari li legge Claude ogni due ore.' : i.calendario ? `Dal tuo account Google, tramite Claude. Ultima lettura: ${i.calendario}. Calendari: ${i.calendari.join(', ')}.` : 'Nessun calendario letto.';
  const fat = i.fathom.collegato ? (i.fathom.fonte === 'connettore' ? `${i.fathom.quante} registrazioni, lette da Claude dal tuo account Fathom. Ultima lettura: ${i.fathom.aggiornato}.` : `${i.fathom.quante} registrazioni negli ultimi tre mesi. Riletto ogni 10 minuti, in sola lettura.`) : (i.fathom.errore || 'Manca la chiave. In Fathom: Settings, poi API Access, poi Generate API key. Incollala in config.local.json alla voce "fathomApiKey", tra le virgolette.');
  // Tessere di serie, con lo stato letto dal server.
  const SERIE = {
    obsidian: ['Obsidian', true, `Il taccuino: ${i.vault}`],
    gcal: ['Google Calendar', i.ical.letti > 0 || !!i.calendario, cal],
    gsheets: ['Google Sheets', !!i.soldi, i.soldi ? `Il foglio dei soldi, letto da Claude il ${dataBreve(i.soldi)}.` : 'Foglio non ancora letto.'],
    fathom: ['Fathom', i.fathom.collegato, fat],
    github: ['GitHub', !!i.github, i.github ? 'Repository e push letti in diretta dal computer.' : 'GitHub non trovato sul computer.'],
    vercel: ['Vercel', !!i.progetti, i.progetti ? `Siti online, letti da Claude il ${dataBreve(i.progetti)}.` : 'Non ancora letto.'],
    supabase: ['Supabase', !!i.progetti, i.progetti ? `Database, letti da Claude il ${dataBreve(i.progetti)}.` : 'Non ancora letto.'],
    openai: ['Whisper', i.trascrizione, i.trascrizione ? 'Trascrive i vocali sul Mac (modello Whisper di OpenAI, versione mlx). Nessun audio esce dal computer.' : 'Serve un Mac con chip Apple, con uv e ffmpeg installati.'],
  };
  // Gli strumenti della persona: "strumenti" in config.local.json, scelti nell'onboarding. Senza, le tessere di serie.
  // { "id", "nome", "logo" (file in public/loghi/), "cosa" (a cosa serve per lei), "come" (come è collegato), "collegato" }
  const tessera = x => {
    const id = String(x.id || x.nome || '').toLowerCase(); const base = SERIE[id];
    if (base && !x.logo) { if (x.cosa) COSA[id] = x.cosa; return t(id, x.nome || base[0], base[1], x.come || base[2]); }
    const logo = x.logo ? `<img src="${esc(x.logo)}" alt="">` : `<span class="imp-lettera">${esc((x.nome || '?').charAt(0).toUpperCase())}</span>`;
    const ok = x.collegato !== false, nome = esc(x.nome || id), testo = x.come || (ok ? 'Collegato a Claude.' : 'Da collegare: chiedi a Claude.'), su = (V.impSu || []).includes(id);
    return `<button class="carta imp-t ${ok ? '' : 'spento'} ${su ? 'su' : ''}" data-az="imp-t" data-k="${esc(id)}" title="${esc(testo)}" aria-expanded="${su}"><span class="imp-logo">${logo}</span><b>${nome}</b>${pillola(ok ? 'Collegato' : 'Da collegare', ok ? 'verde' : 'grigia')}${ok ? '' : `<p class="piccolo">${esc(testo)}</p>`}<span class="imp-cosa"><b>${nome}</b><span>${esc(x.cosa || testo)}</span></span></button>`;
  };
  const mie = Array.isArray(i.strumenti) && i.strumenti.length ? i.strumenti : null;
  const elenco = mie ? (mie.some(x => String(x.id || '').toLowerCase() === 'obsidian') ? mie : [{ id: 'obsidian' }, ...mie]) : Object.keys(SERIE).map(id => ({ id }));
  pagina('impostazioni', `${testa('Impostazioni', 'Gli strumenti collegati a Bussola. Clicca un logo per sapere cosa fa.')}
    <div class="imp-g">${elenco.map(tessera).join('')}</div>
    <p class="piccolo nota-pagina">${mie ? 'Gli strumenti li sceglie e li collega Claude con te. Per aggiungerne uno, chiediglielo.' : 'Calendario, soldi, Vercel e Supabase li rilegge Claude a ogni giro del pianificatore, ogni due ore a computer acceso e app Claude aperta.'}</p>`);
}

// ---------- primo accesso e controllo del mese ----------
const righeOb = lista => { const l = (lista || []).map(o => ({ ...o })); while (l.length < 3) l.push({ testo: '', area: null }); return l; };
function editor(k) {
  return bozza.obiettivi[k].map((o, i) => `<div class="riga-ob"><input class="campo" type="text" data-ob="${k}" data-i="${i}" value="${esc(o.testo)}" aria-label="Obiettivo ${i + 1}" maxlength="160" autocomplete="off">
    <div class="scelta-area" role="group" aria-label="Area dell'obiettivo ${i + 1}">${AREE.map(a => `<button type="button" data-az="area" data-ob="${k}" data-i="${i}" data-area="${a}" aria-pressed="${o.area === a}" aria-label="${a}" title="${a}"><i class="p ${a}"></i></button>`).join('')}</div></div>`).join('');
}
function inizio(dove) {
  V.inizio = dove || V.inizio || 'oggi';
  bozza ||= { passo: 0, lavoro: '', vita: '', aree: {}, obiettivi: { due_anni: righeOb(), sei_mesi: righeOb(), mese: righeOb() } };
  const p = bozza.passo; let dentro;
  if (p === 0) dentro = `<div class="domanda"><label for="b-lavoro">Perché lavori?</label><p class="aiuto">Non il lavoro che vuoi: a cosa serve, per te, lavorare.</p><textarea id="b-lavoro" data-b="lavoro" rows="3">${esc(bozza.lavoro)}</textarea></div>
      <div class="domanda"><label for="b-vita">Cosa conta davvero nella tua vita?</label><p class="aiuto">Cosa le dà senso. Scrivi come parli.</p><textarea id="b-vita" data-b="vita" rows="3">${esc(bozza.vita)}</textarea></div>
      <div class="domanda"><p class="etichetta">Come va adesso?</p><p class="aiuto">Da 1 a 5. Solo tu sai cosa è abbastanza.</p>${AREE.map(a => `<div class="area-voto"><span class="nome">${punto(a)}${maiuscola(a)}</span><div class="voti" role="group" aria-label="${a}, da 1 a 5">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-az="area-voto" data-area="${a}" data-n="${n}" aria-pressed="${bozza.aree[a] === n}" aria-label="${n} su 5">${n}</button>`).join('')}</div></div>`).join('')}</div>`;
  else { const [k, t, aiuto] = ORIZZONTI[p - 1]; dentro = `<div class="domanda"><p class="etichetta">${t}</p><p class="aiuto">${aiuto} Il puntino a destra dice a quale area appartiene: lavoro, gioco, amore, salute.</p>${editor(k)}</div>`; }
  const titoli = ['Allineiamo la bussola', 'Tra due anni', 'Tra sei mesi', 'Questo mese'];
  pagina(V.inizio, `<div class="stretto"><p class="piccolo">Primo accesso · passo ${p + 1} di 4</p>${testa(titoli[p], p === 0 ? 'Tre domande, poi gli obiettivi. Cinque minuti.' : 'Massimo tre. Si possono cambiare ogni mese.')}
  ${dentro}<div class="azioni"><button class="btn ${p > 0 ? 'chiaro' : 'nascosto'}" data-az="indietro">Indietro</button><button class="btn" data-az="avanti">${p === 3 ? 'Ho finito' : 'Avanti'}</button><span class="errore" id="msg" role="status"></span></div></div>`);
}
async function mese() {
  if (!bozza?.mensile) { const p = await api('/api/piano'); bozza = { mensile: true, nota: '', obiettivi: Object.fromEntries(ORIZZONTI.map(([k]) => [k, righeOb(p.obiettivi?.[k])])) }; }
  pagina('obiettivi', `<div class="stretto">${testa('Controllo del mese', 'Sono ancora questi? Cambia quello che non è più vero.')}
  ${ORIZZONTI.map(([k, t]) => `<div class="domanda"><p class="etichetta">${t}</p><div style="margin-top:10px">${editor(k)}</div></div>`).join('')}
  <div class="domanda"><label for="nota">È cambiato qualcosa di grosso?</label><p class="aiuto">Se no, lascia vuoto.</p><textarea id="nota" data-b="nota" rows="2">${esc(bozza.nota)}</textarea></div>
  <div class="azioni"><button class="btn" data-az="conferma-mese">Confermo</button><span class="piccolo">Claude ricalcola settimana e da fare.</span><span class="errore" id="msg" role="status"></span></div></div>`);
}

// ---------- azioni ----------
let attesaSera;
async function salvaSera(valore) {
  if (!S?.oggi || valore.trim() === (S.oggi.sera || '')) return;
  try { S.oggi = await api('/api/sera', { perche: valore }); const s = document.getElementById('salvato'); if (s) s.textContent = 'Salvato nel taccuino.'; } catch { /* resta nel campo, si riprova al prossimo tasto */ }
}
const dice = t => { const m = document.getElementById('msg') || document.getElementById('salvato'); if (m) m.textContent = t; return !!m; };
radice.addEventListener('click', async e => {
  const b = e.target.closest('button[data-az]'); if (!b) return; const az = b.dataset.az, d = b.dataset;
  try {
    if (az === 'spunta') { S.oggi = await api('/api/todo/spunta', { i: +d.i }); oggi(); }
    else if (az === 'togli') { S.oggi = await api('/api/todo/togli', { i: +d.i }); oggi(); }
    else if (az === 'cambi-ok') { await api('/api/cambi/visti', {}); S = await api('/api/stato'); oggi(); }
    else if (az === 'prop-si') { S.oggi = await api('/api/proposte/accetta', { i: +d.i }); oggi(); }
    else if (az === 'prop-no') { S.oggi = await api('/api/proposte/scarta', { i: +d.i }); oggi(); }
    else if (az === 'ag-prima') { V.agPrima = !V.agPrima; oggi(); }
    else if (az === 'imp-t') { const l = V.impSu || []; V.impSu = l.includes(d.k) ? l.filter(x => x !== d.k) : [...l, d.k]; b.classList.toggle('su'); b.setAttribute('aria-expanded', b.classList.contains('su')); }
    else if (az === 'mostra-altre') { V.tutte = { ...(V.tutte || {}), [d.k]: !(V.tutte || {})[d.k] }; adattaElenchi(); }
    else if (az === 'call-tab') { V.callTab = d.t; call(); }
    else if (az === 'rm-apri') { V.rmAperta = !V.rmAperta; obiettivi(); }
    else if (az === 'lt-idx') { const lt = radice.querySelector('.lt'); if (innerWidth > 900) { V.idxNo = !V.idxNo; lt?.classList.toggle('idx-no', V.idxNo); b.setAttribute('aria-pressed', !V.idxNo); ridisegnaPdf(); } else { V.idxSu = !V.idxSu; lt?.classList.toggle('idx-su', V.idxSu); b.setAttribute('aria-pressed', V.idxSu); } }
    else if (az === 'lz-apri') { const x = cercaUltimi[+d.i]; if (!x) return; V.lzCerca = '';
      if (x.tipo === 'corso') { V.corsoId = x.corso; V.corsoPag = x.pagina; V.segnaOn = false; location.hash = '#corso'; }
      else if (x.tipo === 'mappa') { V.lzMappa = true; await lezioni(); }
      else { V.lzTab = 'tue'; V.lzTutte = true; V.lzApri = x.titolo; await lezioni(); } }
    else if (az === 'pdf-zoom') { const sc = radice.querySelector('.lt-scorri'), q = sc.scrollTop / (sc.scrollHeight || 1); const z = ZOOM[Math.min(ZOOM.length - 1, Math.max(0, ZOOM.indexOf(zoomPdf()) + +d.d))]; try { localStorage.setItem('bussola:zoomPdf', z); } catch { /* resta per questa volta */ } radice.querySelector('.pdf-pagine').style.setProperty('--z', z); radice.querySelector('.lt-zoom span').textContent = Math.round(z * 100) + '%'; sc.scrollTop = q * sc.scrollHeight; ridisegnaPdf(); }
    else if (az === 'cr-segna') { V.segnaOn = !V.segnaOn; await corso(V.corsoDati); }
    else if (az === 'cr-togli') { const r = await api('/api/corso/segnalibro', { id: V.corsoId, togli: true }); V.corsoDati.segnalibro = r.segnalibro; await corso(V.corsoDati); }
    else if (az === 'cr-vai-chiudi') { V.segnaVisto = true; radice.querySelector('.cr-vai')?.remove(); }
    else if (az === 'lz-tab') { V.lzTab = d.t; V.lzTutte = false; lezioni(); }
    else if (az === 'lz-tutte') { V.lzTutte = !V.lzTutte; lezioni(); }
    else if (az === 'lz') await lezioni(await api('/api/lezioni/scegli', { id: d.id, scelta: d.s, lezione: d.l }));
    else if (az === 'lz-annulla') await lezioni(await api('/api/lezioni/annulla', { id: d.id }));
    else if (az === 'we') { V.weApri = null; await weekend(await api('/api/weekend/risposta', { titolo: d.t, stato: d.s })); }
    else if (az === 'we-apri') { V.weApri = d.t; await weekend(V.weDati); }
    else if (az === 'we-chiudi') { V.weApri = null; await weekend(V.weDati); }
    else if (az === 'fatte') { V.fatteAperte = !V.fatteAperte; oggi(); }
    else if (az === 'nuova') { nuovaAperta = true; oggi(); radice.querySelector('.nuova input').focus(); }
    else if (az === 'rito') { ritoAperto = true; oggi(); document.querySelector('.rito')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    else if (az === 'rito-fine') { clearTimeout(attesaSera); await salvaSera(document.getElementById('perche').value); ritoAperto = false; oggi(); }
    else if (az === 'voto') { const testo = document.getElementById('perche')?.value ?? S.oggi.sera; S.oggi = await api('/api/sera', { voto: +d.n, perche: testo }); oggi(); }
    else if (az === 'apri-nota') { const su = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', su); }
    else if (az === 'cal') { V.calMese = d.m || null; await calendario(); }
    else if (az === 'giorno') apriGiorno(b);
    else if (az === 'mov') { V.movF = d.f; await movimenti(); }
    else if (az === 'lista-apri') { V.listaNuova = true; await liste(V.liste); radice.querySelector('.chip-form input').focus(); }
    else if (az === 'lista-spunta') await liste(await api('/api/liste/spunta', { nome: d.nome, i: +d.i }));
    else if (az === 'lista-togli') await liste(await api('/api/liste/togli', { nome: d.nome, i: +d.i }));
    else if (az === 'lista-oggi') { const l = await api('/api/liste/oggi', { nome: d.nome, i: +d.i }); S = await api('/api/stato'); await liste(l); }
    else if (az === 'lista-rapida') await liste(await api('/api/liste/nuova', { nome: d.nome }));
    else if (az === 'ctx') { V.ctx = d.f; await contesti(); }
    else if (az === 'prog-f') { V.progF = d.f; await progetti(); }
    else if (az === 'call-sel') { V.callSel = +d.i; V.callTipo = 'd'; await call(); }
    else if (az === 'fathom-sel') { V.fathomSel = d.id; V.callTipo = 'f'; await call(); }
    else if (az === 'prog-sel') { V.progNome = d.nome; await progetti(); }
    else if (az === 'rec') await registra(d.tipo);
    else if (az === 'riprova') await vocali(await api('/api/vocali/riprova', { id: d.id }));
    else if (az === 'area') { const o = bozza.obiettivi[d.ob][+d.i]; o.area = o.area === d.area ? null : d.area; bozza.mensile ? mese() : inizio(); }
    else if (az === 'area-voto') { bozza.aree[d.area] = +d.n; inizio(); }
    else if (az === 'indietro') { bozza.passo--; inizio(); }
    else if (az === 'avanti') {
      if (bozza.passo === 0 && (!bozza.lavoro.trim() || !bozza.vita.trim())) return dice('Scrivi almeno una riga per ognuna delle due domande.');
      if (bozza.passo > 0 && !bozza.obiettivi[ORIZZONTI[bozza.passo - 1][0]].some(o => o.testo.trim())) return dice('Scrivi almeno un obiettivo.');
      if (bozza.passo < 3) { bozza.passo++; inizio(); radice.querySelector('.centro').scrollTop = 0; }
      else { S = await api('/api/inizio', bozza); bozza = null; history.replaceState(null, '', '#oggi'); salto = true; oggi(); }
    }
    else if (az === 'conferma-mese') { S = await api('/api/check-mensile', { obiettivi: bozza.obiettivi, nota: bozza.nota }); bozza = null; location.hash = 'obiettivi'; }
  } catch (err) { if (!dice(err.message)) errore(err); }
});
radice.addEventListener('submit', async e => {
  e.preventDefault(); const form = e.target, az = form.dataset.az;
  try {
    if (az === 'lz-cerca') { clearTimeout(cercaAttesa); await mostraRicerca(form.q.value); return; }
    if (az === 'aggiungi') { const testo = form.testo.value.trim(); if (!testo) return; S.oggi = await api('/api/todo/aggiungi', { testo }); oggi(); radice.querySelector('.nuova input')?.focus(); }
    else if (az === 'lista-nuova') { const nome = form.nome.value.trim(); if (!nome) { V.listaNuova = false; return liste(V.liste); } const l = await api('/api/liste/nuova', { nome }); V.listaNuova = false; await liste(l); }
    else if (az === 'lista-aggiungi') { const testo = form.testo.value.trim(); if (!testo) return; const nome = form.dataset.nome; await liste(await api('/api/liste/aggiungi', { nome, testo })); [...radice.querySelectorAll('form[data-az="lista-aggiungi"]')].find(f => f.dataset.nome === nome)?.testo.focus(); }
  } catch (err) { if (!dice(err.message)) errore(err); }
});
radice.addEventListener('input', e => {
  if (e.target.closest('.lz-cerca')) { clearTimeout(cercaAttesa); const q = e.target.value; cercaAttesa = setTimeout(() => mostraRicerca(q), q.trim().length < 2 ? 0 : 280); return; }
  const t = e.target;
  if (t.dataset.az === 'perche') { clearTimeout(attesaSera); attesaSera = setTimeout(() => salvaSera(t.value), 700); return; }
  if (!bozza) return;
  if (t.dataset.b) bozza[t.dataset.b] = t.value; else if (t.dataset.ob) bozza.obiettivi[t.dataset.ob][+t.dataset.i].testo = t.value;
});
radice.addEventListener('change', async e => {
  const t = e.target;
  try {
    if (t.dataset.per !== undefined) { V.liste = await api('/api/liste/per', { nome: t.dataset.per, per: t.value }); }
    else if (t.dataset.stato !== undefined) { await api('/api/contesti/stato', { nome: t.dataset.stato, stato: t.value.toLowerCase() }); await contesti(); }
    else if (t.dataset.votoGiorno !== undefined) { await api('/api/giorni/voto', { data: t.dataset.votoGiorno, voto: t.value }); await giornate(); }
    else if (t.dataset.progStato !== undefined) { await api('/api/progetti/stato', { nome: t.dataset.progStato, stato: t.value }); await progetti(); }
    else if (t.dataset.prog !== undefined) { await api('/api/progetti/contesto', { nome: t.dataset.prog, contesto: t.value }); await progetti(); }
    else if (t.id === 'file-audio' && t.files[0]) { const f = t.files[0]; dice('Carico l’audio…'); await vocali(await mandaAudio(f, 'vocale', null, f.name)); }
  } catch (err) { if (!dice(err.message)) errore(err); }
});
radice.addEventListener('focusout', e => { if (e.target.dataset?.az === 'perche') { clearTimeout(attesaSera); salvaSera(e.target.value); } });

addEventListener('resize', () => { chiudiGiorno(); adattaCalendario(); adattaSoldi(); adattaElenchi(); adattaBarra(); });
document.fonts?.ready.then(() => adattaElenchi());
document.addEventListener('click', e => { if (!e.target.closest('.pop-giorno, .cella')) chiudiGiorno(); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') chiudiGiorno();
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const scrivendo = document.activeElement?.matches('input, textarea');
  if (e.key === 'Escape' && pag === 'oggi' && nuovaAperta) { nuovaAperta = false; oggi(); }
  else if (e.key === 'Escape' && pag === 'liste' && V.listaNuova) { V.listaNuova = false; liste(V.liste); }
  else if ((e.key === 'n' || e.key === 'N') && pag === 'oggi' && !scrivendo && !ritoAperto && S?.oggi) { e.preventDefault(); nuovaAperta = true; oggi(); radice.querySelector('.nuova input').focus(); }
});

// ---------- avvio ----------
const PAGINE = { oggi, calendario, liste, weekend, lezioni, corso, obiettivi, giornate, contesti, call, vocali, progetti, soldi, movimenti, impostazioni, mese, piano: obiettivi, lavoro: contesti };
// Nessun vault collegato: niente dati, solo come collegarlo. Lo fa Claude nell'onboarding.
function daConfigurare() {
  document.title = S.marchio || 'Bussola'; pag = 'config';
  radice.innerHTML = `<main class="config-pagina"><div class="config-vuoto">
    <h1 class="saluto">${esc(S.marchio || 'Bussola')} non è ancora collegata</h1>
    <p class="sotto">Manca il tuo taccuino: il vault di Obsidian dove finiscono giornate, obiettivi e lavoro. Qui non c'è nessun dato, né tuo né di altri.</p>
    <ol class="config-passi"><li>Apri Claude Code in questa cartella.</li><li>Scrivi: <q>Leggi il CLAUDE.md e fammi l'onboarding.</q></li><li>Claude ti fa qualche domanda, crea o collega il tuo vault e riaccende Bussola. Questa pagina diventa la tua.</li></ol>
    <p class="piccolo">Se preferisci farlo a mano: copia <code>config.esempio.json</code> in <code>config.local.json</code>, scrivi in <code>"vault"</code> il percorso del tuo vault e riavvia il server.</p>
  </div></main>`;
}
async function mostra() {
  try {
    S = await api('/api/stato');
    if (S.daConfigurare) return daConfigurare();
    document.title = (S.marchio || 'Bussola') + (S.esempio ? ' · esempio' : ''); const [dove, ...resto] = (location.hash.slice(1) || 'oggi').split('/');
    if (dove !== 'mese' && bozza?.mensile) bozza = null;
    await (PAGINE[dove] || oggi)();
  } catch (e) { errore(e); }
}
addEventListener('hashchange', () => { salto = true; mostra(); });
// Aggiornamento da solo: ogni mezzo minuto si chiede al server se è cambiato qualcosa.
// Codice nuovo: la pagina si ricarica. Dati nuovi: si ridisegna. Mai mentre stai scrivendo o hai qualcosa di aperto.
let visto = null, attesa = null;
const libero = () => !document.hidden && !bozza && !ritoAperto && !reg && !V.listaNuova && !nuovaAperta && !document.activeElement?.matches('input, textarea, select') && !radice.querySelector('details[open], .pop-giorno, .we-ov, .soldi-pop');
async function controlla() {
  try {
    const s = await api('/api/segno'); if (!visto) { visto = s; return; }
    if (s.versione !== visto.versione) attesa = 'codice'; else if (s.dati !== visto.dati || s.giorno !== visto.giorno) attesa = attesa || 'dati';
    if (!attesa || !libero()) return;
    if (attesa === 'codice') return location.reload();
    const dentro = [...radice.querySelectorAll('.tab, .tab-mov, .giorni, .destra, .lt-scorri, .lt-indice')].map(e => e.scrollTop); attesa = null; visto = s; await mostra();
    [...radice.querySelectorAll('.tab, .tab-mov, .giorni, .destra, .lt-scorri, .lt-indice')].forEach((e, i) => { if (dentro[i]) e.scrollTop = dentro[i]; });
  } catch { /* server spento un attimo: si riprova al prossimo giro */ }
}
setInterval(controlla, 30000); controlla();
document.addEventListener('visibilitychange', () => { if (!document.hidden) controlla(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !bozza && !ritoAperto && !reg && !document.activeElement?.matches('input, textarea') && !radice.querySelector('details[open], .we-ov, .soldi-pop')) mostra(); });
mostra();
