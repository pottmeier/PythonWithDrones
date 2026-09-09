#set document(
  title: "PythonWithDrones: Gamifizierung einer browserbasierten Programmierumgebung",
  author: ("Niclas Falke", "Stefan Reitemeyer", "Jonas Pottmeier"),
)

#set page(paper: "a4", margin: 2.5cm)
#set text(font: "New Computer Modern", size: 12pt, lang: "de", hyphenate: true)
#set par(justify: true, leading: 0.62em, spacing: 1.1em, first-line-indent: 0pt)

#show raw: set text(font: "DejaVu Sans Mono", size: 0.85em)

#set figure(supplement: [Abb.])
#show figure.where(kind: table): set figure(supplement: [Tab.])
#show figure.caption: set text(size: 9.5pt)

#set heading(numbering: "1.1")
#show heading: set block(above: 1.6em, below: 0.9em)
#show heading.where(level: 1): set text(size: 16pt)
#show heading.where(level: 2): set text(size: 13pt)
#show heading.where(level: 3): set text(size: 11.5pt)

// ============================================================
// Titelseite
// ============================================================
#page(numbering: none)[
  #align(center)[
    #v(0.5cm)
    #text(size: 13pt)[Technische Hochschule Ostwestfalen-Lippe]

    #v(0.4cm)
    #text(size: 13pt)[Bachelor of Science, Data Science]

    #v(0.4cm)
    #text(size: 13pt)[Gamification]

    #v(1fr)

    #image("Images/PythonWithDrones.png", width: 55%)

    #v(1fr)

    #text(size: 13pt)[Ausarbeitung zum Thema:]

    #v(0.5cm)
    #text(size: 19pt, weight: "bold")[
      Vom Prototyp zur Spielschleife
    ]

    #v(0.25cm)
    #text(size: 13pt)[Gamifizierung von #emph[PythonWithDrones]]

    #v(1fr)
    #v(1fr)
  ]

  #table(
    columns: (4.4cm, 1fr),
    stroke: none,
    inset: (y: 6pt, x: 0pt),
    [Erstellt von:], [Niclas Falke, Stefan Reitemeyer und Jonas Pottmeier],
    [Matrikelnummer:], [20122542 (Niclas), 20124913 (Stefan) und 20116026 (Jonas)],
    [Fachsemester:], [4],
    [Betrachteter Zeitraum:], [10.04.2026 bis 26.07.2026],
    [Abgabedatum:], [26.07.2026],
    [Prüfer:], [Prof. Dr.-Ing. Rainer Rasche],
  )
]

// ============================================================
// Inhaltsverzeichnis
// ============================================================
#page(numbering: none)[
  #outline(title: [Inhaltsverzeichnis], depth: 3, indent: 1em)
]

#set page(numbering: "1")
#counter(page).update(1)

// ============================================================
= Abstrakt

#emph[PythonWithDrones] ist eine Lernanwendung, in der Python-Quelltext eine virtuelle Drohne durch dreidimensionale Level steuert. Zum Abschluss des Vorgängermoduls lag ein lauffähiger Prototyp vor, dessen Ablauf mit dem Erreichen des Zielportals endete @vorarbeit; danach war die Interaktion beendet. Die vorliegende Arbeit beschreibt, wie diese Anwendung zwischen dem 10. April und dem 26. Juli 2026 zu einem Spiel mit geschlossener Schleife ausgebaut wurde. Hinzugekommen sind ein erweiterter Handlungsraum der Drohne mit Schieben, Aufnehmen, Abliefern und Vorausschauen, eine auf dreizehn Level verlängerte Aufgabenkurve, eine Auswertung jedes Laufs nach Abstürzen, geflogenen Feldern und Codezeilen, eine serverseitige Bestenliste mit Kontoverwaltung und Versuchsverlauf sowie ein dreidimensionaler Level-Editor, mit dem Spielende eigene Aufgaben bauen und einreichen können. Die Auswertung ordnet die umgesetzten Elemente den drei Grundbedürfnissen Kompetenz, Autonomie und soziale Eingebundenheit zu und begründet, wie die einzelnen Entwurfsentscheidungen zusammenwirken.

= Einleitung

Zum Abschluss des vorangegangenen Moduls lag eine funktionsfähige Anwendung vor. Python wurde im Browser ausgeführt, die Drohne ließ sich steuern, und die vorhandenen Level waren lösbar. Die Anwendung unterschied je Level jedoch nur zwei Zustände, das Erreichen oder das Nichterreichen des Zielportals. Der Umfang einer Lösung, die Zahl der Fehlversuche und die Frage, ob nach Abschluss des letzten Levels ein Anlass zur weiteren Nutzung bestand, blieben unberücksichtigt.

Die vorliegende Arbeit hat das Ziel, diese Anwendung um Spielelemente zu erweitern und die dabei getroffenen Entwurfsentscheidungen zu begründen. Untersucht wird, welche Elemente aus dem Spieldesign sich in eine bestehende Lernanwendung einfügen lassen, welche Wirkung strukturell von ihnen zu erwarten ist und welche Kosten sie im Betrieb verursachen. Die Ausführung von Python im Browser ist nicht Gegenstand der Arbeit, da sie im Vorgängermodul entwickelt wurde @vorarbeit. Gamifizierung wird nicht als nachträgliche Ergänzung einer fertigen Anwendung verstanden, sondern als Eingriff in deren Regeln, der verändert, worauf Lernende beim Schreiben ihres Programms achten.

Die Arbeit stützt sich auf den Quelltext des Projekts und seine Versionsgeschichte @repo sowie auf die Ausarbeitung des Vorgängermoduls @vorarbeit. Als Ausgangspunkt dient das Tag `v1.0.0` vom 10. April 2026, das den Stand zum Abschluss des Vorgängermoduls markiert. Der Betrachtungszeitraum umfasst die Änderungen zwischen diesem Stand und dem 26. Juli 2026.

// ============================================================
= Ausgangslage <sec:ausgangslage>

== Der Stand zum Modulwechsel

Die Anwendung ist ein statischer Export eines Next.js-Projekts @nextjs und wird über GitHub Pages ausgeliefert. Sie benötigte zu diesem Zeitpunkt keine serverseitige Komponente. Geschriebener Quelltext wird an einen Web Worker übergeben, in dem Pyodide einen zu WebAssembly übersetzten CPython-Interpreter betreibt @pyodide. Jeder Drohnenbefehl erzeugt dort ein Datenobjekt, das über `postMessage` an den Hauptthread zurückgereicht wird. Dort nimmt eine Warteschlange die Objekte entgegen und arbeitet sie nacheinander als Animationen in einer mit React Three Fiber aufgebauten Szene ab @threefiber. Der Fortschritt liegt im `localStorage` des Browsers. Der Aufbau dieses Prototyps ist in der Ausarbeitung des Vorgängermoduls ausführlich beschrieben @vorarbeit.

Level sind YAML-Dateien. Sie beschreiben den Startpunkt der Drohne und eine Folge horizontaler Schichten, in denen jede Zelle über eine Block-Kennung belegt ist. Welche Eigenschaften eine solche Kennung hat, ob ein Block also eine Kollision auslöst oder als Ziel gilt, steht zentral in der Blockregistrierung. Sowohl die Python-Seite als auch die Darstellung greifen auf dieselbe Quelle zu.

Zum Zeitpunkt von `v1.0.0` umfasste dieser Aufbau sechs spielbare Level, neun Blocktypen und zehn öffentliche Methoden am Drohnenobjekt. Der Handlungsraum bestand aus Bewegen, Steigen, Sinken, Drehen und zwei Abfragen, mit denen sich ein blockierter Weg und das Erreichen des Portals prüfen ließen.

== Grenzen des Ausgangsstands

Aus der Perspektive des Gamification-Moduls fehlten dem beschriebenen Aufbau drei Voraussetzungen. Zunächst gab es keine Bewertung einer Lösung. Die Anwendung erfasste allein deren Vorhandensein und bot damit keine Grundlage für eine Rückmeldung, die über die Feststellung des Erfolgs hinausgeht, und keinen Maßstab für Verbesserung. Weiter gab es keinen Bezug zu anderen Nutzenden, da der Fortschritt ausschließlich lokal im Browser abgelegt war. Zwei Personen, die dasselbe Level lösten, erfuhren nichts voneinander, und ein Gerätewechsel verwarf den Fortschritt. Schließlich gab es keinen Spielraum für eigene Inhalte. Level lagen als YAML-Dateien im Repository, und ein eigener Beitrag setzte Kenntnis der Dateistruktur, ein Auschecken des Projekts und einen Pull Request voraus, was für die Zielgruppe keine erreichbare Handlung darstellt.

// ============================================================
= Begriffe und Festlegungen <sec:grundlagen>

Dieser Abschnitt legt fest, in welcher Bedeutung die zentralen Begriffe im weiteren Verlauf verwendet werden und woran die Entwurfsentscheidungen anschließend gemessen werden.

== Gamifizierung

Gamifizierung bezeichnet in dieser Arbeit den Einsatz einzelner Elemente aus dem Spieldesign in einem Zusammenhang, der selbst kein Spiel ist @deterding2011. Maßgeblich ist die Beschränkung auf einzelne Elemente. Die Lernanwendung wird nicht zu einem Spiel umgebaut; übernommen werden einzelne Bausteine, deren Wirkung aus Spielen bekannt ist. Die drei am häufigsten übernommenen Bausteine sind Punkte, Abzeichen und Bestenlisten @werbach2012. Punkte machen eine Leistung zählbar, Abzeichen machen sie sichtbar, und Bestenlisten machen sie vergleichbar. Im vorliegenden Projekt sind die Punkte als Kennzahlen je Lauf und die Bestenliste umgesetzt, während Abzeichen zurückgestellt sind.

== Mechanik, Dynamik und Erfahrung

Der Entwurf trennt drei Ebenen, wie sie im MDA-Rahmenwerk des Spieldesigns beschrieben sind @hunicke2004. Die Mechanik ist die Regel, die im Quelltext geschrieben wird. Die Dynamik ist das Verhalten, das im Betrieb daraus entsteht. Die Erfahrung ist das Ergebnis, das bei den Spielenden ankommt. Die Trennung ist nützlich, weil auf der Ebene der Mechanik gebaut wird, während die Wirkung auf der Ebene der Erfahrung eintritt und die dazwischenliegende Dynamik sich nur mittelbar festlegen lässt.

Im vorliegenden Projekt lässt sich das an der Bestenliste zeigen. Die Mechanik ist deren Sortierreihenfolge. Die daraus entstehende Dynamik ist, dass Spielende ihren Lösungsweg kürzen, statt ihn nur lauffähig zu machen. Die Erfahrung ist die eines gefundenen, kompakten Lösungswegs. Die Aufgabe des Entwurfs besteht darin, die Mechanik so zu wählen, dass die beabsichtigte Dynamik entstehen kann.

== Drei Grundbedürfnisse

Als Ordnungsrahmen dienen drei Bedürfnisse aus der Selbstbestimmungstheorie, die eine Tätigkeit aus sich heraus tragen können @deci2000. Kompetenz bezeichnet das Erleben, besser zu werden; es setzt voraus, dass Fortschritt abgestuft sichtbar ist und ein Fehlschlag eine benennbare Ursache hat. Autonomie bezeichnet den Spielraum, eigene Entscheidungen zu treffen, bis hin zur Wahl und zum Bau einer eigenen Aufgabe. Soziale Eingebundenheit bezeichnet den Bezug zu anderen, sei es über einen Vergleich, einen sichtbaren Namen oder geteilte Inhalte. Das Raster macht die Verteilung der umgesetzten Elemente sichtbar und zeigt, ob ein Entwurf alle drei Bedürfnisse adressiert.

== Passung von Anforderung und Fähigkeit

Eine Aufgabe trägt dann, wenn ihre Anforderung und die Fähigkeit der Lösenden in einem engen Verhältnis stehen, das der Flow-Theorie als Flow-Kanal beschrieben wird @csikszentmihalyi1990. Liegt die Anforderung darüber, entsteht Überforderung; liegt sie darunter, Langeweile. Für eine Lernanwendung mit fester Reihenfolge folgt daraus, dass die Steigerung zwischen zwei Leveln weder zu klein noch zu groß sein darf und dass erkennbar sein sollte, was ein Level verlangt, bevor es geöffnet wird.

== Festlegungen für jedes Spielelement <sec:einwaende>

Aus dem Zweck der Anwendung ergeben sich zwei Festlegungen, die für jedes eingebaute Spielelement gelten. Die gemessenen Größen sind Eigenschaften der Lösung und nicht des Verhaltens, das zu ihr geführt hat. Eine Wertung, die belohnt, wer am meisten Zeit aufwendet oder am schnellsten tippt, erfasst nicht den vermittelten Inhalt, während eine Wertung nach der Zahl der Schritte das Verständnis des Levels erfasst. Zudem steuert keine Belohnung den Zugang zu Lerninhalten. Jedes Level bleibt ohne Konto, ohne Bestenliste und ohne Serverbetrieb vollständig spielbar; ein Spielelement darf den Reiz einer Aufgabe erhöhen, ihn aber nicht ersetzen und niemanden ausschließen.

// ============================================================
= Umsetzung <sec:umsetzung>

== Überblick

Die Änderungen im Betrachtungszeitraum lassen sich in sechs Arbeitssträngen zusammenfassen, die aufeinander aufbauen. Der erweiterte Handlungsraum ist Voraussetzung für Level, die mehr als einen Weg verlangen, und die erhobenen Kennzahlen sind Voraussetzung für eine sortierbare Bestenliste. Der Handlungsraum der Drohne wurde im Juli 2026 um die Befehle Schieben, Aufnehmen, Abliefern und Vorausschauen erweitert, wozu fünf neue Blocktypen und Lösungsbedingungen im Levelformat kamen. Die Aufgabenkurve wuchs im selben Monat von sechs auf dreizehn Level bei überarbeiteter Einstiegsreihe und Schlagworten als Vorschau. Die Laufauswertung erfasst seither Abstürze, geflogene Felder und Codezeilen je Lauf, zeigt diese Werte nach Abschluss an und gibt `print`-Ausgaben in einem Terminal aus. Von Juni bis Juli 2026 entstand eine Bestenliste als FastAPI-Dienst mit Postgres-Datenbank, Konten, JWT-Anmeldung, Rangfolge und Versuchsverlauf. Zwischen Mai und Juli 2026 wurde ein dreidimensionaler Level-Editor mit Testlauf, YAML-Export und Einreichung über GitHub gebaut. Der sechste Strang fasst Arbeiten am Reibungsabbau zusammen, darunter die Darstellung auf schmalen Bildschirmen, eine eigene Fehlerseite, ein Rückmeldeknopf und eine automatisierte Testabdeckung.

Gemeinsam bilden diese Stränge eine geschlossene Schleife, die zuvor nicht bestand. Vor der Erweiterung endete der Ablauf mit dem Erreichen des Ziels; seither führt jede Auswertung wieder auf eine mögliche nächste Handlung, sei es das nächste Level, der Vergleich in der Bestenliste, die Verbesserung der eigenen Lösung oder der Bau eines eigenen Levels im Editor.

== Erweiterter Handlungsraum der Drohne

=== Neue Befehle

Der erste Eingriff betraf die Python-Schnittstelle. Solange die Drohne nur fliegen und sich drehen konnte, bestand jedes Ziel darin, eine Position zu erreichen, und die Level unterschieden sich allein in der Geometrie des Weges. Im Juli kamen vier Befehle hinzu, die den Zustand der Welt verändern oder abfragen. Der Befehl `drone.push()` schiebt einen als schiebbar gekennzeichneten Block um ein Feld weiter und rückt anschließend selbst nach; ist das Feld dahinter belegt, bleibt die Aktion folgenlos und nennt den Grund. Die Befehle `drone.pickup()` und `drone.deliver()` nehmen ein Paket auf und legen es auf einer Ablagefläche wieder ab, wobei beide melden, wenn nichts aufzunehmen oder nichts abzulegen ist. Der Befehl `drone.scan(n)` liefert die Block-Kennungen der nächsten `n` Felder in Blickrichtung und bricht am ersten blockierenden Feld ab; ohne Argument gibt er eine einzelne Kennung zurück.

Der Befehl `scan` ersetzt die frühere Abfrage `is_path_blocked`, die nur einen Wahrheitswert lieferte. Der Unterschied wirkt sich auf die Aufgabengestaltung aus, da eine Zeichenkette oder eine Liste dazu zwingt, das Ergebnis zu vergleichen und in eine Bedingung einzusetzen, während ein Wahrheitswert unmittelbar in eine `if`-Anweisung führt. Damit lassen sich Level bauen, in denen die Drohne unterscheiden muss, worauf sie trifft, und nicht nur, ob sie auf etwas trifft.

Insgesamt wuchs die öffentliche Schnittstelle von zehn auf vierzehn Methoden und die Blockregistrierung von neun auf vierzehn Typen. Neu sind Münze, Kiste, Paket, Ablagefläche und Zielmarkierung. @fig:scene zeigt ein Level, das drei dieser Bausteine gleichzeitig verwendet.

#figure(
  image("Images/level-scene.png", width: 100%),
  caption: [Das Level #emph[Push ’n Collect] vor dem ersten Lauf. Die Kiste versperrt den direkten Weg, die Münze liegt auf einem Seitenpfad, und der Zähler in der Kopfzeile hält den Stand der Lösungsbedingung fest.],
) <fig:scene>

=== Lösungsbedingungen

Damit die neuen Handlungen Bedeutung bekommen, wuchs das Levelformat mit. Ein Level kann nun neben dem Erreichen des Portals verlangen, dass eine bestimmte Zahl Münzen eingesammelt, ein Paket abgeliefert oder eine Kiste auf ein markiertes Feld geschoben wurde. Die Prüfung liegt im Levelmodell und läuft ab, sobald die Drohne das Portal betritt. Ist eine Bedingung noch offen, sendet die Python-Seite eine eigene Nachricht vom Typ `hint`, deren Text die offenen Bedingungen benennt, sodass Lernende unmittelbar erfahren, warum ein scheinbar erreichtes Ziel noch nicht zählt.

== Aufgabenkurve

Der Levelbestand stieg von sechs auf dreizehn. Ein Teil davon entstand aus einer Überarbeitung der Einstiegsreihe im Juli, bei der die ersten Level neu geordnet und ihre Beschreibungen gestrafft wurden. Die neuen Level greifen die erweiterten Befehle auf, sodass jeder Schritt der Reihe entweder ein Programmierkonzept oder eine Drohnenfähigkeit einführt, aber möglichst nicht beides gleichzeitig.

Jedes Level trägt Schlagworte, die in der Übersicht angezeigt werden. Sie nennen eine grobe Schwierigkeit und das behandelte Konzept, etwa Schleifen, Funktionen oder Bedingungen. Diese Vorschau setzt die Passung zwischen Anforderung und Fähigkeit um, weil die Einordnung sichtbar wird, bevor ein Level geöffnet wird. Gesperrte Level bleiben in der Übersicht sichtbar und tragen ein Schloss. Das ist eine bewusste Entscheidung gegen das Ausblenden, da ein sichtbares, aber verschlossenes Ziel als Anreiz wirken kann, ein ausgeblendetes hingegen nicht.

#figure(
  image("Images/home.png", width: 100%),
  caption: [Die Levelübersicht mit dreizehn Einträgen. Freigeschaltete Level tragen ein Abspielsymbol, gesperrte ein Schloss. Die Schlagworte kündigen Schwierigkeit und behandeltes Konzept an.],
) <fig:home>

== Auswertung eines Laufs

=== Kennzahlen

Die Python-Seite führt seit Juli zwei Zähler mit. `distance` steigt bei jedem erfolgreichen Ortswechsel, `crash_count` bei jeder Kollision. Beide werden über `get_stats()` an den Hauptthread gereicht. Die dritte Kennzahl, die Zahl der Codezeilen, ermittelt die Oberfläche selbst aus dem eingegebenen Text.

Diese Auswahl folgt der ersten der beiden Festlegungen. Alle drei Größen beschreiben das Programm und nicht die Person. Die Zahl der Felder eines Weges, die Häufigkeit einer Kollision und die Kompaktheit der Formulierung sind Eigenschaften des Algorithmus. Die Tippgeschwindigkeit gehört nicht dazu.

=== Abschlussanzeige

Beim Erreichen des Ziels erscheint eine Anzeige mit der benötigten Zeit und den drei Kennzahlen, ergänzt um einen kurzen Kommentar, der sich nach der Zahl der Abstürze richtet. Der Kommentar unterscheidet einen Lauf ohne Kollision von einem mit mehreren, ist bewusst knapp gehalten und ordnet die Zahl ein.

#figure(
  image("Images/level-run.png", width: 100%),
  caption: [Die Abschlussanzeige nach einem gelösten Level mit Zeit, Abstürzen, geflogenen Feldern und Codezeilen. Unten links zeigt das Terminal die Ausgaben der beiden `print`-Aufrufe.],
) <fig:run>

=== Terminal

Bis Juli lief die Ausgabe von `print` ausschließlich in die Entwicklerkonsole des Browsers. Für die Zielgruppe war sie damit praktisch nicht vorhanden, obwohl `print` das erste Werkzeug ist, mit dem Anfänger den Zustand eines Programms untersuchen. Der Worker leitet die Ausgabe jetzt zusätzlich als eigene Nachricht an den Hauptthread weiter, wo sie unter dem Editor in einem Terminalbereich erscheint. Dieselbe Bahn nutzen auch die Hinweistexte der Drohnenbefehle, etwa wenn `pickup` ins Leere greift.

Der Beitrag zur Gamifizierung besteht hier nicht in einem Spielelement, sondern in einer kürzeren Rückmeldeschleife, da ein Fehler mit sichtbarer Ursache eher zu einem weiteren Versuch führt als ein Fehler ohne erkennbare Ursache.

== Bestenliste

=== Architektur

Die Bestenliste ist der einzige Teil des Projekts, der eine serverseitige Komponente verlangt. Sie besteht aus einem FastAPI-Dienst @fastapi und einer Postgres-Datenbank @postgres, die zusammen mit dem Frontend über Docker Compose gestartet werden. Der Datenbankzugriff läuft asynchron über SQLAlchemy @sqlalchemy. Kennwörter werden mit Argon2 gehasht, die Anmeldung liefert ein JWT, und die Anmelde- und Registrierungsrouten sind ratenbegrenzt. Zugelassene Ursprünge stehen in einer Liste in der Umgebungskonfiguration.

Der Dienst führt drei Tabellen. `users` hält die Konten, wobei die Eindeutigkeit des Namens über einen funktionalen Index auf der kleingeschriebenen Fassung erzwungen wird, sodass sich zwei Konten nicht allein durch Groß- und Kleinschreibung unterscheiden können. `scores` hält je Konto und Level genau einen Eintrag, nämlich die erste Lösung. `attempts` hält jeden einzelnen Versuch.

=== Was gewertet wird

Die Rangfolge ergibt sich zuerst aus der Zahl der Schritte, dann aus der benötigten Zeit und zuletzt aus der Zahl der Codezeilen. Diese Reihenfolge ist die zentrale Entscheidung dieses Strangs. Stünde die Zeit an erster Stelle, würde die Bestenliste vor allem die Tippgeschwindigkeit und die Vorkenntnis der Lösung abbilden. Die Schrittzahl dagegen ist eine Eigenschaft des gefundenen Weges und lässt sich nur verbessern, indem das Level besser verstanden wird.

Gewertet wird die erste Lösung eines Levels. So bleibt die Liste ein Vergleich der Lösungsqualität und wird nicht zu einem Vergleich der aufgewendeten Zeit. Ergänzend hält die Tabelle `attempts` den vollständigen Verlauf, den Angemeldete unter der eigenen Fortschrittsanzeige einsehen können. Der Vergleich mit anderen bezieht sich damit auf die Erstlösung, während der Verlauf den Vergleich mit der eigenen früheren Leistung dauerhaft ermöglicht.

Die Zeitmessung beginnt beim Öffnen des Levels und endet bei der ersten erfolgreichen Lösung. Sie läuft als Wanduhr im Hauptthread und ist damit unabhängig davon, mit welcher Geschwindigkeit die Animation abgespielt wird oder wie lange der Python-Interpreter für die Ausführung braucht.

#figure(
  image("Images/leaderboard.png", width: 100%),
  caption: [Die Bestenliste einer laufenden Instanz. Die Level lassen sich einzeln auswählen, die Spaltenköpfe sind sortierbar. Die Reihenfolge folgt zuerst der Schrittzahl, wie der Vergleich der ersten drei Ränge zeigt.],
) <fig:leaderboard>

=== Betrieb ohne Backend

Die Anwendung bleibt weiterhin ohne Server benutzbar, weil sie als statischer Export auf GitHub Pages liegt. Der API-Client liest dazu eine einzige Umgebungsvariable. Ist sie nicht gesetzt, liefert jeder Aufruf `null` zurück, und sämtliche Aufrufe der Bestenliste laufen ins Leere, ohne einen Fehler zu erzeugen. Das Spiel funktioniert dann vollständig, nur ohne Vergleich.

Anmeldung ist an keiner Stelle Voraussetzung für das Spielen. Der Anmeldedialog bietet neben Registrierung und Anmeldung ausdrücklich einen Gastmodus an. Damit ist die zweite Festlegung eingehalten, da kein Lerninhalt an einer Belohnungsmechanik hängt.

== Level-Editor

=== Aufbau

Der Editor ist der umfangreichste Einzelbeitrag des Betrachtungszeitraums. Er wurde im Mai begonnen und bis Juli in mehreren Durchgängen ausgebaut. Er läuft vollständig im Browser und arbeitet auf derselben Datenstruktur wie das Spiel selbst.

Die Oberfläche trennt zwei Modi. Im Setzmodus platziert oder löscht ein Klick einen Block auf der aktiven Ebene, im Kameramodus dreht und zoomt derselbe Klick die Ansicht. Da beim Bauen ständig zwischen beidem gewechselt wird, lässt sich der Kameramodus zusätzlich durch Halten der Alt-Taste vorübergehend aktivieren, das Löschen entsprechend über die X-Taste. Neben Setzen und Löschen gibt es ein Werkzeug für den Startpunkt der Drohne.

Die Ebenen werden über einen Schrittwähler durchlaufen. Sichtbar bleiben dabei alle Ebenen, die aktive wird durch ein Gitter hervorgehoben, sodass die Tiefe beim Bauen erhalten bleibt. Ein eigenes Formular legt die Ausdehnung in allen drei Achsen fest, ein weiteres Titel, Beschreibung und Schlagworte.

#figure(
  image("Images/editor-3d.png", width: 100%),
  caption: [Der Level-Editor mit einem geladenen Level. Links Modus, Werkzeuge, Blockpalette und Größenangaben, oben rechts der Ebenenwähler und die Rücknahme, oben die Aktionen Export, Einreichung, Testlauf und Speichern.],
) <fig:editor>

=== Vom Entwurf zum Level

Drei Wege führen aus dem Editor heraus. Der Testlauf öffnet das gebaute Level in einem Dialog mit vollständiger Spielumgebung, also eigenem Editor, eigener Pyodide-Instanz @pyodide und eigener Szene. Der Dialog baut diese Umgebung erst beim Öffnen auf und wirft sie beim Schließen wieder weg, damit nicht dauerhaft ein zweiter Interpreter mitläuft. Der Export schreibt eine YAML-Datei in den Download-Ordner. Die Einreichung öffnet ein vorbereitetes GitHub-Issue, in dessen Formular das erzeugte YAML bereits eingetragen ist.

Ursprünglich mussten Autoren die Lösungsbedingungen eines Levels von Hand angeben, also etwa eintragen, dass drei Münzen einzusammeln sind. Seitdem leitet der Editor die Bedingungen aus dem gebauten Level ab. Wer drei Münzen platziert, baut ein Level mit drei einzusammelnden Münzen. Damit können Geometrie und Bedingung nicht mehr auseinanderlaufen, und der Bauvorgang wird um einen Schritt kürzer.

=== Einordnung

Der Editor adressiert das Bedürfnis nach Autonomie, das von Punkten und Bestenlisten nicht bedient wird. Er verschiebt die Rolle vom Lösen vorgegebener Aufgaben zum Stellen eigener. Für den Lerneffekt ist das insofern bedeutsam, als das Bauen eines lösbaren Levels verlangt, die Regeln der Simulation vollständig verstanden zu haben. Gleichzeitig ist er eine Inhaltsquelle. Der Aufwand für ein neues Level lag zuvor bei handgeschriebenem YAML und mehreren Stellen im Quelltext, die synchron gehalten werden müssen, und liegt nun bei einem Formular und einer Einreichung per Klick.

== Reibungsabbau

Der sechste Strang enthält Arbeiten, die für sich genommen keine Spielelemente sind, aber Voraussetzung dafür, dass die anderen fünf wirken.

Im Juli wurde die Darstellung auf schmalen Bildschirmen überarbeitet. Betroffen waren unter anderem der Ebenenwähler des Editors, der außerhalb des sichtbaren Bereichs lag, ein Mausradereignis, das nie gebunden wurde, und eine überfüllte Kopfzeile. Da ein erheblicher Teil der Zugriffe von Mobilgeräten erfolgt, beeinflusst diese Ebene, ob die erste Aufgabe überhaupt erreicht wird.

#figure(
  placement: auto,
  image("Images/mobile-level.png", width: 34%),
  caption: [Die Levelansicht auf einem schmalen Bildschirm. Szene und Editor stehen untereinander statt nebeneinander, der Aufgabentext lässt sich über die Schaltfläche Task ein- und ausblenden.],
) <fig:mobile>

Ein zweiter Punkt betrifft ungültige Adressen. Seit Juli existiert eine eigene Fehlerseite mit animierter Drohne, und die Routenkonfiguration weist unbekannte Parameter sauber ab. Ein Aufruf von `/level/99` landet damit auf der gestalteten Seite des Spiels statt auf einer Fehlermeldung des Servers. Das ist kein Spielelement, verhindert aber, dass eine falsche Adresse wie ein Defekt der Anwendung wirkt.

Schließlich entstand im Juli eine automatisierte Testabdeckung. 118 Testfunktionen prüfen die Spiellogik in `game.py` und `model.py` sowie den Bestenlisten-Dienst. Die Spieltests täuschen dazu das Brückenmodul zur JavaScript-Seite vor, sodass der unveränderte Quelltext unter normalem CPython läuft. Die Dienst-Tests sprechen die Anwendung im selben Prozess an und arbeiten je Test gegen eine wegwerfbare SQLite-Datenbank statt gegen Postgres. Damit ist die Spiellogik, die im Browser sonst nur schwer zu prüfen wäre, in einer gewöhnlichen Testumgebung abgesichert.

// ============================================================
= Auswertung und Diskussion <sec:auswertung>

== Zuordnung zu den Grundbedürfnissen

Die umgesetzten Elemente lassen sich den drei Grundbedürfnissen zuordnen, wobei die Zuordnung als Entwurfsargument zu verstehen ist. Dem Bedürfnis nach Kompetenz dienen die Kennzahlen je Lauf, die Abschlussanzeige, der Versuchsverlauf, die gestufte Levelreihe, das Terminal und die Hinweise bei offenen Lösungsbedingungen, da der Fortschritt dadurch abgestuft statt binär sichtbar wird und ein Fehlschlag eine benennbare Ursache erhält. Dem Bedürfnis nach Autonomie dienen der Level-Editor mit Testlauf, Export und Einreichung, die freie Wahl unter den freigeschalteten Leveln und der Gastmodus ohne Konto, da Spielende eigene Inhalte erzeugen und weitergeben können und kein Lerninhalt an ein Konto gebunden ist. Dem Bedürfnis nach sozialer Eingebundenheit dienen die Bestenliste je Level, die Konten mit sichtbarem Namen und die Einreichung eigener Level über das Repository, da der zuvor rein lokale Fortschritt einen Bezugsrahmen erhält und für andere sichtbar wird.

Alle drei Bedürfnisse sind damit besetzt. Der Kompetenzstrang ist am dichtesten ausgebaut, weil er die unmittelbare Rückmeldung auf jeden Lauf trägt. Die Autonomie ruht auf dem Editor, der die Rolle der Spielenden vom Lösen vorgegebener Aufgaben auf das Stellen eigener erweitert. Die soziale Ebene ruht auf der Bestenliste und den eingereichten Leveln; sie ist die jüngste der drei und bietet den größten Spielraum für die weiteren Schritte.

== Reichweite der Aussagen

Die Wirkungsaussagen dieser Arbeit sind Entwurfsargumente, die sich aus dem gebauten System und aus den vorangestellten Festlegungen ergeben. Eine Nutzerstudie war im Zeitrahmen des Moduls nicht vorgesehen. Eine Erhebung mit tatsächlichen Programmieranfängern ist der geeignete Weg, um die hier begründeten Wirkungen zu prüfen, weil die Zielgruppe der Anwendung genau diese Gruppe ist.

== Bewusst getroffene Festlegungen

Mehrere Entscheidungen im Entwurf hatten Alternativen, die aus guten Gründen nicht gewählt wurden. Sie werden hier zusammengefasst, weil sie den Rahmen abstecken, in dem das Ergebnis zu lesen ist.

Die Kennzahlen werden im Browser gezählt und vom Dienst übernommen. Das hält die Ausführung dort, wo sie hingehört, nämlich vollständig auf der Clientseite, und macht die Bestenliste ohne zusätzliche Rechenlast betreibbar. Für den Einsatz in einer Lehrveranstaltung ist dieses Vertrauensmodell angemessen. Für einen offen zugänglichen Wettbewerb wäre eine serverseitige Nachrechnung der eingereichten Lösung der passende Ausbauschritt.

Die Bestenliste bringt eine serverseitige Komponente in ein Projekt, das ursprünglich ohne sie auskam. Die stille Abschaltung über eine einzige Umgebungsvariable löst das sauber, weil dieselbe Auslieferung sowohl mit als auch ohne Dienst vollständig spielbar bleibt. Die Anwendung gewinnt damit den Vergleich, ohne ihre Unabhängigkeit von einem Betrieb aufzugeben.

Im Editor gebaute Level liegen im `localStorage` des jeweiligen Browsers und verlassen ihn über eine YAML-Datei oder über ein vorbereitetes GitHub-Issue. Das genügt für die Übergabe an das Projektteam und hält den Editor frei von jeder Kontopflicht. Eine Ablage im Backend, mit der sich Level unmittelbar untereinander teilen lassen, ist ein möglicher nächster Ausbauschritt.

== Wirkung der Wertung auf die Motivation

Eine eingeführte Belohnung kann die ursprüngliche Motivation überlagern, wenn sie auf etwas anderes zeigt als auf das Lernziel. Dies war beim Entwurf der Wertung der maßgebliche Prüfpunkt. Zwei Entscheidungen begrenzen dieses Risiko. Die Rangfolge nach Schritten belohnt das Verständnis des Levels, das ohnehin Lernziel ist, und lässt sich nicht durch bloßen Fleiß ersetzen. Die Beschränkung auf die erste Lösung verhindert, dass die Liste allein durch Wiederholung verbessert werden kann. Die Belohnung zeigt damit auf dieselbe Fähigkeit, die die Anwendung vermitteln soll.

// ============================================================
= Schlussfolgerung <sec:schluss>

== Zusammenfassung

Zu Beginn des Moduls konnte die Anwendung Python im Browser ausführen und eine Drohne animieren, der Ablauf endete jedoch mit dem Erreichen des Ziels. Nach der Erweiterung besteht eine geschlossene Schleife, in der ein Level eine Aufgabe stellt, die Simulation die Folgen des geschriebenen Programms zeigt, eine Auswertung die Lösung nach Schritten, Abstürzen und Codezeilen bewertet, eine Bestenliste sie neben die anderer stellt und ein Editor den Bau der nächsten Aufgabe erlaubt.

Der Umfang der Änderungen zeigt sich in den Kennzahlen des Projekts. Die spielbaren Level wuchsen von sechs auf dreizehn, die Drohnenbefehle von zehn auf vierzehn und die Blocktypen von neun auf vierzehn. Hinzu kamen ein Backend-Dienst mit Kontoverwaltung, ein dreidimensionaler Level-Editor und eine automatisierte Testabdeckung, die die Spiellogik außerhalb des Browsers absichert.

Die Auswertung zeigt, dass die umgesetzten Elemente alle drei Grundbedürfnisse erreichen und dabei den beiden vorangestellten Festlegungen folgen. Gemessen wird die Lösung und nicht die Person, und der Zugang zu den Lerninhalten hängt an keiner Belohnung.

== Nächste Schritte <ausblick>

Aus dem erreichten Stand ergeben sich mehrere Ansätze für die Weiterarbeit. Eine Nutzerstudie mit Personen ohne Programmiererfahrung, aufgeteilt in eine Gruppe mit und eine ohne aktivierte Bestenliste, könnte die hier begründeten Wirkungen empirisch prüfen. Die eingereichten Kennzahlen ließen sich durch eine serverseitige Plausibilitätskontrolle absichern, mindestens gegen eine untere Schranke der Schrittzahl je Level. Eine Ablage der im Editor gebauten Level im Backend würde es erlauben, sie ohne GitHub-Konto zu veröffentlichen und von anderen spielen zu lassen. Abzeichen für das erstmalige Lösen eines Levels mit einer Schleife, einer Funktion oder einer Bedingung könnten den bislang zurückgestellten dritten Standardbaustein besetzen, ohne den Wettbewerbsdruck zu erhöhen. Wöchentlich wechselnde oder gemeinsam zu lösende Aufgaben würden die soziale Ebene erweitern. Schließlich könnte eine zweite Wertung neben der gewerteten Erstlösung die jeweils beste eingereichte Lösung abbilden, sodass sich auch das Überarbeiten eines Programms in der Rangfolge niederschlägt.

#pagebreak()
#bibliography("my_bib.bib", title: [Literatur], style: "ieee")
