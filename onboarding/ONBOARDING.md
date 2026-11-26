# Onboarding

Costruisci una Bussola su misura per la persona che hai davanti. Il **profilo** (`PERSONALIZZAZIONE.md`) è il filo: lo scrivi passo dopo passo, così un onboarding interrotto riparte dal punto giusto e ogni passo dopo si appoggia su quello prima.

Due modi di risparmiare il suo tempo, validi in ogni passo:

- **Prima guarda, poi chiedi.** Tutto quello che il computer può dirti, lo scopri tu in silenzio.
- **Poi mostra.** Ogni scelta visibile (pagine, colori, caratteri, nome) la applichi subito e la fai vedere nel browser: l'utente reagisce a una pagina vera, non a una descrizione.

Le domande si fanno con la skill `grilling` (in `.claude/skills/`; `/grill-me` per l'utente): giri numerati, ogni domanda con la tua risposta consigliata, il giro dopo parte dalle risposte. Se la skill non si carica: verifica che `.claude/skills/grilling/SKILL.md` esista; con l'ok dell'utente copiala con `grill-me` in `~/.claude/skills/`; altrimenti segui a mano il metodo scritto in quel file.

## Passo 1. Ricognizione silenziosa

Senza fare domande, in parallelo:

- la copia è separata dall'originale (`CLAUDE.md`, "Prima di tutto"): se non lo è, sistemala adesso;
- sistema operativo e chip (`uname -sm`), versione di Node (serve la 20 o più recente);
- Obsidian installato; vault esistenti (cartelle con dentro `.obsidian`, cerca nella cartella utente fino a 4 livelli);
- porta 4321 libera;
- programmi delle funzioni facoltative: `gh`, `uv`, `ffmpeg`, `pdftotext`, `swiftc`;
- connettori di Claude disponibili in questa sessione (Google Calendar, Google Sheets, Fathom, Vercel, Supabase);
- un `~/.claude/CLAUDE.md` che parli già di un second brain.

All'utente mostri solo il **suo** vault, mai quello di esempio: il vault di esempio (`strumenti/crea-esempio.mjs`) serve solo a te, per le prove, e si apre solo con `BUSSOLA_VAULT=vault-esempio`.

Fatto quando: ogni voce qui sopra ha una risposta. Scrivi il risultato nel profilo, sezione `## Computer`, e crea il profilo con `stato: in corso` e `passo: 2`.

## Passo 2. Il taglio

Un solo giro breve, tre domande, per decidere come condurre il resto:

1. Cosa vorrebbe che cambiasse nelle sue giornate tra un mese, in una frase sua.
2. Quanto tempo ha adesso: **rapido** (10 minuti: solo le domande che cambiano il risultato, il resto prende la tua risposta consigliata) o **completo** (20-30 minuti: tutti i rami).
3. Quanto è a suo agio con computer e terminale: decide quanto spieghi e quanto fai da solo.
4. Dove tenere il vault: quello che hai trovato al Passo 1, oppure uno nuovo (consigliato `~/Documents/Second-Brain`).

Subito dopo: crea o collega il vault (cartelle e `CLAUDE.md`, `PER-CLAUDE.md` Passi 1-3), scrivi `config.local.json` con `vault` e avvia Bussola (`node server.mjs`, con `BUSSOLA_PORT` se la 4321 è occupata). Tienila accesa per tutto l'onboarding: da qui in poi ogni anteprima è sul suo vault.

Fatto quando: le risposte sono nel profilo (`## Chi è`) con il percorso scelto, e Bussola risponde sul suo vault. Da qui in poi parla nel suo registro e usa le sue parole per le cose: se chiama i clienti "progetti", anche tu.

## Passo 3. Ritratto, visione e bisogni

Prima la **vita**, poi la **visione**, poi i bisogni: la piattaforma prende forma dalla persona e dalla sua direzione, non dal catalogo delle pagine.

1. **Ritratto**: `grilling` area per area (lavoro, gioco, amore, salute) con le domande di [`vita.md`](vita.md): cosa fa, con chi, perché, quando, dove, con cosa, come va, cosa vorrebbe. Scrivi `Piano/Vita.md` nel vault mentre procedi. Fatto quando vale il criterio di fine di `vita.md`.
2. **Visione**: `grilling` sulla visione: dove vuole essere tra 2 anni, cosa conta nella sua vita, perché lavora, gli obiettivi a 6 mesi e del mese. Nel percorso rapido bastano visione in una frase e tre obiettivi. Fatto quando il profilo ha `## Visione` con queste risposte nelle sue parole; servono anche a riempire `Bussola.md` e `Obiettivi.md` nel Passo 5.
3. **Bisogni**: `grilling` sui bisogni, partendo da ritratto, visione e frase del Passo 2, non dalle pagine. I rami a cui il ritratto ha già risposto non si richiedono: usa quelle risposte. I rami e le pagine che decidono sono in [`bisogni.md`](bisogni.md): apri un ramo solo se le risposte precedenti lo rendono pertinente (chi non ha clienti salta il lavoro per clienti). Nel percorso rapido chiedi solo i rami dove la tua consigliata è incerta.

Dopo ogni giro aggiorna `nascondi` in `config.local.json` e fagli vedere la barra che cambia.

Fatto quando, nel profilo (`## Cosa gli serve`):

- ogni pagina di Bussola ha un verdetto: **tieni**, **nascondi** o **da costruire**, con il perché nelle sue parole; ogni pagina tenuta serve ad almeno un obiettivo o alla visione, e il profilo dice a quale;
- ci sono i tre risultati che vuole ottenere e come capirà, tra 30 giorni, se li ha ottenuti;
- ogni bisogno che Bussola non copre è scritto con una proposta di come costruirlo.

Mostragli il riassunto e chiedi conferma prima del passo dopo.

## Passo 4. Come la vuole

`grilling` sull'aspetto, con [`aspetto.md`](aspetto.md) come riferimento: tre parole sull'atmosfera, poi nome, palette, colori delle aree, caratteri, densità, saluto. Ogni proposta la scrivi in `public/tema.css` e `config.local.json` e la fai vedere ricaricando la pagina; con un browser a disposizione fai tu lo screenshot.

Fatto quando: l'utente guarda la pagina Oggi e una seconda pagina che userà spesso e dice che va bene. Scrivi nel profilo (`## Aspetto`) le tre parole e le scelte.

## Passo 5. Costruisci

Solo quello che il profilo chiede, in quest'ordine (dal più utile al facoltativo):

1. **Vault**: già collegato al Passo 2. Completa il suo `CLAUDE.md` partendo da `modelli/CLAUDE-vault.md`, con ritmo, contesti e regole del profilo; tieni solo le sezioni delle pagine che usa. Scrivi `Piano/Bussola.md` e `Piano/Obiettivi.md` dalla visione del Passo 3.
2. **Configurazione**: completa `config.local.json` (le chiavi in `config.esempio.json`). Spiegagli dove trovare indirizzi iCal e chiave di Fathom, se li vuole, e aspetta che li incolli lui.
3. **Funzioni facoltative** scelte, installando solo i programmi che mancano (`PER-CLAUDE.md`, Passo 6).
4. **Attività automatiche**: sono il cuore del Second Brain, perché lo tengono aggiornato anche quando l'utente non ci pensa. Consigliale tutte e tre e attivale con il suo ok, adattate al profilo (pagine nascoste tolte, il suo ritmo scritto):
   - `modelli/pianificatore.md`, ogni due ore: settimana, proposte, voto, segnale;
   - `modelli/giro-orario.md`, ogni ora: smista Inbox, aggiorna Contesti, Diario e Lezioni;
   - `modelli/riallineamento.md`, la domenica sera e l'ultimo giorno del mese: prepara le domande per riallineare obiettivi e visione, che compaiono in Oggi.
   Se non le vuole, scrivi nel profilo che il vault si aggiorna solo quando apre una chat, e chi fa il riallineamento (la chat Come sto andando, quando la apre).
5. **Strumenti**: per ogni strumento del ramo Strumenti (`bisogni.md`) segui [`strumenti.md`](strumenti.md): collegalo, decidi con l'utente cosa porta nel vault, scarica la sua icona e aggiungilo a `strumenti` in `config.local.json`. Impostazioni mostra solo i suoi.
6. **Da costruire**: per ogni bisogno nuovo proponi come lo faresti in tre righe e, con il suo sì, costruiscilo seguendo la skill design-bussola e lo stile del codice (nessuna dipendenza, dati in Markdown nel vault, formato documentato in `PER-CLAUDE.md`).
7. **Le chat per macrocategoria**: una chat di Claude per ogni gruppo di pagine tenuto (Generale, La mia giornata, Come sto andando, Lavoro, Design), tutte sul vault. Segui [`chat.md`](chat.md).
8. **Collegamento con le chat degli altri progetti** (`PER-CLAUDE.md`, Passo 8): consiglialo, così anche il lavoro fatto altrove arriva nel Second Brain.

Riavvia il server sul vault vero. Fatto quando: ogni pagina tenuta si apre senza errori nella console, e un da fare aggiunto in Oggi compare nel file del giorno in Obsidian.

## Passo 6. Il primo giorno insieme

Rendilo pratico subito:

- scrivi con lui i primi da fare di domani e, se li usa, gli obiettivi (il primo accesso di Bussola li chiede);
- scrivi `GUIDA-PERSONALE.md`: una pagina, solo le sue pagine, il suo ritmo (mattina, sera, settimana) con i minuti che ci vogliono, nelle sue parole. `GUIDA-UTENTE.md` resta come riferimento completo;
- digli quando arriva il primo riallineamento (la prima domenica) e dove risponde (chat Come sto andando).

## Passo 7. Chiudi il profilo

`PERSONALIZZAZIONE.md` con `stato: fatto`, data, e le sezioni `## Computer`, `## Chi è`, `## Visione`, `## Cosa gli serve`, `## Aspetto`, `## Cosa è attivo` (servizi, funzioni, attività, chat), `## Da fare dopo`. Massimo una pagina e mezza. È in `.gitignore`, come `GUIDA-PERSONALE.md`.

Fatto quando: il profilo basta da solo a una sessione nuova di Claude per lavorare su questa Bussola senza rifare domande.
