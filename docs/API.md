# API-Datenquellen und Grenzen

Die Live-Anbindung wurde mit TSW 7, Build 902, API-Version 1 geprüft. Der Schlüssel wird ausschließlich lokal gelesen. Alle Spielanfragen verwenden GET; es gibt keine Fahrzeugsteuerung.

## Instrumente

| Anzeige | Geprüfter Datenpfad | Verarbeitung |
| --- | --- | --- |
| Geschwindigkeit | `CurrentDrivableActor.Function.HUD_GetSpeed` | `Speed (ms)` × 3,6 |
| Spielzeit | `TimeOfDay.Data` | Uhrzeit aus `LocalTimeISO8601` |
| Zug-/elektrische Bremskraft | `CurrentDrivableActor/Simulation/MFA_TractiveEffort_N.Result` | N / 1000; positive Kraft pro Fahrmotor, negative Bremskraft gesamt |
| Sifa | `CurrentDrivableActor/BP_Sifa_Service.Function.WarningDevices_GetWarningIndicator` | Warnung oder ausgeschalteter Zustand |
| ZS aus | `CurrentDrivableActor/Simulation/Trainline.Enabled` | 0/1, invertiert |
| Hohe Abbremsung | `CurrentDrivableActor/Simulation/HighBrake.Result` | 0/1 |
| PZB-/LZB-Leuchtmelder | `CurrentDrivableActor/MFA_Indicators.Property.*` | Bekannte Active-/Flashing-/Inhibited-Flags |
| LZB-Entfernung | `CurrentDrivableActor/LZB.Function.LZB_GetTargetSpeedDistance` | Meter, Anzeigeskala bis 4.000 m |
| LZB-Zielgeschwindigkeit | `CurrentDrivableActor/LZB.Function.LZB_GetExpectedTargetSpeed` | m/s × 3,6 |
| LZB-zulässige Geschwindigkeit | `CurrentDrivableActor/LZB.Function.LZB_GetMaxPermissibleSpeed` | m/s × 3,6 |

Die frühere `IS_GetCurrentSpeedMS`-Quelle lieferte im untersuchten Fahrzeug auch während der Fahrt 0 und wird nicht als Ist-Geschwindigkeit verwendet. Die genaue Zuordnung aller seltenen Meldezustände ist noch nicht vollständig im Spiel geprüft.

## Navigator

- `CurrentDrivableActor.LatLon`: geographische Zugposition. Die Kameraposition wird nicht als Zugposition ausgegeben.
- `CurrentDrivableActor.VehicleID` und `ObjectClass`: Laufzeit-Fahrzeugerkennung. Sitzungsdaten gehören nicht in öffentliche Diagnoseberichte.
- `DriverAid.Data`: aktuelle Geschwindigkeitsinformationen und Listen vorausliegender Signale und Wechsel. m/s werden in km/h, Zentimeter in Meter umgerechnet.
- `DriverAid.TrackData.markers`: verfügbare TSW-Zielmarker und relative Entfernung. Kein vollständiges Bahnhofverzeichnis.
- `DriverAid.PlayerInfo.currentServiceName`: Dienstkennung, falls vorhanden. Profilnamen werden nicht weitergereicht.
- `LZB_GetIsActive` und `MFA_Indicators.Function.GetIsActivePZB`: momentaner Fahrzeugzustand, keine Streckenabschnittsgrenzen.

Die Bewegungsausrichtung entsteht aus aufeinanderfolgenden GPS-Punkten ab 2 m Bewegung. Ohne bestätigte Zuordnung der Spielachsen wird ein roher Yaw-Wert nicht in einen geografischen Kurs umgedeutet. Bei Spiel-/Fahrzeugwechsel oder großen Positionssprüngen wird die GPS-Spur zurückgesetzt.

Die untersuchte API liefert kein belegtes vollständiges geografisches Gleisnetz. Lokale Weltkoordinaten oder Nullpositionen von Signalen werden nicht in geratene Kartenpunkte umgerechnet. Streckenname, Kilometrierung und vollständige Schutzsystemabschnitte bleiben unbekannt.

## Streckenband V2

Die Darstellung verwendet ausschließlich vorhandene relative Entfernungen. Farbige Streckengeschwindigkeitsintervalle reichen nur zwischen gemeldete Grenzen. `TrackRuleSpeedLimit` und `TrackPropertySpeedLimit` werden berücksichtigt; temporäre Einschränkungen bleiben eigene Markierungen. Kein Fortsetzen des letzten Werts hinter die letzte bekannte Grenze. Bei widersprüchlichen Grenzen wird kein Folgeintervall geraten.

HUD-Vorgabe und LZB-zulässige Geschwindigkeit werden nicht als Streckengeschwindigkeit eingesetzt. Aktiver LZB-/PZB-Fahrzeugstatus erzeugt keinen eingefärbten Schutzsystembereich.

## Externe Daten

Reale Hintergrundkarte und optionale Bahnhofsdaten: OpenStreetMap. Sie können vom Spiel abweichen und werden getrennt von TSW-Daten gekennzeichnet. In der gespeicherten Fulda-Referenz ist die OSM-Objektquelle dokumentiert. Externe Abfragen sind begrenzt und zwischengespeichert.

## Grenzen der Verifikation

Die lokalen Browserprüfungen umfassten Live-Fahrt, relative Signalbewegung, die zwei Instrumentenansichten, Kartenmodi, Scroll-/Zoom-Verhalten und ein iPad-Layout. Ein physischer Mehrgerätetest und Langzeit-/Sonderzustandsprüfungen bleiben offen. Die enthaltenen Testfixtures sind bereinigt und minimiert; die vertraulichen Rohdiagnosen werden nicht mitgeliefert.

## 145 Expert – vorläufige Live-Zuordnungen

`/api/state?profile=br145` verwendet einen getrennten Cache. Die Fahrzeugklasse muss die Nummer 145 enthalten; Klasse und VehicleID werden nach der Messung erneut geprüft. Die Erkennung unterscheidet die Fahrzeugfamilie, bestätigt aber keine bestimmte Expert-Ausführung.

Der Adapter fragt die oben dokumentierten, ausschließlich lesenden Verträge für Kraft, Sifa, ZS, LZB sowie die benannten `MFA_Indicators`-Flags ab. Nur Antworten mit passenden numerischen beziehungsweise booleschen Schlüsseln werden übernommen. Diese Verträge stammen aus der vorhandenen BR-101-Implementierung und sind für die BR 145 **noch nicht im Spiel bestätigt**. Gleiche Pfad- und Schlüsselnamen garantieren nicht dieselbe physikalische Bedeutung. Insbesondere Kraftvorzeichen und Kraft pro Fahrmotor müssen mit der 145 verglichen werden. Keine automatische Suche nach oder Ausführung von Fahrzeug-Steuerfunktionen.

Fehlende Endpunkte werden 30 Sekunden zwischengespeichert und danach erneut geprüft. Fehlende, ungültige oder veraltete Messwerte bleiben leer; keine Demo-Werte bei Verbindungsverlust. Leuchtmelder übernehmen Active-, Flashing- und Inhibited-Zustände aus der vorhandenen Ableitung. Unbestätigte zusätzliche Melder (Tür, elektrische Bremse, Hauptschalter, Notbremse) bleiben unbekannt/dunkel.

In den Einstellungen kann eine begrenzte 145-Diagnose heruntergeladen werden. Sie enthält ausschließlich Fahrzeugklasse, benannte Messpfade mit dekodierten Messwerten und die ausgewählten booleschen Melderflags. Sie enthält keinen Schlüssel, Benutzerpfad, VehicleID oder vollständige API-Antwort. Synthetische Tests prüfen die Verarbeitung; reale Fahrzeugaufnahmen stehen noch aus.

## Profilfreigabe

`dist/vehicle-profiles.js` ist die gemeinsame Freigabelogik für Server, Instrumente und Navigator-Menü. `/api/state?profile=mfd` gibt ausschließlich das ETCS-101-Profil frei, `profile=mfa` das analoge 101-Expert-Profil und `profile=br145` die 145-Familie einschließlich NV-Namensvarianten. Ohne Profilparameter gilt `mfd`. Eine falsche Profilanfrage liefert `supported:false`, leere `fields` und die aktuelle Liste `availableDisplays`. Veraltete oder nicht verbundene Zustände schalten keine Anzeige frei. Browserseitig wird dieselbe Regel zusätzlich geprüft und bei einem erkannten Fahrzeugwechsel die passende Ansicht aktiviert.


## ICE 1 – vorläufige Live-Zuordnungen

`/api/state?profile=ice1` verwendet einen getrennten Cache und prüft ICE-1-/BR-401-Klassennamen sowie die VehicleID vor und nach jeder Messung. Die Funktion `collectIce1` fragt ausschließlich bekannte lesende Verträge ab. ZS und hohe Abbremsung werden für dieses Profil nicht abgefragt. Keine ungeprüfte Übernahme von Messungen eines anderen Fahrzeugs.

Geschwindigkeit, Uhrzeit, Kraft, Sifa, PZB und LZB sind angeschlossen, aber noch nicht mit dem realen ICE-1-API-Verhalten verglichen. Passende Antwortformate werden als vorläufige Zuordnungen ausgewiesen. Kraftbezugsgröße und Vorzeichen müssen im Spiel überprüft werden. Ein Diagnose-Download in den Einstellungen hilft bei fehlenden Feldern. Die automatisierten Tests verwenden synthetische API-Antworten und belegen keine In-Game-Verifikation.
