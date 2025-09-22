# AkaListen Template-Verzeichnis

Dieses Verzeichnis enthält die Jinja2-Templates, JavaScript- und CSS-Dateien für die Website.

## Hauptdateien

- **index.j2**: Haupt-Template, das alle Makros und Skripte einbindet. Hier wird die Seite zusammengesetzt.
- **macros/render_*.j2**: Makro-Dateien für die Darstellung einzelner Komponenten (Formulare, Listen, Umfragen, Links, Kategorien etc.).
- **layout-styles.css**: Enthält die individuellen CSS-Styles für das Layout.

## JavaScript

Alle JS-Dateien liegen im Ordner `scripts/` und sind modular aufgebaut:

- **main.js**: Initialisiert die gesamte Logik nach dem Laden der Seite. Setzt alle Manager auf und sorgt für die Synchronisation der Anzeige.
- **Muckenliste.js**: Repräsentiert eine einzelne Muckenliste und deren Kategorien.
- **MuckenlistenManager.js**: Verwaltet alle Muckenlisten und deren Kategorien. Stellt Methoden zur Verfügung, um Poll-IDs und Kategorien zu verwalten.
- **CategoryManager.js**: Steuert die Kategorie-Checkboxen, deren Synchronisation und die Anzeige der Kategorien. Richtet Event Listener für die Interaktion ein.
- **FilterManager.js**: Steuert die Filter-Checkboxen für die Spaltenanzeige in den Muckenlisten. Synchronisiert die Auswahl und aktualisiert die Sichtbarkeit der Spalten.
- **UserHighlightManager.js**: Verwaltet die Hervorhebung von Nutzern in den Muckenlisten. Ermöglicht es, Nutzer und deren Kategorien hervorzuheben und die Auswahl zurückzusetzen.
- **layout-script.js**: Steuert das Theme (hell/dunkel/auto), das Verhalten der Navbar (Scrollrichtung, Höhe) und initialisiert Tooltips.

## Struktur

- **scripts/**: Enthält alle JavaScript-Dateien für die Interaktivität und das Layout.
- **macros/**: Makros für die Darstellung einzelner Komponenten.
- **layout-styles.css**: Individuelle Styles für die Seite.
- **README.md**: Diese Übersicht.

## Hinweise

Die Templates und Skripte sind so aufgebaut, dass sie modular und leicht erweiterbar sind. Die Event Listener und Manager sorgen für eine konsistente und benutzerfreundliche Interaktion auf der Seite.
