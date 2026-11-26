# Bussola: guida per te

Bussola è una pagina che si apre nel browser, sul tuo computer. Ti aiuta a vedere la tua giornata, a capire come stai andando e a tenere in ordine il lavoro. Tutto quello che scrivi finisce in un taccuino di Obsidian, in file che puoi leggere anche da solo.

Claude lavora in silenzio dietro le quinte: ogni tanto legge il taccuino e ti propone cose da fare, dà un voto alle giornate, ti dice se sei sulla rotta. Tu scegli sempre: niente entra nei tuoi da fare senza il tuo sì.

## Come si apre

Vai su `http://localhost:4321` nel browser. Se non si apre, il server è spento: chiedi a Claude di avviarlo, oppure apri il Terminale nella cartella di Bussola e scrivi `node server.mjs`.

La prima volta Bussola ti fa quattro domande: perché lavori, cosa conta nella tua vita, e i tuoi obiettivi a 2 anni, a 6 mesi e per questo mese. Rispondi con parole tue, anche brevi. Da lì nasce tutto il resto.

## Le quattro aree

Ogni cosa appartiene a un'area, con il suo colore:

- **lavoro** (blu): clienti, studio, carriera
- **gioco** (giallo): divertimento, hobby, uscite
- **amore** (rosso): famiglia, amici, coppia
- **salute** (verde): sport, sonno, cibo

Servono a vedere se la tua vita è in equilibrio, o se un'area è ferma da settimane.

## Le pagine

### La mia giornata

**Oggi.** La pagina principale. Ci sono:
- i tuoi da fare, divisi in Mattina, Pomeriggio, Sera e Quando vuoi. Un clic sul cerchio li spunta;
- "Claude propone": idee per oggi. Premi "Aggiungi" per metterle nei da fare, o la × per scartarle;
- a destra la tua agenda, ora per ora;
- in fondo "Chiudi la giornata": un voto da 1 a 5 e due righe su com'è andata.

Per aggiungere un da fare premi `N`, oppure "+ Aggiungi". Puoi scrivere l'ora e la durata nel testo, per esempio "Dentista 15:30 1h": Bussola le capisce da sola. Le cose non fatte ieri tornano oggi. Le abitudini (per esempio "camminata di 20 minuti") compaiono ogni giorno da sole.

**Calendario.** Il mese intero, con i tuoi impegni e i da fare che hanno un'ora. Un clic su un giorno lo apre. Si legge soltanto: gli impegni li cambi nel tuo calendario di sempre. Se un impegno di oggi o di domani cambia, Bussola te lo dice subito con un avviso.

**Vocale della sera.** Premi il pulsante e rispondi a voce a cinque domande: cosa ho fatto oggi, cosa è andato bene, cosa è andato male, cosa ho imparato, cosa cambio domani. Bastano un paio di minuti. Il Mac trascrive l'audio da solo, senza mandarlo su internet. Claude poi legge il testo, dà il voto alla giornata e aggiunge le cose fatte che non avevi segnato.

**Weekend.** Claude ti propone cose da fare nel fine settimana, lontano dallo schermo, partendo da quello che ti piace. Ogni proposta ha quando, con chi, dove e quanto costa; "Tutti i dettagli" mostra il resto. Rispondi "Sì, organizzala" o "No". Claude non prenota e non compra niente: con il sì controlla i dettagli e te li prepara.

### Come sto andando

**Obiettivi.** In alto la tua bussola: perché lavori e cosa conta. Poi la roadmap, una linea del tempo con le tappe verso il tuo traguardo. Sotto gli obiettivi a 2 anni, 6 mesi e del mese, e i micro-obiettivi di questa settimana. All'inizio di ogni mese Bussola ti chiede di rivedere gli obiettivi: bastano cinque minuti.

**Giornate.** Il voto di ogni giorno, in un calendario. Più è scuro, più la giornata è andata bene. A destra Claude ti dice cosa hanno in comune i tuoi giorni migliori, una cosa da cambiare, come vanno le quattro aree e se sei "in linea". Se il voto di un giorno non ti torna, cliccalo e cambialo.

**Lezioni.** Le cose che hai imparato, scritte in modo che valgano anche altrove. Claude te le propone dalle tue call, giornate e vocali; tu scegli "Tienila", "Aggiungi" (a una lezione che c'è già) o "No". In cima c'è quello che stai studiando: premi "Studia" per leggere il corso e metti il segnalibro dove sei arrivato. Il campo "Cerca…" trova una lezione anche se non ricordi le parole esatte.

**Soldi.** Entrate, uscite, spese fisse e quanto ti resta, letti dal tuo foglio dei conti. Qui si guarda soltanto.

### Lavoro

**Contesti.** Un contesto è un cliente, un progetto o una persona con cui lavori. Per ognuno vedi a che punto è e il prossimo passo. Dal menu sotto il nome scegli se è Attivo, In attesa o Archiviato. Nella colonna Soldi puoi segnare quanto ti paga al mese e quanto hai incassato.

**Call.** Le call in arrivo e quelle fatte. Per ognuna: com'è andata in breve, cosa hai fatto bene, cosa migliorare, gli impegni presi e le lezioni. Se usi Fathom, c'è anche la registrazione con il suo riassunto.

**Progetti.** I tuoi progetti digitali: dov'è il codice, dov'è online, dov'è il database, quando ci hai lavorato l'ultima volta.

### Altro

**Impostazioni.** Da dove arrivano i dati: Obsidian, calendario, foglio dei soldi, Fathom e gli altri. Una tessera verde vuol dire collegato. Cliccala per sapere cosa fa.

In fondo alla barra a sinistra c'è la **rotta**: "In linea" se le tue giornate vanno verso i tuoi obiettivi, "Stai deviando" se no. Passaci sopra per leggere il perché.

## Come si usa

### La mattina (2 minuti)

1. Apri **Oggi**.
2. Guarda "Claude propone": aggiungi quello che ha senso, scarta il resto.
3. Guarda l'agenda a destra. Se c'è troppo, sposta qualcosa.

### Durante il giorno

- Spunta quello che fai.
- Ti viene in mente una cosa? Premi `N` e scrivila. Non serve metterla in ordine.

### La sera (3 minuti)

1. Registra il **Vocale della sera**, oppure premi "Chiudi la giornata" e scrivi due righe.
2. Dai un voto da 1 a 5. Se non lo fai, lo dà Claude, e puoi sempre cambiarlo.

### Una volta a settimana (10 minuti, per esempio la domenica)

1. Apri **Giornate**: guarda i voti e leggi "Una cosa da cambiare".
2. Apri **Lezioni** e decidi cosa tenere.
3. Apri **Weekend** se ti serve un'idea.
4. Apri **Obiettivi** e guarda i micro-obiettivi della settimana che arriva.

### Una volta al mese

Quando Bussola te lo chiede, rivedi gli obiettivi: cosa è fatto, cosa cambia, cosa togli.

## Domande frequenti

**Dove sono i miei dati?** Nel taccuino di Obsidian, sul tuo computer. Puoi aprirlo e leggerlo quando vuoi. Bussola non manda niente su internet.

**Posso scrivere direttamente in Obsidian?** Sì. Bussola si aggiorna da sola entro mezzo minuto. Rispetta però la forma dei file: per esempio, un da fare è una riga che inizia con `- [ ]`.

**Ho sbagliato a spuntare.** Clicca di nuovo: si toglie la spunta.

**La pagina non cambia.** Bussola si aggiorna da sola, ma aspetta se stai scrivendo o hai qualcosa aperto. Chiudi e riapri la pagina.

**Le proposte di Claude non arrivano.** Claude lavora solo con il computer acceso e l'app Claude aperta, ogni due ore.
