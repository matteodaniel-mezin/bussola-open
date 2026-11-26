# Aspetto: riferimento

Il binario è la skill **design-bussola**: qui si scelgono colori, caratteri e nome; struttura, cartoncini e posizioni restano quelli del manuale, salvo che l'utente chieda esplicitamente altro.

## Dove si cambia

| Cosa | Dove |
|---|---|
| colori, caratteri, ombra | `public/tema.css` (variabili su `:root`, commentate) |
| nome della piattaforma | `titolo` in `config.local.json` |
| nome nel saluto | `nome` in `config.local.json` |
| pagine nella barra | `nascondi` in `config.local.json` |
| densità, misure | regole in `public/app.css`; aggiungi le correzioni in fondo a `tema.css` |

Dopo un cambio a `tema.css` basta ricaricare la pagina; dopo un cambio a `config.local.json` riavvia il server.

Alcuni colori minori sono scritti direttamente in `public/app.css`. Per un tema scuro o molto diverso trovali con `grep -n "#[0-9a-fA-F]\{3,6\}" public/app.css`, sostituiscili con variabili di `tema.css` e controlla tutte le pagine tenute.

## Come proporre

Parti dalle tre parole dell'atmosfera. Per ogni scelta proponi 2-3 opzioni concrete coerenti con quelle parole, con i valori, e indica la consigliata. Applica la consigliata subito, così la prima cosa che vede è già vicina al risultato.

Palette di partenza (fondo, barra, carta, testo):

| Nome | Atmosfera | `--fondo` | `--lato` | `--carta` | `--testo` |
|---|---|---|---|---|---|
| Carta calda (attuale) | calma, quaderno | `#f6f4f0` | `#efece6` | `#ffffff` | `#1f1d1a` |
| Nebbia | pulita, fredda | `#f3f5f8` | `#e9edf2` | `#ffffff` | `#18202a` |
| Salvia | morbida, naturale | `#f2f4ef` | `#e7ebe2` | `#fcfdfb` | `#1d231b` |
| Notte | concentrata, sera | `#16171a` | `#1d1f23` | `#23262b` | `#ece9e4` |

Coppie di caratteri (titoli + testo), tutte su Google Fonts:

| Coppia | Atmosfera |
|---|---|
| Gelasio + Inter (attuale, già in `public/fonts`) | classica, da quaderno |
| Fraunces + Inter | calda, con carattere |
| DM Serif Display + DM Sans | elegante |
| Space Grotesk + Inter | moderna, tecnica |
| Nunito + Nunito | morbida, amichevole |

Per un carattere di Google Fonts: `@import` in cima a `tema.css` e nome in `--serif` / `--sans`. Se l'utente vuole tutto offline, scarica il `.woff2` in `public/fonts/` con il suo ok e aggiungi un `@font-face`.

## Controlli prima di mostrare

- Testo su fondo e su carta: contrasto almeno 4,5:1; `--tenue` almeno 3:1.
- Le quattro aree si distinguono tra loro anche per chi confonde rosso e verde: cambia anche la luminosità, non solo la tinta.
- `--salute` è anche il colore di "in linea" e dei pulsanti positivi; `--attento` degli avvisi.
- Guarda Oggi, Giornate e una pagina con molte righe (Contesti o Lezioni) a finestra larga e stretta.
