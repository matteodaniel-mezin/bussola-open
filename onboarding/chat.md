# Le chat per macrocategoria

Ogni macrocategoria di Bussola ha una chat di Claude dove l'utente va a parlare di quella parte della sua vita. Tutte lavorano sullo stesso vault e lo tengono aggiornato: il Second Brain cresce da quello che succede in queste chat.

Apri solo le chat delle macrocategorie che il profilo tiene. Ogni chat parte nella cartella del vault, tranne Design, che parte nella cartella di Bussola.

| Chat | Cartella | A cosa serve |
|---|---|---|
| Generale | vault | Il punto d'ingresso: domande, decisioni, idee che non hanno ancora un posto. Smista verso le altre chat |
| La mia giornata | vault | Oggi, calendario, sera, weekend: organizzare il giorno, spostare cose, chiudere la giornata a parole |
| Come sto andando | vault | Obiettivi, bussola, roadmap, giornate, lezioni, soldi. Qui si risponde al **riallineamento** |
| Lavoro | vault | Contesti, call, progetti. Da qui si aprono le chat dei singoli clienti o progetti, nelle loro cartelle di lavoro |
| Design | cartella di Bussola | Cambiare l'aspetto e le pagine della piattaforma |

## Come aprirle

- **Con lo strumento per avviare sessioni** (nell'app desktop di Claude): una sessione per chat, con il titolo della tabella, la cartella giusta e come primo messaggio il **brief** qui sotto. Chiedi l'ok all'utente prima.
- **Senza**: dai all'utente, per ogni chat, il titolo, la cartella da aprire e il brief da incollare come primo messaggio.

## Il brief (primo messaggio di ogni chat)

Adatta il testo tra `<>` al profilo. Togli le righe delle pagine nascoste.

```
Sei la chat "<Nome>" del mio Second Brain. Lavori nel vault in <percorso del vault>; leggi prima il suo CLAUDE.md,
il mio ritratto in Piano/Vita.md e il mio profilo in <percorso di Bussola>/PERSONALIZZAZIONE.md.
Ti occupi di: <colonna "A cosa serve" della tabella, con le pagine che uso>.
Ogni volta che decidiamo o scopriamo qualcosa, scrivilo subito nel vault nel formato giusto (Piano, Contesti, Diario,
Lezioni o Inbox), così Bussola e le altre chat lo vedono. Quando ti racconto un cambiamento della mia vita, aggiorna Piano/Vita.md. Rispondi in italiano semplice, frasi brevi.
```

Righe in più per chat:

- **Come sto andando**: "Quando `Piano/Riallineamento.md` ha `stato: aperto`, fammi le domande una alla volta con la tua risposta consigliata (skill `grilling` se c'è). Con le mie risposte aggiorna Obiettivi, Bussola, Roadmap e, se è cambiata la mia vita, Vita.md; scrivi le risposte sotto `## Risposte`, metti `stato: fatto` e una nota nel Diario. Poi fai la **modulazione** descritta nel CLAUDE.md di Bussola."
- **Lavoro**: "Per un cliente o progetto con una cartella di lavoro, proponi di aprire una chat dedicata in quella cartella. Quelle chat lasciano le note di fine lavoro in `Inbox`."
- **Design**: "Lavori nella cartella di Bussola e segui la skill design-bussola: colori e caratteri liberi, struttura e componenti di Bussola salvo mia richiesta esplicita. Ogni cambio di aspetto va in `public/tema.css` o `config.local.json`; ogni scelta nuova va nel profilo, sezione `## Aspetto`."

## Fatto quando

Ogni chat tenuta esiste (o l'utente ha titolo, cartella e brief per crearla), e il profilo elenca le chat in `## Cosa è attivo`.
