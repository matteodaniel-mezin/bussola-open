// Crea un vault di esempio (vault-esempio/) e i dati di esempio (dati-esempio/) con persone, clienti e numeri inventati.
// Le date partono da oggi, così le pagine sono sempre piene. Uso: node strumenti/crea-esempio.mjs [--forza]
// Senza --forza non tocca un vault di esempio che esiste già.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(RADICE, 'vault-esempio');
const DATI = path.join(RADICE, 'dati-esempio');

export function creaEsempio({ forza = false } = {}) {
  if (fs.existsSync(VAULT) && !forza) return false;
  fs.rmSync(VAULT, { recursive: true, force: true }); fs.rmSync(DATI, { recursive: true, force: true });

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const giorno = k => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + k); return d; };
  const G = k => iso(giorno(k));
  const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const titolo = k => { const d = giorno(k); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
  const settimana = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const g = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - g); const i = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${pad(Math.ceil(((t - i) / 864e5 + 1) / 7))}`; };
  const scrivi = (rel, testo, base = VAULT) => { const p = path.join(base, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, testo.replace(/^\n/, '')); };
  const json = (rel, x) => scrivi(rel, JSON.stringify(x, null, 1) + '\n', DATI);
  const mese = G(0).slice(0, 7);

  // ---------- regole del vault ----------
  scrivi('CLAUDE.md', fs.readFileSync(path.join(RADICE, 'modelli', 'CLAUDE-vault.md'), 'utf8'));
  scrivi('Stato.md', `
# Stato

Ultimo controllo: ${G(0)} 08:00. Inbox vuota.

## Cosa è cambiato
- Aggiornato [[Libreria Il Faro]] dopo la call di ${G(-2)}.

## Da approvare
- Proposta di lezione: **Prima di un preventivo, chiedo il budget** — nella call con [[Libreria Il Faro]] ho stimato senza sapere quanto volevano spendere. [[${G(-2)} Call con Libreria Il Faro]]
- Aggiungere un evento a [[Scrivo il prossimo passo prima di chiudere la call]]: anche con [[Palestra Nord]] ha funzionato. [[${G(-6)} Prima call con Palestra Nord]]

## Decisioni che servono a te
- Nessuna.
`);

  // ---------- Piano ----------
  scrivi('Piano/Bussola.md', `
---
tipo: bussola
allineata: ${G(-20)}
ultimo_check: ${mese}
---
# Bussola

## Perché lavoro
Per fare cose belle e utili per persone che conosco, e per avere tempo libero quando serve.

## Cosa conta nella vita
Gli amici, stare all'aria aperta, imparare una cosa nuova ogni mese.

## Come va adesso
- lavoro: 3
- gioco: 2
- amore: 4
- salute: 3
`);
  scrivi('Piano/Obiettivi.md', `
---
tipo: obiettivi
aggiornato: ${G(-20)}
---
# Obiettivi

Scritti nella piattaforma Bussola. Da qui Claude ricava la settimana e i da fare.

## Tra 2 anni
- Lavorare da freelance con 5 clienti fissi #lavoro
- Correre una mezza maratona #salute

## Tra 6 mesi
- Tre clienti con un canone mensile #lavoro
- Un weekend fuori al mese #gioco

## Questo mese
- Chiudere il sito della Libreria Il Faro #lavoro
- Mandare due preventivi nuovi #lavoro
- Correre tre volte a settimana #salute
`);
  scrivi('Piano/Abitudini.md', `
# Abitudini

Cose che compaiono ogni giorno nei da fare. Una per riga, con l'area.

## Ogni giorno
- Camminata di 20 minuti #salute
- Leggere 10 pagine @(lun,mer,ven) #gioco
`);
  scrivi(`Piano/Settimane/${settimana(giorno(0))}.md`, `
---
tipo: settimana
---
# Settimana ${settimana(giorno(0))}

## Micro-obiettivi
- [x] Mandare le bozze della home alla Libreria Il Faro #lavoro
- [ ] Preparare il preventivo per Palestra Nord #lavoro
- [ ] Tre corse da 5 km #salute
- [ ] Organizzare la cena con gli amici di sabato #amore
`);
  // Giornate passate: voto, cose fatte, nota della sera.
  const passate = [
    [5, 'Giornata piena. Bozze mandate e corsa fatta, mi sento carico.', [['Bozze della home per Il Faro', 'lavoro', 1], ['Corsa 5 km', 'salute', 1], ['Chiamare la nonna', 'amore', 1]]],
    [3, 'Mattina lenta, pomeriggio meglio.', [['Rispondere alle email', 'lavoro', 1], ['Corsa 5 km', 'salute', 0], ['Spesa', null, 1]]],
    [4, 'Bella call con Palestra Nord, hanno capito subito il valore.', [['Call con Palestra Nord', 'lavoro', 1], ['Appunti della call', 'lavoro', 1], ['Palestra', 'salute', 1]]],
    [2, 'Stanco, poco produttivo. Troppo telefono.', [['Preventivo Palestra Nord', 'lavoro', 0], ['Camminata', 'salute', 1]]],
    [4, 'Weekend al lago, giornata bellissima.', [['Gita al lago', 'gioco', 1], ['Cena con Luca e Sara', 'amore', 1]]],
    [3, 'Normale. Ho finito le revisioni.', [['Revisioni del logo', 'lavoro', 1], ['Lettura', 'gioco', 1]]],
    [5, 'Contento: il cliente ha approvato tutto al primo giro.', [['Presentazione al cliente', 'lavoro', 1], ['Corsa 7 km', 'salute', 1], ['Cinema', 'gioco', 1]]],
  ];
  for (let k = 1; k <= 21; k++) {
    const [voto, sera, todo] = passate[(k - 1) % passate.length];
    const righe = [['Camminata di 20 minuti', 'salute', k % 3 ? 1 : 0, 'ogni giorno'], ...todo].map(([t, a, f, n]) => `- [${f ? 'x' : ' '}] ${t}${n ? ` @(${n})` : ''}${a ? ` #${a}` : ''}`).join('\n');
    scrivi(`Piano/Giorni/${G(-k)}.md`, `
---
tipo: giorno
data: ${G(-k)}
voto: ${voto}
${k % 4 === 0 ? 'voto_da: claude\n' : ''}---
# ${titolo(-k)}

## Da fare
${righe}

## Sera
${sera}
`);
  }
  scrivi(`Piano/Giorni/${G(0)}.md`, `
---
tipo: giorno
data: ${G(0)}
voto:
---
# ${titolo(0)}

## Da fare
- [ ] Camminata di 20 minuti @(ogni giorno) #salute
- [x] Rispondere a Libreria Il Faro @(da prima) #lavoro
- [ ] Preventivo per Palestra Nord @(preventivo) ~(10:00 · 2 h) #lavoro
- [ ] Corsa 5 km ~(18:30) #salute
- [ ] Scrivere a Sara per sabato #amore

## Proposte
- Leggere il capitolo 3 del corso di fotografia ~(30 min) #gioco
- Sistemare le fatture del mese #lavoro

## Agenda
- 9:30-10:00 Stand-up con Studio Verde
- 15:00-16:00 Call con Libreria Il Faro
- 20:30 Cena da Luca

## Sera
`);
  scrivi('Piano/Segnale.md', `
---
stato: in linea
aggiornato: ${G(0)}
---
# Segnale

## Bussola
Le giornate seguono gli obiettivi del mese: lavoro e salute vanno avanti. Il gioco è un po' indietro.

## Cosa hanno in comune i giorni buoni
- C'è almeno una corsa o una camminata la mattina.
- Il lavoro importante è fatto prima di pranzo.
- La sera c'è qualcosa con gli amici.

## Una cosa da cambiare
Telefono fuori dalla camera la sera: i giorni dopo una sera al telefono hanno voto 2.
`);
  scrivi('Piano/Riallineamento.md', `
---
stato: aperto
data: ${G(0)}
tipo_giro: settimana
chat: Come sto andando
---
# Riallineamento

Domande preparate dall'attività "riallineamento". Si risponde nella chat "Come sto andando".

## Domande
- Hai corso due volte su tre questa settimana: l'obiettivo "tre volte a settimana" è ancora quello giusto, o meglio due?
- Palestra Nord è in attesa da sei giorni: la tieni tra le priorità della settimana prossima o la metti in pausa?
- Il gioco è a 2 da tre settimane: cosa ti piacerebbe fare questo weekend?

## Risposte
`);
  scrivi('Piano/Richieste.md', `
# Richieste a Claude

Scritte in automatico dalla piattaforma Bussola. Claude le legge, fa il lavoro e le sposta sotto "Fatte".

## Da fare

## Fatte
- ${G(-20)} 09:12 · primo allineamento: proporre i micro-obiettivi della settimana.
`);
  scrivi('Piano/Liste/Spesa.md', `
---
tipo: lista
per: sabato mattina
area:
---
# Spesa

- [ ] Pane
- [ ] Frutta
- [x] Caffè
`);
  scrivi('Piano/Liste/Libri da leggere.md', `
---
tipo: lista
per:
area: gioco
---
# Libri da leggere

- [ ] Un romanzo di fantascienza
- [ ] Un libro sulla fotografia
`);
  scrivi('Piano/Lezioni scelte.md', `
# Lezioni scelte

Scritte dalla pagina Lezioni di Bussola. Il giro orario del vault le legge: con "sì" crea la lezione in Lezioni/ (o aggiunge l'evento a quella indicata), con "no" la lascia cadere. Poi sposta la riga sotto "Fatte".

## Da fare

## Fatte
- ${G(-9)} 21:10 · sì, lezione nuova · Proposta di lezione: **Scrivo il prossimo passo prima di chiudere la call**
`);
  scrivi('Piano/Weekend.md', `
---
aggiornato: ${G(-1)}
---
# Weekend

## Cosa mi piace
- Camminare in montagna
- Mangiare fuori con gli amici
- Mostre di fotografia

## Proposte

### Giro ad anello sul monte vicino
- quando: sabato mattina
- con: Luca
- dove: Sentiero ad anello, 9 km, 3 ore
- costo: 0 €, solo benzina
- serve: scarpe da trekking, acqua, pranzo al sacco
- perché ora: le previsioni dicono sole
- da verificare: sentiero aperto dopo la pioggia
- visto su: sito del parco
- area: salute
- stato: proposta

### Mostra di fotografia in città
- quando: domenica pomeriggio
- con: Sara
- dove: Museo civico
- costo: 12 € a testa
- serve: biglietti online
- perché ora: chiude tra due settimane
- area: gioco
- stato: proposta
`);
  // Roadmap: tappe con data, passi del giorno, il sogno.
  scrivi('Piano/Roadmap.md', `
---
traguardo: 3 clienti con un canone entro sei mesi
creata: ${G(-30)}
---
# Roadmap

## Il sogno
- **Lavoro**: scegliere i clienti, non rincorrerli.
- **Tempo**: un giorno a settimana senza schermo.

## Tappa 1: Primo cliente con canone
Entro: ${G(20)}
Traguardo: un contratto mensile firmato

### ${G(0)} ${titolo(0)}
- [ ] Mandare il preventivo a Palestra Nord ~(1 h)
- [ ] Preparare due domande per la call ~(15 min)

### ${G(1)} ${titolo(1)}
- [ ] Richiamare Palestra Nord ~(20 min)

## Tappa 2: Tre clienti
Entro: ${G(110)}
Traguardo: tre canoni mensili

### Mese prossimo
- [ ] Chiedere un passaparola a ogni cliente contento

## Raggiunti
- ${G(-12)} Sito online: primo lavoro consegnato
- ${G(-5)} Logo approvato: al primo giro

## Entrate fisse
- Libreria Il Faro: 300 € (stima)
`);

  // ---------- Contesti ----------
  scrivi('Contesti/Libreria Il Faro.md', `
---
categoria: cliente
stato: attivo
aggiornato: ${G(-2)}
firmato: 300
ricorrente: sì
incassi: ${G(-35).slice(0, 7)} 300, ${mese} 300
---
# Libreria Il Faro

## Cos'è
Libreria di quartiere. Vogliono un sito con il catalogo e gli eventi.

## Persone
- Anna, titolare

## Cronologia
- ${G(-12)} Prima versione del sito online.
- ${G(-2)} Call: approvata la home, mancano gli eventi.

## Aperto
- Aggiungere la pagina degli eventi entro venerdì.
- Chiedere le foto del negozio.
`);
  scrivi('Contesti/Palestra Nord.md', `
---
categoria: cliente
stato: in attesa
aggiornato: ${G(-6)}
firmato: da capire
---
# Palestra Nord

## Cos'è
Palestra con 300 iscritti. Vogliono un'app per prenotare i corsi.

## Persone
- Marco, responsabile

## Aperto
- In attesa del loro budget prima del preventivo.
- Mandare due esempi di app simili.
`);
  scrivi('Contesti/Studio Verde.md', `
---
categoria: collaborazione
stato: attivo
aggiornato: ${G(-1)}
---
# Studio Verde

## Cos'è
Studio di architettura con cui lavoro per i loro siti. Stand-up ogni lunedì.

## Aperto
- Rivedere i testi della pagina Chi siamo.
`);
  scrivi('Contesti/Personale.md', `
---
categoria: personale
---
# Personale

## Cos'è
Cose mie: casa, salute, amici. Non compare nella pagina Contesti.
`);

  // ---------- Diario: le call ----------
  scrivi(`Diario/${G(-2)} Call con Libreria Il Faro.md`, `
---
evento: call
data: ${G(-2)}
contesto: "[[Libreria Il Faro]]"
voto: 8
---
# Call con Libreria Il Faro

## Esito
Home approvata. Mancano la pagina eventi e le foto.

## Cosa è successo
Abbiamo guardato insieme la home dal telefono. Anna voleva i libri in evidenza più grandi. Le ho chiesto chi aggiornerà gli eventi: lei, una volta a settimana.

## Cosa ho fatto bene
- Ho mostrato il sito dal telefono, come lo vedranno i clienti.

## Cosa ho sbagliato
- Ho dato una data per gli eventi senza sapere quante foto servono.

## Impegni
- Io: pagina eventi entro venerdì.
- Anna: mandare 10 foto del negozio.

## Lezioni
- [[Scrivo il prossimo passo prima di chiudere la call]]
`);
  scrivi(`Diario/${G(-6)} Prima call con Palestra Nord.md`, `
---
evento: call
data: ${G(-6)}
contesto: "[[Palestra Nord]]"
voto: 7
---
# Prima call con Palestra Nord

## Esito
Interessati all'app di prenotazione. Prima vogliono un'idea dei costi.

## Cosa ho fatto bene
- Ho fatto più domande che proposte.

## Cosa ho sbagliato
- Non ho chiesto il budget.

## Impegni
- Io: due esempi di app simili.
- Marco: dirmi il budget.
`);

  // ---------- Lezioni ----------
  scrivi('Lezioni/Scrivo il prossimo passo prima di chiudere la call.md', `
---
ambito: call
aggiornato: ${G(-2)}
---
# Scrivo il prossimo passo prima di chiudere la call

## Regola
Negli ultimi due minuti dico ad alta voce chi fa cosa ed entro quando, e lo scrivo in chat.

## Perché
Così nessuno resta con un dubbio e la call dopo parte da lì.

## Da dove viene
- [[${G(-2)} Call con Libreria Il Faro]]
- [[${G(-6)} Prima call con Palestra Nord]]
`);
  scrivi('Lezioni/Il lavoro importante va prima di pranzo.md', `
---
ambito: giornata
aggiornato: ${G(-10)}
---
# Il lavoro importante va prima di pranzo

## Regola
La cosa più importante del giorno la faccio entro le 13.

## Perché
Nei giorni con voto alto è sempre andata così.

## Da dove viene
- Lettura delle giornate di questo mese.
`);
  scrivi('Lezioni/Fotografia, cosa ho imparato.md', `
---
tipo: mappa
stato: in corso
aggiornato: ${G(-3)}
---
# Fotografia, cosa ho imparato

## Le idee che valgono ovunque
1. La luce conta più della macchina.
2. Prima di scattare, decidi cosa vuoi far vedere.
3. Meno elementi nell'inquadratura, più forza.
4. Rifai la stessa foto in tre modi diversi.

## Concetti
- **Esposizione**: quanta luce arriva al sensore.
- **Composizione**: dove metti le cose nell'inquadratura.

## Dove sono arrivato
- [x] Capire l'esposizione
- [x] Regola dei terzi
- [ ] Luce naturale in interni
- [ ] Ritratto

## Cosa c'è di nuovo
- Ho provato la luce della finestra: funziona meglio del flash.

## Ancora da capire
- Come si scattano foto di notte senza treppiede?
`);
  // Un corso da studiare: giornate (Gn) raggruppate in lezioni, con le caselle da spuntare.
  scrivi(`Inbox/${G(-15)} Corso di fotografia di base.md`, `
---
tipo: corso
mappa: "[[Fotografia, cosa ho imparato]]"
giornata_attuale: G3
---
# Corso: fotografia di base

## Caselle
- [x] G1. La luce
- [x] G2. L'esposizione
- [ ] G3. La composizione
- [ ] G4. Il ritratto
- [ ] G5. La foto di notte
- [ ] G6. Prova finale

## Lezione 1. Vedere la luce (G1 - G2)

### G1. La luce
**A cosa ti serve:** capire da dove arriva la luce prima di scattare.

Guarda una stanza alle 9, alle 13 e alle 18. Scatta la stessa foto tre volte.

**Da fare oggi:** tre foto della stessa finestra.

### G2. L'esposizione
Tempo, diaframma e ISO decidono quanta luce entra.

## Lezione 2. Comporre (G3 - G4)

### G3. La composizione
Dividi l'inquadratura in tre parti per lato. Metti il soggetto su un incrocio.

**Da fare oggi:** dieci foto con il soggetto su un incrocio.

### G4. Il ritratto
Luce morbida, sfondo semplice, occhi a fuoco.

## Lezione 3. Oltre le basi (G5 - G6)

### G5. La foto di notte
Appoggia la macchina, tempo lungo, ISO basso.

### G6. Prova finale
Una serie di cinque foto sullo stesso tema.
`);
  scrivi('Inbox/LEGGIMI.md', `
Qui arriva il materiale grezzo: vocali trascritti, note di lavoro delle altre chat di Claude, trascrizioni. Il giro orario lo smista.
`);

  // ---------- dati fuori dal vault ----------
  const ev = [];
  for (let k = -10; k <= 40; k++) {
    const d = giorno(k), g = d.getDay(); if (g === 0) continue;
    if (g === 1) ev.push({ data: G(k), ora: '9:30', fine: '10:00', titolo: 'Stand-up con Studio Verde', calendario: 'Lavoro', area: 'lavoro' });
    if (g === 2 || g === 4) ev.push({ data: G(k), ora: '18:30', fine: '19:30', titolo: 'Corsa al parco', calendario: 'Personale', area: 'salute' });
    if (g === 6) ev.push({ data: G(k), ora: '20:30', titolo: 'Cena con gli amici', calendario: 'Personale', area: 'amore' });
  }
  ev.push({ data: G(0), ora: '15:00', fine: '16:00', titolo: 'Call con Libreria Il Faro', calendario: 'Lavoro', area: 'lavoro' });
  ev.push({ data: G(0), ora: '9:30', fine: '10:00', titolo: 'Stand-up con Studio Verde', calendario: 'Lavoro', area: 'lavoro' });
  ev.push({ data: G(0), ora: '20:30', titolo: 'Cena da Luca', calendario: 'Personale', area: 'amore' });
  ev.push({ data: G(2), ora: '11:00', fine: '11:45', titolo: 'Call con Palestra Nord', calendario: 'Lavoro', area: 'lavoro' });
  ev.push({ data: G(5), ora: '10:00', fine: '11:00', titolo: 'Demo sito eventi Il Faro', calendario: 'Lavoro', area: 'lavoro' });
  json('calendario.json', { aggiornato: new Date().toISOString(), da: G(-10), a: G(40), calendari: ['Lavoro', 'Personale'], eventi: ev });
  json('soldi.json', {
    aggiornato: G(0), foglio: '', foglioNome: 'Entrate e uscite (esempio)', meseNome: MESI[giorno(0).getMonth()],
    liquidita: { Banca: 3200, Contanti: 80 }, liquiditaTotale: 3280, disponibile: 2700,
    fisse: [{ nome: 'Affitto', importo: 500, giorno: 1, pagata: true }, { nome: 'Telefono (abbonamento)', importo: 12, giorno: 15, pagata: false }, { nome: 'Palestra (abbonamento)', importo: 45, giorno: 25, pagata: false }, { nome: 'Hosting (abbonamento)', importo: 8, giorno: 28, pagata: false }],
    fisseTotale: 565, fissePagate: 500, fisseResiduo: 65,
    mese: { entrate: 1300, uscite: 920, saldo: 380 },
    categorie: [['Casa', 500], ['Spesa', 210], ['Uscite con amici', 90], ['Trasporti', 60], ['Abbonamenti', 65]],
    andamento: [[-3, 1100, 950], [-2, 1250, 1010], [-1, 1400, 880], [0, 1300, 920]].map(([m, e, u]) => { const d = giorno(0); d.setDate(1); d.setMonth(d.getMonth() + m); return [MESI[d.getMonth()].slice(0, 3), e, u]; }),
    movimenti: [[G(-1), 'Banca', 'Entrata', 'Lavoro', 'Libreria Il Faro, canone', 300], [G(-2), 'Banca', 'Uscita', 'Spesa', 'Supermercato', 46.2], [G(-3), 'Contanti', 'Uscita', 'Uscite con amici', 'Pizza', 18], [G(-5), 'Banca', 'Entrata', 'Lavoro', 'Studio Verde, testi', 1000], [G(-7), 'Banca', 'Uscita', 'Trasporti', 'Benzina', 60], [G(-9), 'Banca', 'Uscita', 'Casa', 'Affitto', 500]],
  });
  json('progetti.json', {
    aggiornato: G(-1), githubUtente: '', conteggi: { github: 2, vercel: 1, supabase: 1 }, altri: 0,
    progetti: [
      { nome: 'Sito Il Faro', contesto: 'Libreria Il Faro', stato: 'Attivo', descrizione: 'Sito con catalogo ed eventi.', github: ['sito-il-faro'], vercel: [{ nome: 'sito-il-faro', url: 'sito-il-faro.example.com' }], supabase: [{ nome: 'il-faro', regione: 'eu-central-1', stato: 'attivo' }], spese: ['Hosting'] },
      { nome: 'App prenotazioni', contesto: 'Palestra Nord', stato: 'In pausa', descrizione: 'Prototipo per prenotare i corsi.', github: ['app-prenotazioni'], vercel: [], supabase: [], spese: [] },
    ],
  });
  json('fathom.json', { aggiornato: new Date().toISOString(), registrazioni: [
    { id: '1', titolo: 'Call con Libreria Il Faro', data: G(-2), ora: '15:00', minuti: 42, url: null, con: ['Libreria Il Faro'], riassunto: '**Home approvata.** Mancano la pagina eventi e le foto del negozio.', azioni: [{ testo: 'Pagina eventi entro venerdì', fatta: false, di: 'Tu' }, { testo: 'Mandare 10 foto', fatta: false, di: 'Anna' }] },
    { id: '2', titolo: 'Prima call con Palestra Nord', data: G(-6), ora: '11:00', minuti: 35, url: null, con: ['Palestra Nord'], riassunto: 'Interessati a un\'app per prenotare i corsi. Aspettano un\'idea dei costi.', azioni: [{ testo: 'Due esempi di app simili', fatta: true, di: 'Tu' }] },
  ] });
  json('aree.json', { 'stand-up': 'lavoro' });
  json('nascosti.json', []);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fatto = creaEsempio({ forza: process.argv.includes('--forza') });
  console.log(fatto ? `Vault di esempio creato in ${VAULT}` : 'Il vault di esempio esiste già. Per rifarlo da capo: node strumenti/crea-esempio.mjs --forza');
}
