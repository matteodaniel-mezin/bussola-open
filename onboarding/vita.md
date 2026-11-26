# Il ritratto della vita

Prima di decidere pagine e strumenti, Claude conosce la persona: cosa fa, con chi, perché, quando, con cosa, in ognuna delle quattro aree. Il risultato è il **ritratto**, `Piano/Vita.md` nel suo vault: la base da cui partono pianificatore, riallineamento, chat e ogni proposta.

## Come si fa

- Un'area alla volta, con `grilling`: giri di domande numerate, ognuna con la tua risposta consigliata quando puoi indovinarla da quello che sai già. Il giro dopo scende nei dettagli di quello che ha risposto.
- Parti dalle domande della **cornice** (uguale per tutte le aree), poi apri i **rami** dell'area che le risposte rendono pertinenti. Chi non ha un partner non riceve domande sulla coppia; chi è studente riceve quelle sullo studio.
- Scendi finché una risposta basta a pianificare una settimana: non "faccio sport", ma "corsa martedì e giovedì alle 18:30, 5 km, da solo, al parco".
- Amore e salute sono personali: all'inizio dell'area di' che può saltare qualsiasi domanda e che tutto resta sul suo computer. "Preferisco non dirlo" è una risposta completa.
- Percorso **rapido**: solo la cornice, un giro per area. Percorso **completo**: cornice e rami, finché ogni risposta è concreta.

## La cornice (per ogni area)

| Domanda | Cosa cerchi |
|---|---|
| **Cosa** | le attività di quest'area, una per una |
| **Con chi** | le persone, con nome e ruolo (come le chiama lui) |
| **Perché** | cosa gli dà, perché ci tiene |
| **Quando** | giorni, orari, frequenza, stagioni; cosa è fisso e cosa cambia |
| **Dove** | casa, ufficio, fuori, a distanza |
| **Con cosa** | strumenti, app, oggetti, abbonamenti |
| **Come va** | voto da 1 a 5, cosa funziona, cosa no |
| **Cosa vorrebbe** | tra 3 mesi e tra 2 anni |
| **Cosa lo ferma** | tempo, soldi, energia, altre persone, abitudini |
| **Come se ne accorge** | il segnale che quest'area va bene (serve al riallineamento) |

## I rami per area

### Lavoro (e studio)

- Che lavoro fa: dipendente, in proprio, studente, imprenditore, più cose insieme. Ruolo, settore, da quanto.
- Per chi: azienda, capo, colleghi, clienti uno per uno (nome, cosa fa per loro, da quando, quanto vale, prossimo passo).
- Progetti in corso: nome, scadenza, a che punto è, chi aspetta cosa.
- Orari: giorni di lavoro, inizio e fine, pause, quando rende di più, quando si spegne. Weekend e ferie.
- Dove: casa, ufficio, coworking, in giro; spostamenti e tempi.
- Comunicazione: email, chat, telefono, riunioni ricorrenti (giorno e ora), call con clienti (le registra?).
- Strumenti: per scrivere, progettare, programmare, vendere, fatturare, organizzarsi (ramo Strumenti di `bisogni.md`).
- Soldi del lavoro: come guadagna (stipendio, canoni, progetti), quanto vorrebbe al mese, scadenze fiscali.
- Studio: corsi, esami, date, materie, come studia, quanto tempo a settimana.
- Cosa vorrebbe cambiare: clienti nuovi, meno ore, un altro lavoro, imparare qualcosa.

### Gioco

- Cosa lo diverte: hobby, sport per piacere, musica, giochi, lettura, serie, creatività, viaggi, uscite.
- Con chi e quanto spesso; cosa fa da solo e cosa in compagnia.
- Quando: sere, weekend, vacanze; quanto tempo libero ha davvero in una settimana normale.
- Cosa lo ricarica e cosa invece lo svuota pur sembrando svago (es. scorrere il telefono).
- Budget per il tempo libero.
- Cosa ha smesso di fare e gli manca; cosa vorrebbe provare.
- Prossimi eventi, viaggi, concerti con data.

### Amore (famiglia, coppia, amici)

- Con chi vive. Partner: da quanto, cosa fate insieme, momenti fissi.
- Famiglia: chi sente e vede, quanto spesso, distanze, impegni (genitori da aiutare, figli e loro orari).
- Amici: il gruppo stretto, come vi vedete, ogni quanto, chi gli manca.
- Date importanti: compleanni, anniversari, ricorrenze (con il suo ok, entrano nel calendario o nelle abitudini).
- Cosa vorrebbe di più o di diverso; persone che vorrebbe sentire più spesso.
- Cosa toglie tempo a quest'area.

### Salute

- Sonno: a che ora va a letto e si sveglia, nei giorni di lavoro e nel weekend; come dorme.
- Movimento: sport, allenamenti (giorni, ore, dove, con chi, scheda o personal trainer), passi, camminate.
- Cibo: pasti, orari, chi cucina, una dieta o un obiettivo (solo se ne vuole parlare).
- Energia nella giornata: quando è al massimo, quando cala, caffè, pause.
- Testa: stress, umore, cosa lo aiuta (meditazione, terapia, scrittura), cosa lo appesantisce.
- Cure e controlli: visite fisse, farmaci da ricordare, solo se vuole che Bussola lo aiuti a ricordarli.
- Abitudini da costruire e da togliere.

## Trasversale (alla fine)

- Una giornata tipo, dalla sveglia al letto, in un giorno di lavoro e in un giorno libero.
- Dove si perde il tempo; cosa vorrebbe automatizzare.
- Come preferisce ricevere le proposte: tante e piccole, poche e grandi; la mattina, la sera prima.

## Il file `Piano/Vita.md`

```
---
tipo: vita
aggiornato: AAAA-MM-GG
---
# Vita

## Lavoro
Cosa, con chi, perché, quando, dove, con cosa, come va (N/5), cosa vorrebbe, cosa lo ferma, come se ne accorge.
Righe brevi, una informazione per riga, nelle sue parole.

## Gioco
## Amore
## Salute
## Giornata tipo
## Come vuole le proposte
```

Per ogni area tieni la cornice nello stesso ordine, così chi legge trova subito "quando" o "con chi". I clienti e i progetti hanno anche la loro nota in `Contesti`; le persone importanti vanno nelle note di `Contesti` solo con il suo ok.

Fatto quando: ogni area ha una risposta per ogni domanda della cornice (o "preferisce non dirlo"), le risposte sono concrete abbastanza da pianificare una settimana, e l'utente ha letto il ritratto e detto che è lui.
