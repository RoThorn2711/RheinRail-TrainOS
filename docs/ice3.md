# ICE 3

Eigener Reiter mit Tacho bis 400 km/h, veränderlicher Skalenteilung nach Referenz, LZB und beidseitiger Prozentanzeige. Die Türsymbole wurden auf Wunsch entfernt. In der Demo schaltet „LZB-Demo aktiv“ auch B und die LZB-Beschriftung aus. Im Live-Modus darf B bei gemeldeter Bereitschaft unabhängig von aktiver LZB leuchten.

Für Live den Server neu starten, die Seite neu laden und ICE 3 → TSW Live wählen. Der Endpunkt `/api/state?profile=ice3` besitzt einen eigenen Cache und verwendet denselben lesenden API-Zugriff wie 101 und ICE 1. Fahrzeugklasse und VehicleID werden vor und nach jeder Messung geprüft. Geschwindigkeit und Zeit verwenden die bestehenden gemeinsamen Abfragen. LZB-Pfade werden ausschließlich aus angebotenen Komponenten und bekannten Getter-Endpunkten aufgelöst. Sifa und PZB lesen die angebotenen Display-Properties über dieselbe Verarbeitung wie beim ICE 1.

Die rechte Anzeige übernimmt nur ausdrücklich als Prozent benannte Messfelder. kN, Fahrschalterstellungen oder uneindeutige normierte Werte werden nicht umgedeutet. Fehlt die Zuordnung, bleibt die Anzeige leer. Die live angebotenen ICE-3-Feldnamen müssen noch anhand einer Aufnahme bestätigt werden. Unter Einstellungen kann `rheinrail-ice3-komponenten.json` heruntergeladen werden; diese enthält zusätzlich die laufende Messdiagnose.

Automatisierte Tests prüfen Demo-LZB, Entfernung über 4000 m, Prozentwerte, fehlende Daten und Fahrzeugwechsel mit synthetischen Antworten. Ein vollständiger Vergleich mit einer echten ICE-3-Fahrt steht noch aus.
