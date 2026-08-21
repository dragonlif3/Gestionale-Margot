# 🍷 Gestionale Margot

Benvenuto nel repository del Gestionale Margot! Questo documento ti guiderà nei passaggi fondamentali per scaricare il codice, lavorarci e salvare le tue modifiche usando Git.

---

## 🛠 1. Prima configurazione (Da fare solo la prima volta)

Per iniziare a lavorare, devi scaricare (clonare) il progetto sul tuo computer. 
Apri il terminale, spostati nella cartella dove vuoi salvare il progetto e lancia:

git clone [https://github.com/dragonlif3/Gestionale-Margot.git](https://github.com/dragonlif3/Gestionale-Margot.git)

Una volta scaricato, entra nella cartella del progetto:

cd Gestionale-Margot

🔄 2. Prima di iniziare a lavorare (Sempre!)
Prima di scrivere anche solo una riga di codice, assicurati sempre di avere l'ultima versione disponibile online (magari qualcun altro ha fatto delle modifiche).
Dal terminale, esegui:

git pull

💾 3. Come salvare e caricare le tue modifiche
Hai lavorato al codice, tutto funziona e vuoi salvare il tuo lavoro su GitHub? Segui questi 3 passaggi in ordine:

A. Prepara tutti i file modificati
Questo comando dice a Git di tenere traccia di tutte le novità:

git add .

B. Crea il "pacchetto" di salvataggio (Commit)
Dai un nome al tuo salvataggio. Cerca di essere descrittivo (es. "Risolto bug login" oppure "Aggiunta pagina calendario").

git commit -m "Scrivi qui cosa hai modificato"

C. Manda tutto online (Push)
Carica effettivamente il tuo salvataggio su GitHub:

git push

🚨 Regole d'oro per evitare disastri
Non caricare mai dati sensibili: Il file .env (che contiene le password o chiavi segrete) e il file del database (GM.db) sono ignorati di default. Non forzare mai il loro caricamento online.

Se il comando git push ti restituisce un errore, probabilmente qualcun altro ha modificato il codice prima di te. Fai un git pull per scaricare le sue modifiche, risolvi eventuali conflitti e poi riprova a fare git push.

---

## 🚀 4. Installazione e Avvio del Progetto

Per far funzionare il gestionale sul tuo computer, assicurati di avere installato **Node.js**. Dopodiché, segui questi passaggi:

**A. Installa le dipendenze**
Apri il terminale nella cartella principale del progetto e scarica tutti i pacchetti necessari eseguendo:
```bash
npm install
(Nota: se il frontend e il backend sono in due cartelle separate come client e server, ricordati di eseguire questo comando dentro entrambe le cartelle!)

B. Configura il tuo Indirizzo IP locale (FONDAMENTALE)
Per far sì che il gestionale sia raggiungibile dal tuo smartphone o da altri dispositivi sulla stessa rete Wi-Fi, il codice deve conoscere il tuo indirizzo IP locale (ad esempio 192.168.1.x).
Puoi trovare il tuo IP digitando ipconfig (su Windows) o ifconfig (su Mac) nel terminale.

Una volta trovato il tuo IP, devi inserirlo in due punti esatti del codice:

Nel Backend (index.mjs): Cerca l'elenco allowedOrigins e sostituisci l'IP presente con il tuo, ricordandoti di mantenere la porta :5173. Questo permette al server di accettare le richieste in entrata.

Nel Frontend (config.js): Cerca la variabile API_URL e sostituisci l'IP di fallback con il tuo, mantenendo la porta :3000. Questo dice a React dove andare a bussare per trovare i dati.

C. Avvia il Backend (Database e API)
Dal terminale (nella cartella del server), lancia questo comando per accendere il motore del gestionale:

Bash
npm run dev
D. Avvia il Frontend (Interfaccia React)
Apri un nuovo terminale (senza chiudere quello del backend!), spostati nella cartella del frontend e accendi il sito esponendolo alla rete locale:

Bash
npm run dev -- --host
(L'aggiunta di --host è obbligatoria, altrimenti il sito rimarrà bloccato solo all'interno del tuo PC!)

A questo punto, il terminale ti mostrerà un indirizzo web (tipo http://192.168.1.x:5173). Digitalo sul browser del PC o del telefono e... benvenuto nel Gestionale Margot! 🍷


In questo modo, chiunque metta le mani sul codice saprà esattamente come configurarlo in meno di 5 minuti. È un readme da manuale!
