# Bussola

Una piattaforma locale per la tua giornata, i tuoi obiettivi e il tuo lavoro, costruita sopra un Second Brain in Obsidian.

Bussola legge e scrive file Markdown nel tuo vault: da fare del giorno, voto della sera, obiettivi, lezioni, clienti, call. Claude, con due attività programmate, lavora sugli stessi file: propone cosa fare, dà un voto alle giornate, ti dice se sei sulla rotta, ordina quello che arriva.

- Gira sul tuo computer, su `http://localhost:4321`. Ascolta solo su `127.0.0.1`.
- Nessuna dipendenza: solo Node.js.
- I tuoi dati restano nel tuo vault. Niente database, niente account.
- Interfaccia in italiano.

## Prova subito

Serve Node.js 20 o più recente.

```bash
git clone https://github.com/matteodaniel-mezin/bussola-open.git
cd bussola-open
node server.mjs
```

Apri `http://localhost:4321`. Senza configurazione Bussola crea e usa un vault di esempio (`vault-esempio/`), con persone, clienti e numeri inventati. Per rifarlo da capo: `node strumenti/crea-esempio.mjs --forza`.

## La tua copia

Questa repo resta com'è. Quando la usi, Claude rinomina il collegamento a questa repo in `originale` e lavora sul branch `mia-bussola`: le tue modifiche restano tue e, se vuoi salvarle online, vanno in una repo privata sul tuo account. Le novità di qui le prendi solo quando lo chiedi.

## Usalo con il tuo vault

```bash
cp config.esempio.json config.local.json
```

In `config.local.json` scrivi almeno `vault`, il percorso del tuo vault Obsidian (per esempio `~/Documents/Second-Brain`). Poi riavvia `node server.mjs`. La prima volta Bussola ti fa quattro domande sulla tua bussola e sui tuoi obiettivi.

`config.local.json` contiene anche, se vuoi, gli indirizzi segreti del calendario e la chiave di Fathom: non metterlo mai su GitHub (è già in `.gitignore`).

## Le guide

- [GUIDA-UTENTE.md](GUIDA-UTENTE.md): cosa fa ogni pagina e come usarla nella giornata, nella settimana e la sera.
- [PER-CLAUDE.md](PER-CLAUDE.md): per Claude. Come creare da zero il Second Brain di un utente nuovo: Obsidian, cartelle, aree della vita, formati dei file, `CLAUDE.md` del vault, attività automatiche, installazione.

## Fatta su misura per te

Apri Claude Code in questa cartella e salutalo: ti propone l'onboarding. Prima controlla da solo il tuo computer (programmi, vault che hai già), poi ti chiede quanto tempo hai: 10 minuti o una versione completa. Con la skill **grill-me** (già inclusa in `.claude/skills/`, da [mattpocock/skills](https://github.com/mattpocock/skills), licenza MIT) ti fa domande a giri, sempre con la sua risposta consigliata, per capire cosa ti serve davvero, quali pagine tenere, che colori, caratteri e nome vuoi. Ogni scelta la vedi subito nel browser. Alla fine prepara vault, configurazione e tema, costruisce quello che manca, e ti lascia una guida di una pagina fatta sul tuo modo di usarla.

Le tue scelte restano in `PERSONALIZZAZIONE.md`, solo sul tuo computer: le sessioni dopo di Claude partono da lì.

Colori e caratteri stanno tutti in `public/tema.css`: puoi cambiarli anche a mano.

## Un Second Brain che resta vivo

- **Una chat per ogni parte della tua vita**: Generale, La mia giornata, Come sto andando, Lavoro, Design. Claude te le apre durante l'onboarding; tutte scrivono nel tuo vault.
- **Tre attività automatiche** tengono il vault aggiornato: il pianificatore (ogni due ore), il giro orario (smista e collega quello che arriva) e il **riallineamento**.
- **Riallineamento**: ogni domenica e a fine mese Claude prepara domande sulla tua settimana e sui tuoi obiettivi. Le vedi in Oggi e rispondi nella chat Come sto andando.
- **La piattaforma si adatta a te**: quando visione e obiettivi cambiano, Claude ti propone quali pagine tenere, cosa aggiungere e su cosa concentrare le proposte.

## Cosa c'è

| Percorso | Cosa |
|---|---|
| `server.mjs` | Server: legge e scrive il vault, serve le pagine e le API |
| `calendario.mjs` | Lettura dei calendari iCal |
| `public/` | Le pagine (HTML, CSS, JavaScript senza framework) |
| `strumenti/crea-esempio.mjs` | Crea il vault e i dati di esempio |
| `strumenti/vettori.swift` | Ricerca per significato, con il modello di frasi di Apple (facoltativo, solo Mac) |
| `widget/main.swift` | Finestrella sulla scrivania con i da fare di oggi (facoltativo, solo Mac) |
| `CLAUDE.md` | Istruzioni per Claude, lette a ogni sessione |
| `onboarding/` | I passi dell'onboarding, le domande per ramo, il riferimento per colori e caratteri |
| `.claude/skills/` | Le skill grill-me e grilling, per le domande dell'onboarding |
| `public/tema.css` | Colori e caratteri |
| `modelli/` | `CLAUDE.md` del vault, istruzioni delle tre attività programmate, avvio automatico su Mac |

## Funzioni facoltative

| Funzione | Cosa serve |
|---|---|
| Vocale della sera trascritto sul Mac | `brew install uv ffmpeg`, Mac con chip Apple |
| Calendario in diretta | indirizzi iCal in `config.local.json` |
| Call da Fathom | `fathomApiKey` in `config.local.json`, o il connettore di Claude |
| Push dei progetti da GitHub | `gh` e `gh auth login`. Mac: `brew install gh`. Windows: `winget install --id GitHub.cli` |
| Ricerca per significato nelle lezioni | `swiftc -O strumenti/vettori.swift -o strumenti/vettori` |
| Lettore dei corsi in PDF | `pdftotext` di Poppler. Mac: `brew install poppler`. Windows: `scoop install poppler` o `choco install poppler` |

Le pagine base funzionano su qualsiasi sistema con Node.js, anche Windows e Linux. Bussola trova `gh` e `pdftotext` nelle cartelle solite e nel PATH. Restano solo per macOS: trascrizione dei vocali (Mac con chip Apple), avvisi del sistema, ricerca per significato, widget e avvio automatico.

## Licenza

MIT, vedi [LICENSE](LICENSE). Contiene anche:

- [PDF.js](https://github.com/mozilla/pdf.js) in `public/vendor/pdfjs`, licenza Apache 2.0 (file `LICENSE` nella stessa cartella).
- Le skill grill-me e grilling in `.claude/skills/`, da [mattpocock/skills](https://github.com/mattpocock/skills), licenza MIT (file `LICENSE` nella cartella).
- I caratteri [Inter](https://github.com/rsms/inter) e [Gelasio](https://github.com/SorkinType/Gelasio) in `public/fonts`, licenza SIL Open Font License 1.1.
- Loghi dei servizi nella pagina Impostazioni da [Simple Icons](https://simpleicons.org) (CC0) e Wikimedia Commons. I marchi appartengono ai loro proprietari.
