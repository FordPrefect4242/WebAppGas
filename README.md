# Web app scrausa per GAS di Fisica

## Inizializzazione
Dopo aver copiato i tre file su un progetto di Google Apps Script, è necessaria la configurazione di un foglio Google Sheet per la gestione della gara stessa. In _Codice.gs_ andrà copiato l'ID del foglio (la parte compresa tra /d/ e / nel link del foglio stesso) nell'apposita costante _SHEET_ID_.

Dovrà avere cinque fogli: _Configurazione_, _Domande_, _Squadre_, _Consegne_, _Jolly_. Il foglio sarà simile a [questo](https://docs.google.com/spreadsheets/d/1MrKE08wfUUzRIfxhscIZJF5LalaXxIt5-n87HuzVKeg/edit?usp=sharing).

In _Configurazione_, impostare i parametri della gara: inizio (con data e ora), durata in minuti, tempo per scegliere il jolly in minuti. I parametri E, A, h sono quelli del regolamento ufficiale. Il [link](https://docs.google.com/spreadsheets/d/1MrKE08wfUUzRIfxhscIZJF5LalaXxIt5-n87HuzVKeg/edit?usp=sharing) precedente fornisce una guida.

In _Domande_, riportare il numero del problema nella colonna _ID_Problema_: _**è importante inserire le domande in righe consecutive e usare come ID i numeri da 1 a #(numero_domande)**_. <br>
Se si ha tempo e voglia, si può aggiungere il testo nell'apposita colonna: non ho implementato alcuna funzionalità che usi questo input. _Valore_ ed _Esponente_ (sempre nel foglio domande) si riferiscono alla parte numerica e all'esponente di 10 della soluzione al problema specificato espressa in notazione scientifica;
in teoria, non è un problema non usare la notazione scientifica (il codice dovrebbe funzionare ugualmente). <br>
Nello stesso foglio, la colonna _Precisione_ e _PB_ si riferiscono ai parametri di precisione e punteggio base dello specifico problema. Secondo il regolamento ufficiale PB è sempre pari a 30.

In _Squadre_ inserire il nome della squadra (usato nella classifica) e un ID univoco che può essere un numero a piacere (necessario per l'accesso)

_Consegne_ e _Jolly_ saranno compilati automaticamente durante la gara. È possibile inserire le intestazioni delle colonne prima dell'inizio della competizione per una migliore leggibilità. <br>
Questo è il luogo in cui correggere eventuali errori di battitura durante le consegne. Se, ad esempio, la squadra con ID 1 digita la risposta 3 invece di 4, è possibile eliminare la riga (non so come si comporti il codice in caso di righe vuote) o cambiarne i valori. Similmente con i jolly.

___
## Per la gara
Eseguendo il deployment dell'app, si ottiene il link di accesso che dovrebbe terminare con `/exec`. Questo non funziona. Per accedere alla classifica, sostituire tale stringa con `/exec?view=classifica`.

Per la consegna delle risposte, ogni squadra avrà il proprio link ottenuto sostituendo `/exec` con `/exec?teamId=` seguito dal numero indicato nel relativo foglio di Sheet. <br>
<img width="585" height="456" alt="image" src="https://github.com/user-attachments/assets/649dab68-b85d-4288-af2f-5ad093f357a8" />

Nella pagina di consegna, i campi per il numero del problema (per jolly e risposte) accettano unicamente interi da 1 a #(numero_domande) (motivo della restrizione precedente). <br>
Se si desidera consegnare una risposta negativa, selezionare la checkbox a sinistra del segno `-`. Il campo a sinistra di `x 10^` accetta solo valori decimali da 1 a 9.999 (teoricamente, punto o virgola è indifferente) con 4 cifre significative (che corrispondono quindi alla parte numerica); il campo a destra indica l'esponente di 10 della soluzione in notazione scientifica, che è, quindi, intero.

___
## Eventuali problemi
Se i link non funzionano, provare a digitare manualmente la parte con `/exec`: è possibile che si stiano scrivendo spazi col normale copia-incolla.
A volte, anche col formato di consegna corretto, la risposta non era accettata. Il bug **non** è stato risolto. Se accade, si consiglia di non inserire punti o virgole per numeri che dovrebbero essere interi e di digitare tutte le 4 cifre significative quando richiesto; in alternativa si possono usare le frecce a lato del campo di inserimento (da implementare bene nel caso di smartphone).
Se la risposta è giusta ma è segnata sbagliata, controllare di aver consegnato con la checkbox `-` abilitata solo se la soluzione è negativa.
