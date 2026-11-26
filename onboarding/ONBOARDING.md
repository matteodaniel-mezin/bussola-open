# Onboarding

Costruisci una Bussola su misura per la persona che hai davanti. Il **profilo** (`PERSONALIZZAZIONE.md`) è il filo: lo scrivi passo dopo passo, così un onboarding interrotto riparte dal punto giusto e ogni passo dopo si appoggia su quello prima.

Due modi di risparmiare il suo tempo, validi in ogni passo:

- **Prima guarda, poi chiedi.** Tutto quello che il computer può dirti, lo scopri tu in silenzio.
- **Poi mostra.** Ogni scelta visibile (pagine, colori, caratteri, nome) la applichi subito e la fai vedere nel browser: l'utente reagisce a una pagina vera, non a una descrizione.

Le domande si fanno con la skill `grilling` (in `.claude/skills/`; `/grill-me` per l'utente): giri numerati, ogni domanda con la tua risposta consigliata, il giro dopo parte dalle risposte. Se la skill non si carica: verifica che `.claude/skills/grilling/SKILL.md` esista; con l'ok dell'utente copiala con `grill-me` in `~/.claude/skills/`; altrimenti segui a mano il metodo scritto in quel file.

## Passo 1. Ricognizione silenziosa

Senza fare domande, in parallelo:

- sistema operativo e chip (`uname -sm`), versione di Node (serve la 20 o più recente);
- Obsidian installato; vault esistenti (cartelle con dentro `.obsidian`, cerca nella cartella utente fino a 4 livelli);
- porta 4321 libera;
- programmi delle funzioni facoltative: `gh`, `uv`, `ffmpeg`, `pdftotext`, `swiftc`;
- connettori di Claude disponibili in questa sessione (Google Calendar, Google Sheets, Fathom, Vercel, Supabase);
- un `~/.claude/CLAUDE.md` che parli già di un second brain.

Poi avvia Bussola sul vault di esempio (`node server.mjs`, con `BUSSOLA_PORT` se la 4321 è occupata) e tienilo acceso per tutto l'onboarding.

Fatto quando: ogni voce qui sopra ha una risposta e il server risponde. Scrivi il risultato nel profilo, sezione `## Computer`, e crea il profilo con `stato: in corso` e `passo: 2`.

## Passo 2. Il taglio

Un solo giro breve, tre domande, per decidere come condurre il resto:

1. Cosa vorrebbe che cambiasse nelle sue giornate tra un mese, in una frase sua.
2. Quanto tempo ha adesso: **rapido** (10 minuti: solo le domande che cambiano il risultato, il resto prende la tua risposta consigliata) o **completo** (20-30 minuti: tutti i rami).
3. Quanto è a suo agio con computer e terminale: decide quanto spieghi e quanto fai da solo.

Fatto quando: le tre risposte sono nel profilo (`## Chi è`) con il percorso scelto. Da qui in poi parla nel suo registro e usa le sue parole per le cose: se chiama i clienti "progetti", anche tu.

## Passo 3. Cosa gli serve

`grilling` sui bisogni, partendo dalla sua frase del Passo 2, non dalle pagine. I rami e le pagine che decidono sono in [`bisogni.md`](bisogni.md): apri un ramo solo se le risposte precedenti lo rendono pertinente (chi non ha clienti salta il lavoro per clienti). Nel percorso rapido chiedi solo i rami dove la tua consigliata è incerta.

Dopo ogni giro aggiorna `nascondi` in `config.local.json` e fagli vedere la barra che cambia.

Fatto quando, nel profilo (`## Cosa gli serve`):

- ogni pagina di Bussola ha un verdetto: **tieni**, **nascondi** o **da costruire**, con il perché nelle sue parole;
- ci sono i tre risultati che vuole ottenere e come capirà, tra 30 giorni, se li ha ottenuti;
- ogni bisogno che Bussola non copre è scritto con una proposta di come costruirlo.

Mostragli il riassunto e chiedi conferma prima del passo dopo.

## Passo 4. Come la vuole

`grilling` sull'aspetto, con [`aspetto.md`](aspetto.md) come riferimento: tre parole sull'atmosfera, poi nome, palette, colori delle aree, caratteri, densità, saluto. Ogni proposta la scrivi in `public/tema.css` e `config.local.json` e la fai vedere ricaricando la pagina; con un browser a disposizione fai tu lo screenshot.

Fatto quando: l'utente guarda la pagina Oggi e una seconda pagina che userà spesso e dice che va bene. Scrivi nel profilo (`## Aspetto`) le tre parole e le scelte.

## Passo 5. Costruisci

Solo quello che il profilo chiede, in quest'ordine (dal più utile al facoltativo):

1. **Vault**: usa quello esistente se c'è, altrimenti crealo (`PER-CLAUDE.md`, Passi 1-3). Il `CLAUDE.md` del vault parte da `modelli/CLAUDE-vault.md` e prende ritmo, contesti e regole dal profilo; tieni solo le sezioni delle pagine che usa.
2. **Configurazione**: `config.local.json` da `config.esempio.json` con `vault` vero. Spiegagli dove trovare indirizzi iCal e chiave di Fathom, se li vuole, e aspetta che li incolli lui.
3. **Funzioni facoltative** scelte, installando solo i programmi che mancano (`PER-CLAUDE.md`, Passo 6).
4. **Attività automatiche**, se le vuole: adatta `modelli/pianificatore.md` e `modelli/giro-orario.md` al profilo, togliendo le parti delle pagine nascoste e scrivendo il suo ritmo.
5. **Da costruire**: per ogni bisogno nuovo proponi come lo faresti in tre righe e, con il suo sì, costruiscilo nello stile del codice (nessuna dipendenza, dati in Markdown nel vault, formato documentato in `PER-CLAUDE.md`).
6. **Collegamento con le altre chat**, se lo vuole (`PER-CLAUDE.md`, Passo 8).

Riavvia il server sul vault vero. Fatto quando: ogni pagina tenuta si apre senza errori nella console, e un da fare aggiunto in Oggi compare nel file del giorno in Obsidian.

## Passo 6. Il primo giorno insieme

Rendilo pratico subito:

- scrivi con lui i primi da fare di domani e, se li usa, gli obiettivi (il primo accesso di Bussola li chiede);
- scrivi `GUIDA-PERSONALE.md`: una pagina, solo le sue pagine, il suo ritmo (mattina, sera, settimana) con i minuti che ci vogliono, nelle sue parole. `GUIDA-UTENTE.md` resta come riferimento completo;
- proponi un controllo dopo una settimana: rileggete il profilo, cosa usa davvero, cosa togliere o aggiungere.

## Passo 7. Chiudi il profilo

`PERSONALIZZAZIONE.md` con `stato: fatto`, data, e le sezioni `## Computer`, `## Chi è`, `## Cosa gli serve`, `## Aspetto`, `## Cosa è attivo` (servizi, funzioni, attività), `## Da fare dopo`. Massimo una pagina e mezza. È in `.gitignore`, come `GUIDA-PERSONALE.md`.

Fatto quando: il profilo basta da solo a una sessione nuova di Claude per lavorare su questa Bussola senza rifare domande.
