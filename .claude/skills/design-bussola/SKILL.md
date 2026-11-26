---
name: design-bussola
description: Il manuale di design di Bussola. Usala prima di cambiare l'aspetto della piattaforma o di costruire una pagina, una sezione o un componente nuovo, così il risultato ha lo stesso look a cartoncini del resto.
---

# Design di Bussola

Bussola ha un aspetto riconoscibile: **cartoncini** bianchi su un fondo caldo, titoli con le grazie, barra a sinistra, poche cose per schermata. Ogni Bussola personalizzata deve restare riconoscibile come Bussola.

Il manuale è un **binario**, non un muro:

- **Libero, sempre**: colori e caratteri. Si cambiano in `public/tema.css` (vedi `onboarding/aspetto.md`). Nome, pagine nascoste e saluto in `config.local.json`.
- **Fisso per default**: struttura, posizioni, componenti, misure, comportamento. Le pagine nuove li riusano così come sono.
- **Cambiabile su richiesta**: se l'utente chiede in modo esplicito di cambiare una regola fissa (per esempio "voglio la barra in alto" o "angoli dritti"), fallo. Cambia la regola **dappertutto**, non in una pagina sola, e scrivi la deroga nel profilo (`PERSONALIZZAZIONE.md`, `## Aspetto`), così le sessioni dopo la rispettano.

## Struttura della pagina

| Pezzo | Regola |
|---|---|
| Griglia | `.app`: barra 224px, centro elastico; con un pannello di dettaglio a destra 330px (`.con-dx`) o 400px (`.dx-larga`) |
| Barra a sinistra | `.lato`, sfondo `--lato`: marchio in serif 21px, gruppi in piccolo (`.gruppo`), voci con icona a linee, la voce attiva è un cartoncino bianco con ombra. In fondo la rotta "In linea" |
| Centro | `.centro`: margini 46px sopra, 52px ai lati; contenuto largo al massimo 1112px, mai stirato oltre |
| Testa di pagina | `testa(titolo, sotto, lato)`: titolo in serif 34px (`.saluto`), una riga sotto in `--tenue` 15px, azioni a destra |
| Pannello a destra | `.destra`: sfondo carta, titolo in serif 24px (`.dx-titolo`), dettagli a blocchi |
| Nota in fondo | `.nota-pagina`: da dove vengono i dati, in `.piccolo` |

Ordine dentro il centro: testa, filtri (`.chips`), contenuto, nota in fondo.

## Componenti (riusali, non rifarli)

| Componente | Classe o funzione in `app.js` | Uso |
|---|---|---|
| Cartoncino | `.carta`: carta, raggio 12px, `--ombra` | contenitore di tutto |
| Scheda | `scheda(titolo, lato, dentro)` | cartoncino con titolo serif 19px e nota a destra |
| Righe | `.carta.righe` con `.r` | elenchi: righe alte, linea sottile tra una e l'altra, `.largo` per il testo, `.quando` per date, `.imp` per cifre |
| Pillola | `pillola(testo, tipo)`, `.pill` (`bianca`, `scura`, `verde`, `grigia`) | stati, filtri, azioni secondarie |
| Bottone | `.btn` scuro, `.btn.chiaro` bianco | una sola azione principale per schermata |
| Pallino d'area | `.p` con la classe dell'area | l'area di una cosa, sempre a sinistra del testo |
| Vuoto | `vuotoBello(titolo, testo)` | stato vuoto con titolo serif e una riga che dice cosa fare |
| Numeri | `.numeri` + `.numero` | cifre grandi in serif 28px con etichetta piccola |
| Foglio | `.we-ov` + `.we-foglio` | dettagli sopra la pagina; si chiude con ✕, Esc o clic fuori |
| Due colonne | `.due` (elastica + 400px), `.pila`, `.coppia` | affiancare cartoncini |

## Regole visive

- **Colore**: solo variabili di `tema.css` (`--testo`, `--tenue`, `--lieve`, `--bordo`, `--carta`, le quattro aree…). Un colore nuovo diventa prima una variabile.
- **Aree**: lavoro, gioco, amore, salute hanno sempre il loro colore, e l'area si vede con un pallino o una striscia, mai colorando tutto il testo.
- **Caratteri**: `--serif` per titoli e cifre grandi, `--sans` per tutto il resto. Testo 14px, secondario 12.5-13.5px. Pesi 400 e 500.
- **Spazi**: multipli di 2px; tra cartoncini 12-16px; dentro un cartoncino 16-20px.
- **Angoli**: 12px i cartoncini, 7-10px gli elementi piccoli, pillole tonde.
- **Ombre**: solo `--ombra`, leggera. Niente bordi spessi, niente sfumature colorate, niente bagliori.
- **Densità**: poche cose per schermata. Un elenco lungo mostra quello che entra e poi "Mostra altre", senza scorrimento interno.
- **Testi**: italiano semplice, frasi brevi, niente maiuscolo tutto, niente emoji nelle etichette.
- **Icone**: a linee, disegnate in `ICONE` in `app.js`, nessuna libreria.
- **Movimento**: breve e utile (`--facile`, 120-220ms), mai su azioni ripetute da tastiera; rispetta `prefers-reduced-motion`.
- **Telefono**: sotto gli 820px una colonna sola, la barra sparisce; ogni pagina nuova va provata a 390px.
- **Codice**: niente framework né librerie nuove; HTML in stringhe come nel resto di `app.js`, stili in `app.css`.

## Prima di dire "fatto"

- La pagina nuova o cambiata si apre senza errori nella console, a finestra larga e a 390px.
- Accanto a Oggi e a un'altra pagina sembra la stessa piattaforma: stessa testa, stessi cartoncini, stessi spazi.
- Ogni colore usato viene da una variabile; ogni deroga chiesta dall'utente è nel profilo.
