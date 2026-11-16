# ICE 1 – Demo

Starten: `Start.cmd`, anschließend im Anzeigenmenü **ICE 1** wählen.
Direktlink: http://localhost:8787/?display=ice1

Zwei getrennte Displayflächen nach dem Referenzbild: Geschwindigkeit von 0 bis 400 km/h links, Zug-/Bremskraft rechts (Fahren 0–50 kN, Bremsen 0–150 kN). LZB-Zielgeschwindigkeit, zulässige Geschwindigkeit, Zielentfernung und B-Leuchtmelder sind über die Demo verfügbar. Die Uhrzeit läuft auf beiden Displays synchron.

Unter Einstellungen lassen sich im Demo-Modus Geschwindigkeit, Kraft und LZB verändern. Für Live im Quellenmenü **TSW Live – nur lesen** auswählen. Nach einer Codeänderung den lokalen Server neu starten und die Seite neu laden. Der zuletzt verwendete Quellenmodus wird gespeichert.

Der eigene Endpunkt `/api/state?profile=ice1` fragt den aktuellen ICE 1 / BR 401 ab und besitzt einen getrennten Cache. Klasse und VehicleID werden vor und nach der Messung geprüft. Es werden ausschließlich GET-Abfragen verwendet. Fehlende, ungültige und über fünf Sekunden alte Werte bleiben ausgeblendet. Die Fahrzeugerkennung anhand des Klassennamens und die Zuordnungen sind vorläufig.

Die benannten Verträge für Kraft, Sifa, PZB und LZB stammen aus der vorhandenen Anbindung und sind noch nicht am ICE 1 bestätigt. Ein gleich aufgebautes Antwortformat beweist insbesondere nicht, dass Kraftwerte dieselbe Bezugsgröße haben. Die Kraftnadel ist auf die sichtbare Skala begrenzt; der Zahlenwert zeigt den vollständigen Messwert. Geschwindigkeit wird von m/s in km/h und Kraft von N in kN umgerechnet.

Unter Einstellungen **ICE-1-Diagnose herunterladen** wählen. Die Diagnose enthält Fahrzeugklasse, ausgewählte Messpfade, Werte und fehlende Zuordnungen; keinen API-Schlüssel, Benutzerpfad oder VehicleID. Beim ersten Abfragen unbekannter Pfade kann der Scan länger dauern. Nicht erreichbare optionale Pfade werden 30 Sekunden zwischengespeichert. Bei unbekannter Fahrzeugklasse wird sie in der Diagnose genannt, ohne fremde Instrumentenwerte zu übernehmen.

PZB-Leuchtmelder (55/70/85, 1000 Hz, 500 Hz, Befehl 40) liegen auf dem linken Display. Die Sifa-Meldung erscheint rechts unter der Kraftanzeige. In den Demo-Einstellungen sind Zugart, Blinken, Überwachungsmelder und Sifa einzeln schaltbar. Die genaue Melderanordnung ist vorläufig, da das Referenzbild diese Meldungen nicht eingeschaltet zeigt.

## Komponenten-Diagnose

Die erste echte ICE-1-Diagnose für `RVM_NWB_DB_ICE1_401_0_C` bestätigt Geschwindigkeit und Spielzeit. Sämtliche ursprünglich abgefragten BR-101-Komponenten für Sifa, Kraft, LZB und Leuchtmelder sind dort nicht verfügbar. Die Komponentenaufnahme belegt stattdessen `LZB_Service` sowie `Simulation/ForceNSummarized.Result`. Der Adapter verwendet jetzt diese ICE-1-Pfade. Die B-Leuchte liest `LZB_Service.Property.bIsReady` unabhängig vom aktiven LZB-Zustand. Feldantworten und Kraftbezugsgröße müssen nach dieser Änderung noch im Spiel verglichen werden. Sifa und die PZB-Leuchtmelder bleiben bis zur belegten Zuordnung unbekannt.

Der Diagnoseknopf erstellt nun `rheinrail-ice1-komponenten.json`. Dafür nach dem Update den Server neu starten, die Seite neu laden und im ICE 1 sitzen bleiben. Die Abfrage liest `/list`-Metadaten des Fahrzeugs und relevanter Unterkomponenten sowie ausgewählte dort gelistete Messwerte. Sie ist auf 80 Komponenten, 160 Messpfade und ungefähr 18 Sekunden begrenzt. Grenzen oder fehlende Listen werden im Bericht genannt. Es werden keine beliebigen Fahrzeugfunktionen aufgerufen; nur ausdrücklich freigegebene Getter. Aus Antworten werden ausschließlich Zahlen und boolesche Werte übernommen. Der Bericht enthält keine VehicleID oder API-Schlüssel.

Schema 3 priorisiert die gelisteten LZB-/PZB-Getter, Kraftdaten und die zusätzlichen Display-Komponenten `DD_Service` und `DD_DataStore`. Bedienknöpfe werden nicht mehr rekursiv abgefragt. Verschachtelte numerische/boolesche Antworten werden begrenzt erhalten. Ein Sifa-Pedalzustand oder „Sifa aktiv“ wird ausdrücklich nicht als Sifa-Warnleuchte interpretiert.

## Abgleich mit BR 101 Expert

BR 101 und ICE 1 verwenden denselben authentifizierten `request`-Leser und die gemeinsame Funktion `readMappedField`. ICE 1 verwendet deshalb dieselben Standardzeitlimits und denselben Wiederholungsversuch bei Verbindungsfehlern wie die 101. Fehlende Messwerte werden bei jeder neuen Messung erneut versucht; nur die Display-Komponentenliste wird 30 Sekunden pro Fahrzeugidentität zwischengespeichert. Die ICE-1-Messung prüft zusätzlich Klasse und VehicleID am Ende.

Der ICE-1-Adapter liest die tatsächlich angebotenen, nicht schreibbaren Properties von `DD_Service` und `DD_DataStore`. Exakte 101-Flags verwenden dieselbe Active-/Flashing-/Inhibited-Ableitung wie die 101. Eindeutig benannte direkte Leuchtmelder (beispielsweise `LM_85` oder `SifaWarning`) werden als boolesche Anzeigezustände übernommen. Diese Aliasnamen sind unterstützte Verträge, keine Behauptung über bislang ungesehene Display-Properties. Stimmen sie nicht mit den tatsächlichen Display-Endpunkten überein, bleiben die betreffenden Anzeigen unbekannt. Widersprüchliche Werte werden ebenfalls nicht angezeigt. Die Diagnose enthält die verfügbaren Property-Namen für eine anschließende präzise Zuordnung.

Automatisierte Tests prüfen die aufgezeichneten Komponentenpfade, synthetische Display-Antworten, fehlende Endpunkte, erneute Abfragen und Fahrzeugwechsel. Die physikalische Kraftskalierung und der vollständige In-Game-Abgleich der Sifa-/PZB-Properties stehen weiterhin aus.
