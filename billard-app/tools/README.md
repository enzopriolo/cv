# Generator für die Herausforderungen

Erzeugt die 90 Herausforderungen (6 Themen × 15) mit der echten Spielphysik.
Jedes Level wird mit seinen endgültigen, gerundeten Werten erneut simuliert und
nur übernommen, wenn der gespeicherte Lösungsweg (`sol`) es wirklich schafft.

    cp ../app/src/main/assets/index.html base.html
    node run.js 0,1,2,3,4,5    # schreibt topic0.json … topic5.json

Benötigt Node.js und Playwright (Chromium).
