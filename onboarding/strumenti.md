# Strumenti: collegarli e mostrarli

Ogni persona lavora con i suoi strumenti. Bussola mostra in Impostazioni solo quelli, ognuno con la sua icona, e le attività di Claude leggono da lì quello che serve al vault. Non dare per scontato niente: chi non fa call non ha Fathom, chi non scrive codice non ha GitHub.

## 1. L'elenco

Dal ramo Strumenti di `bisogni.md` hai una lista. Completala controllando da solo quello che il computer dice (app installate, programmi come `gh`) e i connettori già attivi in questa sessione di Claude. Per ogni strumento chiedi all'utente una cosa sola: **cosa deve portare nel suo Second Brain** (es. "le call nel Diario", "le scadenze nei da fare", "niente, mi basta vederlo"). Uno strumento che non porta niente si mostra lo stesso, se l'utente lo vuole vedere.

## 2. Collegarlo

In ordine, la prima strada che funziona:

| Strada | Quando | Come |
|---|---|---|
| Già dentro Bussola | Google Calendar, Fathom, GitHub, Google Sheets, Vercel, Supabase, Whisper | `PER-CLAUDE.md`, Passo 6 (iCal, `fathomApiKey`, `gh`, connettori) |
| Connettore di Claude | esiste un connettore ufficiale (cerca nel registro dei connettori se hai lo strumento per farlo) | l'utente lo attiva nelle impostazioni di Claude; tu verifichi che risponda con una lettura di prova |
| Esportazione o file | lo strumento esporta CSV, calendario o note | una cartella dove l'utente salva, letta dal pianificatore |
| Nessuna | niente di quanto sopra | tessera "Da collegare", e lo scrivi nel profilo tra le cose da fare dopo |

Chiavi e token li incolla l'utente in `config.local.json` o nelle impostazioni del connettore: tu indichi dove. Ogni accesso è in sola lettura, salvo che l'utente chieda altro.

Quello che lo strumento porta nel vault lo aggiunge alle istruzioni del pianificatore o del giro orario (`modelli/`), nel formato giusto di `PER-CLAUDE.md`.

## 3. L'icona

1. Cerca l'icona su Simple Icons: `https://cdn.simpleicons.org/<nome>` (nome in minuscolo, senza spazi; per un colore preciso `.../<nome>/<colore esadecimale>`). Se risponde con un SVG, salvalo in `public/loghi/<id>.svg`.
2. Se non c'è, usa l'icona ufficiale dal sito dello strumento (SVG o PNG quadrato), in `public/loghi/`.
3. Se non trovi niente, lascia `logo` vuoto: Bussola mostra l'iniziale.

Gli strumenti già dentro Bussola (`gcal`, `gsheets`, `fathom`, `github`, `vercel`, `supabase`, `openai`, `obsidian`) hanno già l'icona: basta l'`id`.

## 4. La tessera

Aggiungi lo strumento a `strumenti` in `config.local.json`, nell'ordine in cui l'utente li usa di più:

```json
"strumenti": [
  { "id": "gcal", "cosa": "Lezioni e call con i clienti" },
  { "id": "notion", "nome": "Notion", "logo": "/loghi/notion.svg", "cosa": "Appunti dei progetti", "come": "Connettore di Claude", "collegato": true },
  { "id": "canva", "nome": "Canva", "cosa": "Grafiche per i social", "come": "Da collegare: manca il connettore", "collegato": false }
]
```

| Campo | Cosa |
|---|---|
| `id` | nome breve, minuscolo; per gli strumenti già dentro Bussola usa il loro id |
| `nome` | come lo chiama l'utente |
| `logo` | percorso dell'icona in `public/loghi/` |
| `cosa` | a cosa serve **a lui**, in una riga: compare girando la tessera |
| `come` | come è collegato, o cosa manca |
| `collegato` | `false` per la tessera grigia "Da collegare" |

Obsidian compare sempre per primo. Riavvia il server e apri Impostazioni con l'utente.

Fatto quando: ogni strumento dell'elenco ha una tessera con icona, `cosa` scritto nelle parole dell'utente, e uno stato vero (collegato davvero, o "Da collegare" con il motivo).
