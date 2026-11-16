# ICE T

Eigener Reiter nach Referenzbild: Tacho 0–240 km/h in 20er-Schritten, links LZB/PZB, rechts Fahren/Bremsen in Prozent, GNT und Sifa. Untere Menüreiter und nicht bedienbare Pfeiltasten sind weggelassen. Ungeklärte Zahlen aus der Referenz werden nicht als Live-Messwerte fest eingebaut.

Demo und Live sind im Quellenmenü auswählbar. GNT besitzt einen eigenen Demo-Schalter. Ausgeschaltete Demo-LZB blendet Zielwerte, B und die LZB-Beschriftung aus. Der numerische LZB-Entfernungswert bleibt oberhalb der 4000-m-Balkenskala vollständig erhalten.

Der Live-Endpunkt `/api/state?profile=icet` hat einen eigenen Cache. Die Fahrzeugerkennung umfasst ICE T, BR 411 und BR 415. Die vorhandene gemeinsame ICE-Datenanbindung fragt nur angebotene lesende LZB- und Display-Endpunkte ab. GNT wird ausschließlich aus einer benannten GNT-Leuchte gelesen, nicht aus einem geschätzten Neigetechnikzustand. Die Prozentanzeige verwendet dieselben ausdrücklich benannten Prozentverträge wie der ICE 3. Fehlende Zuordnungen bleiben leer.

Die Live-Feldnamen des konkreten ICE T sind noch im Spiel abzugleichen. Unter Einstellungen liefert die ICE-T-Komponenten-Diagnose eine JSON-Datei mit Komponenten und aktueller Messdiagnose. Nach dem Update den Server neu starten und die Seite neu laden.

Die GNT-Suche berücksichtigt zusätzlich Fahrzeug-Properties, `MFA_Indicators` und angebotene GNT-Unterkomponenten. Eindeutige Lampenbezeichnungen werden gelesen; `GNT_IsActive`/Flashing/Inhibited werden nur im Kontext einer Anzeige- oder Melderkomponente verarbeitet. Ein allgemeines `GNT_Service.IsActive` ist kein belegter Leuchtmelder und wird nicht dafür verwendet. Im Datenstatus wird GNT separat als aktiv, inaktiv oder nicht verfügbar geführt. Die Komponenten-Diagnose priorisiert GNT-Pfade, um bislang unbekannte Namen gezielt zuordnen zu können.

Die Aufnahme des echten `RVM_FTF_DB_BR411_TW_0_C` belegt `GNT_Service.Property.bIsEnabled`, `bIsReady` und `bIsActivated`. Der Adapter liest diese drei Zustände getrennt. Gibt es keinen direkten Leuchtmelderwert, wird die blaue GNT-Anzeige vorläufig aus `bIsEnabled` gespeist. Die Aktivierung der Überwachung wird dabei nicht mit dem Einschaltzustand gleichgesetzt. Diese Anzeigezuordnung ist noch gegen das Display im Spiel zu prüfen; die Aufnahme enthält die Pfadnamen, aber keine erfolgreichen Werte für diese drei Properties. Der Diagnosebericht kennzeichnet die verwendete Quelle.
