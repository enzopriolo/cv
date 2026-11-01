# Checkliste: Billard Linien im Google Play Store veröffentlichen

1. **Entwicklerkonto** bei https://play.google.com/console anlegen (einmalig 25 US-Dollar, Identitätsnachweis nötig).
2. **Eigenen Upload-Schlüssel erzeugen** – der Schlüssel `billard.jks` im Repository ist öffentlich und darf für den Store nicht benutzt werden:
   ```
   keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 upload.jks > upload.b64
   ```
   Dann im GitHub-Repository unter *Settings → Secrets and variables → Actions* anlegen:
   `BILLARD_KEYSTORE_BASE64` (Inhalt von upload.b64), `BILLARD_STORE_PASS`, `BILLARD_KEY_ALIAS` (upload), `BILLARD_KEY_PASS`.
   Ab dem nächsten Build wird damit signiert. Die Datei `upload.jks` sicher aufbewahren und **nie** ins Repository legen.
3. **App-Bundle** `BillardLinien.aab` aus dem neuesten GitHub-Release herunterladen und in der Play Console unter *Produktion → Neues Release* hochladen. „Play App-Signatur“ aktiviert lassen.
4. **Paketname** ist `de.enzo.billard` – nach der ersten Veröffentlichung nicht mehr änderbar.
5. **Store-Eintrag** mit den Texten aus `STORE-TEXTE.md` füllen. Bilder liegen bereit: `app-symbol-512.png`, `vorstellungsgrafik-1024x500.png` und die Screenshots in `screenshots/`.
6. **Datenschutzerklärung** aus `DATENSCHUTZ-VORLAGE.md` ergänzen, online stellen und den Link eintragen.
7. **Datensicherheit** (Formular): keine Daten erhoben/geteilt außer im Online-Modus (Spielername und Spielzüge, nicht gespeichert, Übertragung verschlüsselt per WSS).
8. **Inhaltseinstufung** und **Zielgruppe** ausfüllen (keine Werbung, keine Käufe, kein Echtgeld-Glücksspiel).
9. Für neue Entwicklerkonten verlangt Google vor der Produktion einen **geschlossenen Test** mit mindestens 12 Testern über 14 Tage.
10. Für jedes Update muss `versionCode` in `app/build.gradle` steigen (das erledigt der Build bisher von Hand).
