# AI Workspace for Loupedeck Live S

Ein visuelles und reproduzierbares macOS-Anwendungsprofil für Codex auf dem
**Loupedeck Live S**: 15 Touch-Tasten (5 × 3), zwei Drehregler und vier
RGB-Seitentasten.

Codex ist die einzige Loupedeck-Arbeitsfläche. Die linke untere Seitentaste
bleibt frei. Die drei rechten Seitentasten aktivieren direkt ChatGPT (`Ctrl+1`,
rot), Work (`Ctrl+2`, gelb) und Codex (`Ctrl+3`, grün); sie wechseln keine
Loupedeck-Arbeitsfläche.
Auf der Codex-Seite wählt der obere Regler `D01` das vorherige oder nächste
Modell; der untere Regler `D02` verringert oder erhöht den
Reasoning-Aufwand. Ein Druck auf `D01` bestätigt die markierte Modellauswahl.
Im 3×5-Grid navigieren `T05`, `T10` und `T15` durch die zuletzt verwendeten
Tasks beziehungsweise zur Task-Suche; `T03` schaltet den Planmodus um,
`T04` den Schnellmodus, `T09` schaltet das macOS-Diktat ein oder aus und
`T14` startet den Voice-Modus.
`T08` setzt den verifizierten Release-Prompt und `T13` den Projekt-Review-Prompt
in den aktiven Composer. `T02`
bleibt als sichtbarer Platzhalter für die in Codex nicht verfügbare
Projektauswahl. Der Druck auf `D02` bleibt frei.

## Enthalten

| Pfad | Zweck |
| --- | --- |
| `src/profile/architecture.json` | Menschlich lesbare Belegungsquelle. |
| `src/profile/fixtures/ChatGPT-manual-reference.lp5` | Unveränderter Export des manuell funktionierenden ChatGPT-Live-S-Profils. |
| `config/codex-keybindings.json` | Dokumentiert die eingerichteten Codex-Kurzbefehle für `D02`, Plan und Fast Mode. |
| `src/icons/` | Editierbare SVG-Quellen im 90 × 90-Format. |
| `docs/device-map.md` | Hardware-Koordinaten und Seitenbelegung. |
| `docs/live-s-layout.svg` | Visuelle Übersicht des Geräts. |
| `dist/AI-Workspace-Live-S-0.27.0.lp5` | Erzeugtes ChatGPT-Anwendungsprofil für Live S. |

Die Profilbasis wurde mit Loupedeck 6.3 auf diesem Mac über den normalen
Importdialog erfolgreich importiert und aktivierte unmittelbar das Profil
**AI Workspace — ChatGPT (Live S)** mit der Start-Arbeitsfläche **Codex**.
Der Loupedeck-Editor zeigt auf der Codex-Reglerseite die beiden importierten
Aktionen **Codex — Modell** und **Codex — Aufwand** an.

## Profil importieren

1. In der Loupedeck-App das vorhandene Profil bei Bedarf exportieren/sichern.
2. `dist/AI-Workspace-Live-S-0.27.0.lp5` importieren.
3. Falls der Zuordnungsdialog erscheint, **ChatGPT** auswählen und trotz der
   roten Meldung „Anwendung nicht gefunden“ mit **Ok** fortfahren. Loupedeck
   6.3 aktualisiert diese Meldung in diesem Dialog nicht korrekt; sie verhindert
   den Import nicht.
4. Auf die anschließende Meldung **Import erfolgreich** achten.
5. Kontrollieren, dass das Profil **AI Workspace — ChatGPT (Live S)** und die
   Arbeitsfläche **Codex** angezeigt werden.

Die Importfassung ist ein echtes **ChatGPT-Anwendungsprofil**. Sie übernimmt
die lokal registrierte ChatGPT-/Codex-Anwendungskennung `com.openai.codex`
einschließlich der funktionierenden Live-S-Profilstruktur. Codex ist darin die
einzige Loupedeck-Arbeitsfläche; ChatGPT, Work und Codex werden durch direkte
rechte Seitentasten aktiviert.

Wichtig: Ein Import über ein noch vorhandenes Profil testet nur das Ersetzen
dieses Profils. Der Lösch- und Neuimporttest zeigt zusätzlich, dass Loupedeck
den Zuordnungsdialog anzeigt. Die dortige rote Fehlermeldung ist irreführend:
Nach manueller Auswahl von ChatGPT und **Ok** wird das Profil dennoch korrekt
angelegt. Der installierte Editor zeigt danach wieder die Codex-Arbeitsfläche
und beide Regleraktionen.

## Reglerlogik

`D01` nutzt den realen Codex-Befehl `Ctrl+Shift+M` zum Öffnen der
Modellauswahl. Eine Rastung nach links sendet danach `Pfeil hoch`, eine Rastung
nach rechts `Pfeil runter`. Ein Druck auf denselben Regler sendet separat
`Return` und bestätigt die markierte Auswahl. Die Trennung ist absichtlich:
Das unmittelbar an die Drehsequenz angehängte `Return` wurde von Codex nicht
zuverlässig verarbeitet. Codex stellt derzeit keinen allgemeinen
Kurzbefehlsbefehl für „vorheriges/nächstes Modell“ bereit; deshalb ist diese
kleine Auswahlsequenz notwendig.

Wichtig für das Profilformat: D01-Druck verwendet ein Ein-Schritt-Makro über
denselben, auf dem Gerät funktionierenden Ausführungspfad wie die
Reglerdrehungen. Darin serialisiert Loupedeck die normale macOS-Taste als
`Return` mit Hardware-Keycode 36 und dem lokalen Layout `USInternational-PC`.
`Enter` bezeichnet intern eine andere Taste.

`D02` nutzt zwei in Codex konfigurierbare Befehle:

| Richtung | Codex-Befehl | Kurzbefehlsbelegung |
| --- | --- | --- |
| links | `composer.decreaseReasoningEffort` | `⌘⌥⌃3` |
| rechts | `composer.increaseReasoningEffort` | `⌘⌥⌃4` |

`config/codex-keybindings.json` dokumentiert die eingerichteten Belegungen.
In der Desktop-App werden sie unter *Einstellungen → Keyboard Shortcuts*
gespeichert; `~/.codex/keybindings.json` ist dafür nicht zuständig.

## Codex-Tasknavigation im Grid

Die fünfzehn belegten Grid-Felder sind nur auf der Codex-Seite sichtbar. Vierzehn davon
sind aktiv; `T02` bleibt als Platzhalter sichtbar, weil die von Codex gelistete
Projektauswahl im Codex-Modus nicht ausführbar ist. Ihre
Tastenkombinationen werden in der ChatGPT-Desktop-App unter
*Einstellungen → Keyboard Shortcuts* gespeichert, nicht in
`~/.codex/keybindings.json`. Dort müssen **Vorheriger Chat**, **Nächster
Chat** und **Chat suchen** einmalig wie unten eingetragen sein.

| Feld | Slot | Aktion | Codex-Befehl | Shortcut |
| --- | --- | --- | --- | --- |
| 1 | `T01` | New Chat | `newTask` | `⌘N` |
| 2 | `T02` | Choose Project (Platzhalter) | `composer.openProjectPicker` | `⌘⌥⇧O` |
| 3 | `T03` | Plan | `composer.togglePlanMode` | `⌘⌥⌃5` |
| 4 | `T04` | Fast Mode | `composer.toggleFastMode` | `⌘⌥⌃6` |
| 5 | `T05` | Next Task | `nextThread` | `⌘⌥⌃↓` |
| 6 | `T06` | Quick Chat | `quickChat` | `⌘⌥N` |
| 7 | `T07` | Add Files | `composer.addFiles` | `⌘⌥⇧F` |
| 8 | `T08` | Release | Prompt einfügen, nicht senden | — |
| 9 | `T09` | Dictate | `macos.toggleDictation` | `⌘⌥⌃9` |
| 10 | `T10` | Switch Chat | `searchChats` | `⌘⌥⌃K` |
| 11 | `T11` | Side Chat | `openSideChat` | `⌘⌥S` |
| 12 | `T12` | Add Photos | `composer.addPhotos` | `⌘⌥⇧P` |
| 13 | `T13` | Review | Prompt einfügen, nicht senden | — |
| 14 | `T14` | Voice | `composer.startVoiceMode` | `⌃⇧V` |
| 15 | `T15` | Previous Task | `previousThread` | `⌘⌥⌃↑` |

Previous Task und Next Task öffnen den Ziel-Task sofort und folgen der
aktuellen sichtbaren Task-Reihenfolge. Der Planmodus schaltet im aktiven
Composer zwischen Plan an und aus. `T08` und `T13` nutzen Loupedecks native
Textaktion. T08 setzt den Release-Prompt ein; T13 fordert einen gründlichen,
rein lesenden Projekt-Review an — mit Projektzusammenfassung, Code,
Konfigurationen, Tests und Arbeitsstand als Prüfgegenständen sowie Befunden mit
Datei:Zeile. Beide Tasten senden nicht. `T09` sendet den in macOS unter
*Tastatur → Diktat* eingerichteten globalen Umschalter (`⌘⌥⌃9`): einmal
drücken startet, erneutes Drücken beendet das Diktat. Der Cursor muss im
Composer stehen. `T14` verwendet den eingebauten Befehl für den Voice-Modus
(`⌃⇧V`).
Alle übrigen aktiven Grid-Felder sind als direkte
Loupedeck-Tastaturaktionen gespeichert. Die
funktionierenden Kombinationen verwenden `↑` und `↓`; die alternative
Belegung mit `←` und `→` wird in der aktuellen Desktop-App zwar angezeigt,
löst die Navigation aber nicht aus.

Für **Add Files**, **Add Photos**, **Plan** und **Fast Mode** gibt es in Codex keinen
vorgegebenen Shortcut. Sie müssen unter *Einstellungen → Keyboard Shortcuts*
einmalig auf `⌘⌥⇧F`, `⌘⌥⇧P`, `⌘⌥⌃5` beziehungsweise `⌘⌥⌃6` gesetzt werden.
Choose Project bleibt belegt, ist aber im Codex-Modus derzeit nicht verfügbar.

## App-Modus-Tasten

Die drei rechten Seitentasten sind einzelne Loupedeck-Profilaktionen:

| Taste | Aktion | Shortcut | LED |
| --- | --- | --- | --- |
| rechts oben | Zu ChatGPT wechseln | `Ctrl+1` | Rot `#FF0000` |
| rechts mittig | Zu Work wechseln | `Ctrl+2` | Gelb `#FFE600` |
| rechts unten | Zu Codex wechseln | `Ctrl+3` | Grün `#16A36A` |

Sie senden nur diese direkten App-Kurzbefehle und verwenden weder
Mauspositionen noch UI-Automation, Multi-Toggle oder Loupedeck-
Workspacewechsel. Die linke untere Seitentaste ist unbelegt. Die drei
Aktionsgrafiken werden aus editierbaren SVG-Quellen erzeugt.

## Bauen und prüfen

Voraussetzung ist nur eine aktuelle Node.js-Laufzeit; es werden keine Pakete
installiert.

```sh
npm run check
```

Der Befehl erzeugt die `.lp5` neu und prüft unter anderem:

- `Loupedeck50` als lokales Live-S-Geräteformat,
- genau eine sichtbare Codex-Arbeitsfläche mit fünfzehn Grid-Slots auf `T01`
  bis `T15`;
  `T02` ist im
  Codex-Modus ein sichtbarer Platzhalter, alle übrigen Touch-Slots bleiben
  frei,
- `D01` für Modellwahl und `D02` für Reasoning-Aufwand nur auf der Codex-Seite,
- `Return` auf dem Druck von `D01` und einen freien Druck auf `D02`,
- drei direkte rechte App-Modus-Aktionen für ChatGPT, Work und Codex sowie
  eine freie linke untere Seitentaste,
- die expliziten LED-Farben Rot für ChatGPT, Gelb für Work und Grün für Codex,
- ein valides ZIP-Paket mit der Struktur des lokal funktionierenden Exports.

Das `.lp5` ist ein ZIP-Container im von Loupedeck 6.3 selbst exportierten
Profilformat. Profil-ID, `defaultProfileName` und Paket-ID werden identisch
gehalten. `dist/` kann jederzeit aus den Quellen reproduziert werden.

## Icons

Die SVGs verwenden ein quadratisches `viewBox="0 0 90 90"`, einen dunklen
Hintergrund und je Bereich einen klaren Akzent. Es werden keine Produktlogos
oder fremden Markenassets verwendet. `dial-model.svg` und `dial-effort.svg`
dokumentieren die Reglerfunktionen; die drei `*-shortcut.svg`-Dateien sind die
editierbaren Quellen der eingebetteten App-Modus-Aktionsgrafiken.

## Interne Kompatibilitätsseite

Loupedeck erzeugt auch für Live S eine interne `wheelPage` und verlangt ihre
Referenz beim Aktivieren eines Anwendungsprofils. Sie ist keine zusätzliche
Hardwareseite und belegt weder `D01` noch `D02`. Die unveränderte, nicht
erreichbare Seite stammt aus dem manuell erzeugten ChatGPT-Profil und dient
nur der Aktivierung durch den Loupedeck-Dienst.

## Nächste Entscheidung

Der Druck auf `D02` bleibt für eine spätere Entscheidung offen.

## Lizenz

Die eigenen Quellen, Konfigurationen und Dokumentationen dieses Projekts stehen
unter der [MIT-Lizenz](LICENSE). Hinweise auf übernommene oder angepasste
Drittbestandteile stehen vollständig in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Credits und Herkunft

Dieses eigenständige Profil für den **Loupedeck Live S** wurde mit Teilen der
Profil- und Icon-Grundidee von
[Retro-Ace/codex-control-loupedeck](https://github.com/Retro-Ace/codex-control-loupedeck)
entwickelt. Insbesondere dienten die Trennung von Profilbasis, editierbaren
SVG-Quellen und reproduzierbarer Validierung sowie einzelne, daran angelehnte
SVG-Grafiken als Ausgangspunkt.

Retro-Aces Quelltext und Originalgrafiken sind unter der MIT-Lizenz verfügbar.
Die unveränderte ursprüngliche Copyright- und Lizenznotiz ist in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) enthalten.

Nicht übernommen wurden die übrigen Tastenbelegungen, Prompt-Makros,
CT-spezifischen Bedienflächen oder der optionale Wheel-Plugin-Code. Dieses
Projekt ist kein offizielles Produkt von Retro-Ace, OpenAI oder Logitech.
