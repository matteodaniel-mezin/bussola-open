# Bussola

Piattaforma locale (Node, nessuna dipendenza) sopra un Second Brain in Obsidian. Chi ha scaricato questa cartella vuole una versione costruita sulla sua vita: il tuo lavoro qui è l'**onboarding**, poi la manutenzione.

## Prima di tutto: una copia tutta sua

Questa cartella viene dalla repo **originale** (`github.com/matteodaniel-mezin/bussola-open`). L'originale resta com'è: ogni modifica (tema, configurazione, pagine, codice nuovo) vive nella **copia** dell'utente. Prima di cambiare qualsiasi file:

0. La copia passa sempre da **git**: è così che arrivano le novità e che il branch funziona.
   - `git --version` non risponde: con l'ok dell'utente installalo. Mac: `xcode-select --install` (si apre una finestra di Apple: l'utente preme "Installa"). Windows: `winget install --id Git.Git -e`. Linux: il gestore di pacchetti. Aspetta che sia installato prima di andare avanti.
   - La cartella non ha `.git` (scaricata come ZIP o file per file): trasformala in una copia git senza toccare i file, con `git init`, `git remote add originale https://github.com/matteodaniel-mezin/bussola-open.git`, `git fetch originale`, `git reset originale/main` (sposta solo git, i file restano com'erano), `git switch -c mia-bussola`. Quello che l'utente aveva già cambiato compare in `git status`: salvalo con un commit. `config.local.json`, `PERSONALIZZAZIONE.md` e i dati sono in `.gitignore` e restano intatti.
   - Se devi ancora scaricare la repo, usa sempre `git clone https://github.com/matteodaniel-mezin/bussola-open.git`, mai lo ZIP.
1. Se il remote `origin` punta alla repo originale, rinominalo `originale` (`git remote rename origin originale`) e lavora sul branch `mia-bussola` (`git switch -c mia-bussola`).
2. Fai i commit solo su `mia-bussola`. Per salvarla online, con l'ok dell'utente crea una repo **privata** sul suo account GitHub e aggiungila come `origin`.
3. Verso `originale` niente push e niente pull request. Le novità dell'originale si prendono con `git fetch originale` e `git merge originale/main`, solo se l'utente lo chiede.

Fatto quando c'è `.git`, `git remote -v` non ha più `origin` sulla repo originale e `git branch --show-current` dice `mia-bussola`.

Unica eccezione: il proprietario dell'originale (`gh api user --jq .login` risponde `matteodaniel-mezin`) lavora su `main` dell'originale.

All'inizio di ogni sessione leggi `PERSONALIZZAZIONE.md` nella radice:

- **manca**, o ha `stato: in corso`: segui [`onboarding/ONBOARDING.md`](onboarding/ONBOARDING.md), riprendendo dal passo segnato lì. Proponilo all'utente nel primo messaggio, dopo aver risposto a quello che ha chiesto.
- ha `stato: fatto`: è il **profilo** della persona; il suo **ritratto** (cosa fa, con chi, quando, con cosa, in ogni area della vita) è `Piano/Vita.md` nel vault. Ogni scelta che fai (parole, pagine, proposte, codice) parte da lì. Una richiesta che cambia il profilo si chiude aggiornandolo.

## Un Second Brain vivo

Il vault vale solo se si aggiorna. Tre attività programmate lo tengono vivo (pianificatore, giro orario, **riallineamento**: modelli in `modelli/`) e ogni chat scrive nel vault quello che si decide o si scopre, nel formato giusto. Le chat sono una per macrocategoria (Generale, La mia giornata, Come sto andando, Lavoro, Design): [`onboarding/chat.md`](onboarding/chat.md).

Il **riallineamento** è il ritmo con cui la persona controlla la sua direzione: ogni domenica sera e a fine mese l'attività prepara domande in `Piano/Riallineamento.md`, Bussola le mostra in Oggi, e la chat Come sto andando le fa una alla volta con la tua risposta consigliata, poi aggiorna Obiettivi, Bussola, Roadmap e mette `stato: fatto`.

## Modulazione

La piattaforma prende forma dalla **visione** e dagli **obiettivi** della persona (profilo, `## Visione`; `Piano/Bussola.md`, `Piano/Obiettivi.md`). Ogni volta che cambiano, o cambia il ritratto (onboarding, riallineamento, controllo del mese, o l'utente lo dice) fai la modulazione, e proponi le modifiche in un solo giro:

1. **Pagine**: ogni pagina tenuta serve a un obiettivo o alla visione? Proponi cosa nascondere (`nascondi`) e cosa rimettere.
2. **Cose nuove**: un obiettivo che nessuna pagina aiuta a seguire chiede una pagina, una sezione o un'abitudine nuova: proponi come costruirla.
3. **Attività**: priorità del pianificatore (aree, obiettivi del mese, ritmo) e temi del riallineamento allineati ai nuovi obiettivi.
4. **Roadmap e settimana**: tappe e micro-obiettivi coerenti con gli obiettivi nuovi.
5. **Chat**: apri la chat di una macrocategoria diventata importante, proponi di chiudere quella che non serve più.

Con il sì dell'utente applica, poi aggiorna il profilo (`## Visione`, `## Cosa gli serve`, `## Cosa è attivo`).

Sempre:

- Parla la lingua e il registro del profilo: italiano semplice, frasi brevi, finché il profilo non dice altro.
- I fatti li cerchi tu (sistema, programmi, cartelle); le decisioni le prende l'utente, con la tua risposta consigliata.
- Chiavi, token e indirizzi segreti vivono solo in `config.local.json`: li incolla l'utente, tu indichi dove.
- Chiedi l'ok prima di installare programmi, creare attività programmate o scrivere fuori da questa cartella e dal vault.
- Formati dei file del vault, pagine, configurazione e installazione: [`PER-CLAUDE.md`](PER-CLAUDE.md). I formati li legge un programma: rispettali alla lettera.
