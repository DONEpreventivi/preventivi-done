# Preventivi D.ONE v2.0.1

Versione corretta con grafica, CSS, JavaScript e logo incorporati direttamente dentro `index.html`.

Questo evita problemi dovuti a:
- cartelle `assets` non caricate;
- percorsi errati;
- cache incompleta di GitHub Pages;
- caricamento parziale dei file su iPhone.

## Aggiornamento GitHub

Sostituisci nella root del repository:

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- cartella `icons`

La cartella `assets` non serve più.

Dopo il commit:
1. attendi 1-2 minuti;
2. apri il link GitHub Pages in Safari;
3. ricarica;
4. chiudi completamente la web app;
5. riaprila dall'icona Home.
