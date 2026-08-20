# Gerätemapping — Live S

## Fest verdrahtete Geometrie

- Geräteformat in der Loupedeck-Profildatei: `Loupedeck50` (Live S).
- Touchfläche: 480 × 270 px, fünf Spalten und drei Reihen.
- Touch-Slots: `T01` bis `T15`, in Leserichtung oben links nach unten rechts.
- Regler: `D01` (oben links) und `D02` (mittig links).
- Seitentasten: links unten sowie rechts oben, mittig und unten. Links unten
  bleibt frei; die drei rechten Tasten aktivieren ChatGPT, Work und Codex direkt.
- Die Fn-Ebene und die Drücke auf `D02` und der linken unteren Seitentaste
  bleiben unbelegt. Auf der Codex-Seite sind die Drehungen von `D01` und `D02`
  sowie der Druck auf `D01` aktiv.

Die Kennungen beschreiben ausschließlich Positionen. Sie sind keine
Tastaturereignisse und lösen nichts aus.

Hinweis zum Dateiformat: Loupedeck 6.3 speichert für Live S sechs
Encoder-Controls im Profilcontainer. In diesem Projekt sind nur die zwei
physisch vorhandenen Regler `D01` und `D02` modelliert; die vier übrigen
Formatfelder bleiben leer und werden nicht als Hardwarebelegung verwendet.

## Arbeitsflächen und Seiten

| Hardware-Seite | Sichtbarer Modus | Touch-Seite | Reglerseite | Farbe | Status |
| --- | --- | --- | --- | --- |
| 1 (Startseite) | Codex | `codex-touch` | `codex-dials` | Orange | T01 New Chat, T02 Choose Project (Platzhalter), T03 Plan, T04 Fast Mode, T05 Next Task, T06 Quick Chat, T07 Add Files, T08 Release, T09 Dictate, T10 Switch Chat, T11 Side Chat, T12 Add Photos, T13 Review, T14 Voice, T15 Previous Task; D01 Modell, D02 Aufwand |

Codex ist die einzige Loupedeck-Arbeitsfläche. ChatGPT, Work und Codex werden
über die drei rechten Seitentasten direkt aktiviert; sie erzeugen keine weiteren
Touch- oder Reglerseiten.

## Touch-Raster

| Reihe \ Spalte | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- |
| 1 | T01 | T02 | T03 | T04 | T05 |
| 2 | T06 | T07 | T08 | T09 | T10 |
| 3 | T11 | T12 | T13 | T14 | T15 |

### Codex-Tasknavigation

Die folgenden Aktionen existieren ausschließlich auf der Codex-Touch-Seite.
`T02` bleibt sichtbar, obwohl Codex seine Projektauswahl dort nicht ausführt;
das gesamte ChatGPT-/Work-Raster bleibt frei.

| Feld | Slot | Aktion | Shortcut |
| --- | --- | --- | --- |
| 1 | T01 | New Chat — neuen Codex-Task im aktuellen Kontext starten | `⌘N` |
| 2 | T02 | Choose Project — Platzhalter; im Codex-Modus nicht verfügbar | `⌘⌥⇧O` |
| 3 | T03 | Plan — Planmodus des aktiven Composers umschalten | `⌘⌥⌃5` |
| 4 | T04 | Fast Mode — Schnellmodus des aktiven Composers umschalten | `⌘⌥⌃6` |
| 5 | T05 | Next Task — nächster Task in der aktuellen Reihenfolge | `⌘⌥⌃↓` |
| 6 | T06 | Quick Chat — leichten Chat im Quick Composer starten | `⌘⌥N` |
| 7 | T07 | Add Files — Dateien oder Ordner am aktiven Composer anhängen | `⌘⌥⇧F` |
| 8 | T08 | Release — Release-Prompt in den aktiven Composer einsetzen, nicht senden | — |
| 9 | T09 | Dictate — macOS-Diktat für das fokussierte Textfeld umschalten | `⌘⌥⌃9` |
| 10 | T10 | Switch Chat — Task suchen und öffnen | `⌘⌥⌃K` |
| 11 | T11 | Side Chat — aktuellen Task als Side Chat öffnen | `⌘⌥S` |
| 12 | T12 | Add Photos — Bilder am aktiven Composer anhängen | `⌘⌥⇧P` |
| 13 | T13 | Review — gründlichen, rein lesenden Review des aktuellen Projekts anfordern, nicht senden | — |
| 14 | T14 | Voice — Voice-Modus im aktiven Composer starten | `⌃⇧V` |
| 15 | T15 | Previous Task — vorheriger Task in der aktuellen Reihenfolge | `⌘⌥⌃↑` |

`T08` und `T13` nutzen die native Loupedeck-Textaktion und setzen ihre
jeweiligen Prompts in den fokussierten Composer. T13 verlangt einen
evidenzbasierten, rein lesenden Review mit Befunden nach Schweregrad und
Datei:Zeile; beide Tasten senden nicht.
`T09` löst den eingerichteten macOS-Systemshortcut für Diktat aus und
funktioniert daher als Umschalter: einmal drücken zum Starten, erneut drücken
zum Beenden. Der Cursor muss im Codex-Composer stehen. `T14` verwendet den
vorhandenen Codex-Standardshortcut für Voice-Modus.
Alle direkten Codex-Befehle, einschließlich Plan und Fast Mode, sind im
Loupedeck-Profil als einzelne Tastaturaktionen gespeichert.
Die Belegungen
für **Vorheriger Chat**, **Nächster Chat** und **Chat suchen** werden in der
ChatGPT-Desktop-App unter *Einstellungen → Keyboard Shortcuts* hinterlegt;
`~/.codex/keybindings.json` ist dafür nicht zuständig. `↑` und `↓` sind
gewählt, weil die zugehörigen `←`/`→`-Belegungen in der App nicht ausgelöst
werden.

**Add Files**, **Add Photos**, **Plan** und **Fast Mode** haben in Codex keinen
Standardshortcut. In denselben Desktop-Einstellungen müssen sie einmalig auf
`⌘⌥⇧F`, `⌘⌥⇧P`, `⌘⌥⌃5` beziehungsweise `⌘⌥⌃6` gesetzt werden. Choose Project bleibt
sichtbar, kann im Codex-Modus aber nicht ausgelöst werden.

## Linke Drehregler

| Position | Slot | Status |
| --- | --- | --- |
| links oben | D01 | Codex: vorheriges/nächstes Modell |
| links mittig | D02 | Codex: Aufwand verringern/erhöhen |

### Codex-Reglerdetails

| Slot | Linksdrehung | Rechtsdrehung | Druck |
| --- | --- | --- | --- |
| D01 | Modellauswahl öffnen, hoch | Modellauswahl öffnen, runter | Auswahl bestätigen (`Return`) |
| D02 | Aufwand verringern (`⌘⌥⌃3`) | Aufwand erhöhen (`⌘⌥⌃4`) | frei |

`D02` setzt in Codex `composer.decreaseReasoningEffort` beziehungsweise
`composer.increaseReasoningEffort` voraus. Die zugehörige, geprüfte Belegung
steht in `config/codex-keybindings.json`.

## Direkte App-Modus-Tasten

Die drei rechten Seitentasten sind einzelne Loupedeck-Profilaktionen. Sie
senden `Ctrl+1`, `Ctrl+2` und `Ctrl+3` direkt an die ChatGPT-App; keine Taste
verwendet Mauspositionen, UI-Automation oder einen Loupedeck-Workspacewechsel.

| Physische Taste | Profil-Control | Anzeige / LED | Ergebnis |
| --- | --- | --- | --- |
| links unten | `roundPage[0]` | frei | Keine Aktion |
| rechts oben | `roundPage[1]` | ChatGPT / Rot `#FF0000` | Aktiviert ChatGPT direkt mit `Ctrl+1` |
| rechts mittig | `roundPage[2]` | Work / Gelb `#FFE600` | Aktiviert Work direkt mit `Ctrl+2` |
| rechts unten | `roundPage[3]` | Codex / Grün `#16A36A` | Aktiviert Codex direkt mit `Ctrl+3` |

## Aktuelle Grenzen

- Außer den vierzehn aktiven Codex-Grid-Tasten, den drei rechten App-Modus-
  Tasten, den beiden Codex-Reglerdrehungen und dem Druck auf `D01` hat keine
  Taste oder Reglerfunktion eine aktive Aktion.
- Die Modellwahl verwendet mangels eines direkten Codex-Befehls die
  Modellauswahl mit Pfeiltaste und Bestätigung.
- Der Druck auf `D02` und die linke untere Seitentaste bleiben für spätere
  Entscheidungen frei.
