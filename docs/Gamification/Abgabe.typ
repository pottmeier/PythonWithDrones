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
    [Abgabedatum:], [28.09.2026],
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
#heading(numbering: none)[Abstrakt]

#emph[PythonWithDrones] ist eine Lernanwendung, in der Python-Quelltext eine virtuelle Drohne durch dreidimensionale Level steuert. Zum Abschluss des Vorgängermoduls lag ein lauffähiger Prototyp vor, dessen Ablauf mit dem Erreichen des Zielportals endete @vorarbeit. Danach war die Interaktion beendet. Die vorliegende Arbeit beschreibt, wie diese Anwendung zwischen dem 10. April und dem 28. September 2026 zu einem Spiel mit geschlossener Schleife ausgebaut wurde. Hinzugekommen sind ein erweiterter Handlungsraum der Drohne mit Schieben, Aufnehmen, Abliefern und Vorausschauen, eine auf dreizehn Level verlängerte Aufgabenkurve, eine Auswertung jedes Laufs nach Abstürzen, geflogenen Feldern und Codezeilen, eine serverseitige Bestenliste mit Kontoverwaltung und Versuchsverlauf sowie ein dreidimensionaler Level-Editor, mit dem Spielende eigene Aufgaben bauen und einreichen können. Begleitet wird das von einer überarbeiteten mobilen Darstellung, einer eigenen Fehlerseite und einer automatisierten Testabdeckung. Die Auswertung ordnet die umgesetzten Elemente den drei Grundbedürfnissen Kompetenz, Autonomie und soziale Eingebundenheit zu und begründet, wie die einzelnen Entwurfsentscheidungen zusammenwirken.

= Einleitung

Zum Abschluss des vorangegangenen Moduls lag eine funktionsfähige Anwendung vor. Python wurde im Browser ausgeführt, die Drohne ließ sich steuern, und die vorhandenen Level waren lösbar. Die Anwendung unterschied je Level jedoch nur zwei Zustände, das Erreichen oder das Nichterreichen des Zielportals. Der Umfang einer Lösung, die Zahl der Fehlversuche und die Frage, ob nach Abschluss des letzten Levels ein Anlass zur weiteren Nutzung bestand, blieben unberücksichtigt.

Die vorliegende Arbeit hat das Ziel, diese Anwendung um Spielelemente zu erweitern und die dabei getroffenen Entwurfsentscheidungen zu begründen. Untersucht wird, welche Elemente aus dem Spieldesign sich in eine bestehende Lernanwendung einfügen lassen, welche Wirkung strukturell von ihnen zu erwarten ist und welche Kosten sie im Betrieb verursachen. Die Ausführung von Python im Browser ist nicht Gegenstand der Arbeit, da sie im Vorgängermodul entwickelt wurde @vorarbeit. Gamifizierung wird nicht als nachträgliche Ergänzung einer fertigen Anwendung verstanden, sondern als Eingriff in deren Regeln, der verändert, worauf Lernende beim Schreiben ihres Programms achten.

Die Arbeit stützt sich auf den Quelltext des Projekts und seine Versionsgeschichte @repo sowie auf die Ausarbeitung des Vorgängermoduls @vorarbeit. Als Ausgangspunkt dient das Tag `v1.0.0` vom 10. April 2026, das den Stand zum Abschluss des Vorgängermoduls markiert. Der Betrachtungszeitraum umfasst die Änderungen zwischen diesem Stand und dem 28. September 2026.

// ============================================================
= Stand der Forschung <sec:stand>

Die Umsetzung baut auf einem etablierten Satz an Werkzeugen aus dem Web- und Backend-Bereich auf, ohne selbst neue Technologie einzuführen. Next.js dient als React-Framework für den statischen Seitenexport @nextjs. Pyodide bringt einen zu WebAssembly übersetzten CPython-Interpreter in den Browser und macht damit eine serverseitige Python-Ausführung überflüssig @pyodide. React Three Fiber bindet die 3D-Bibliothek Three.js deklarativ in React-Komponenten ein und trägt die im Browser laufende Drohnenszene @threefiber. Auf der Serverseite stellt FastAPI die asynchrone Web-Schnittstelle der Bestenliste bereit @fastapi, SQLAlchemy vermittelt den objektrelationalen Zugriff darauf @sqlalchemy, und PostgreSQL hält die Daten persistent @postgres. Alle fünf Bausteine sind quelloffen, gut dokumentiert und bereits im Vorgängermodul beziehungsweise im bestehenden Projekt im Einsatz @vorarbeit. Die vorliegende Arbeit erweitert diesen Stack um die in @sec:ausgangslage beschriebenen Fähigkeiten, statt ihn auszutauschen.

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

Gamifizierung bezeichnet in dieser Arbeit den Einsatz einzelner Elemente aus dem Spieldesign in einem Zusammenhang, der selbst kein Spiel ist @deterding2011. Maßgeblich ist die Beschränkung auf einzelne Elemente. Die Lernanwendung wird nicht zu einem Spiel umgebaut. Übernommen werden stattdessen einzelne Bausteine, deren Wirkung aus Spielen bekannt ist. Die drei am häufigsten übernommenen Bausteine sind Punkte, Abzeichen und Bestenlisten @werbach2012. Punkte machen eine Leistung zählbar, Abzeichen machen sie sichtbar, und Bestenlisten machen sie vergleichbar. Im vorliegenden Projekt sind die Punkte als Kennzahlen je Lauf und die Bestenliste umgesetzt, während Abzeichen zurückgestellt sind.

== Mechanik, Dynamik und Erfahrung

Der Entwurf trennt drei Ebenen, wie sie im MDA-Rahmenwerk des Spieldesigns beschrieben sind @hunicke2004. Die Mechanik ist die Regel, die im Quelltext geschrieben wird. Die Dynamik ist das Verhalten, das im Betrieb daraus entsteht. Die Erfahrung ist das Ergebnis, das bei den Spielenden ankommt. Die Trennung ist nützlich, weil auf der Ebene der Mechanik gebaut wird, während die Wirkung auf der Ebene der Erfahrung eintritt und die dazwischenliegende Dynamik sich nur mittelbar festlegen lässt.

Im vorliegenden Projekt lässt sich das an der Bestenliste zeigen. Die Mechanik ist deren Sortierreihenfolge. Die daraus entstehende Dynamik ist, dass Spielende ihren Lösungsweg kürzen, statt ihn nur lauffähig zu machen. Die Erfahrung ist die eines gefundenen, kompakten Lösungswegs. Die Aufgabe des Entwurfs besteht darin, die Mechanik so zu wählen, dass die beabsichtigte Dynamik entstehen kann.

== Drei Grundbedürfnisse

Als Ordnungsrahmen dienen drei Bedürfnisse aus der Selbstbestimmungstheorie, die eine Tätigkeit aus sich heraus tragen können @deci2000. Kompetenz bezeichnet das Erleben, besser zu werden. Das setzt voraus, dass Fortschritt abgestuft sichtbar ist und ein Fehlschlag eine benennbare Ursache hat. Autonomie bezeichnet den Spielraum, eigene Entscheidungen zu treffen, bis hin zur Wahl und zum Bau einer eigenen Aufgabe. Soziale Eingebundenheit bezeichnet den Bezug zu anderen, sei es über einen Vergleich, einen sichtbaren Namen oder geteilte Inhalte. Das Raster macht die Verteilung der umgesetzten Elemente sichtbar und zeigt, ob ein Entwurf alle drei Bedürfnisse adressiert.

== Passung von Anforderung und Fähigkeit

Eine Aufgabe trägt dann, wenn ihre Anforderung und die Fähigkeit der Lösenden in einem engen Verhältnis stehen, das der Flow-Theorie als Flow-Kanal beschrieben wird @csikszentmihalyi1990. Liegt die Anforderung darüber, entsteht Überforderung. Liegt sie darunter, entsteht Langeweile. Für eine Lernanwendung mit fester Reihenfolge folgt daraus, dass die Steigerung zwischen zwei Leveln weder zu klein noch zu groß sein darf und dass erkennbar sein sollte, was ein Level verlangt, bevor es geöffnet wird.

== Festlegungen für jedes Spielelement <sec:einwaende>

Aus dem Zweck der Anwendung ergeben sich zwei Festlegungen, die für jedes eingebaute Spielelement gelten. Die gemessenen Größen sind Eigenschaften der Lösung und nicht des Verhaltens, das zu ihr geführt hat. Eine Wertung, die belohnt, wer am meisten Zeit aufwendet oder am schnellsten tippt, erfasst nicht den vermittelten Inhalt, während eine Wertung nach der Zahl der Schritte das Verständnis des Levels erfasst. Zudem steuert keine Belohnung den Zugang zu Lerninhalten. Jedes Level bleibt ohne Konto, ohne Bestenliste und ohne Serverbetrieb vollständig spielbar. Ein Spielelement darf den Reiz einer Aufgabe erhöhen, ihn aber nicht ersetzen, und es darf niemanden ausschließen.

// ============================================================
= Methodik <sec:methodik>

== Überblick

Die Änderungen im Betrachtungszeitraum lassen sich in sechs Arbeitssträngen zusammenfassen, die aufeinander aufbauen. Der erweiterte Handlungsraum ist Voraussetzung für Level mit mehr als einem Lösungsweg, die erhobenen Kennzahlen sind Voraussetzung für eine sortierbare Bestenliste. Der Handlungsraum der Drohne wuchs um Schieben, Aufnehmen, Abliefern und Vorausschauen, dazu kamen fünf neue Blocktypen und Lösungsbedingungen im Levelformat. Darauf aufbauend wuchs die Aufgabenkurve von sechs auf dreizehn Level bei überarbeiteter Einstiegsreihe und Schlagworten als Vorschau. Die Laufauswertung erfasst seither Abstürze, geflogene Felder und Codezeilen je Lauf und zeigt sie nach Abschluss an. Ein Terminal gibt zusätzlich `print`-Ausgaben aus. Auf dieser Grundlage entstand eine Bestenliste als FastAPI-Dienst mit Postgres-Datenbank, Konten, JWT-Anmeldung, Rangfolge und Versuchsverlauf. Parallel dazu wurde ein dreidimensionaler Level-Editor mit Testlauf, YAML-Export und Einreichung über GitHub gebaut. Der sechste Strang bündelt Reibungsabbau, darunter die Darstellung auf schmalen Bildschirmen, eine eigene Fehlerseite und eine automatisierte Testabdeckung.

== Erweiterter Handlungsraum der Drohne

=== Neue Befehle

Solange die Drohne nur fliegen und sich drehen konnte, bestand jedes Ziel darin, eine Position zu erreichen. Level unterschieden sich allein in der Geometrie des Weges. Vier neue Befehle verändern oder prüfen seither den Zustand der Welt. `drone.push()` schiebt einen schiebbaren Block ein Feld weiter und rückt selbst nach. Ist das Zielfeld belegt, bleibt die Aktion folgenlos und nennt den Grund. `drone.pickup()` und `drone.deliver()` nehmen ein Paket auf und legen es wieder ab. Beide melden, wenn nichts aufzunehmen oder abzulegen ist. `drone.scan(n)` liefert die Block-Kennungen der nächsten `n` Felder in Blickrichtung und bricht am ersten blockierenden Feld ab, ohne Argument nur die eine nächste Kennung.

`scan` ersetzt die frühere Abfrage `is_path_blocked`, die nur einen Wahrheitswert lieferte. Eine Zeichenkette zwingt zum Vergleichen, ein Wahrheitswert führt direkt in eine `if`-Anweisung. Level können damit verlangen, dass die Drohne unterscheidet, worauf sie trifft, statt nur, ob überhaupt.

=== Lösungsbedingungen

Damit die neuen Handlungen Bedeutung bekommen, wuchs das Levelformat mit. Ein Level kann jetzt zusätzlich zum Portal verlangen, dass Münzen eingesammelt, ein Paket abgeliefert oder eine Kiste auf ein markiertes Feld geschoben wurde. Die Prüfung läuft im Levelmodell, sobald die Drohne das Portal betritt. Ist eine Bedingung offen, meldet die Python-Seite dies über eine `hint`-Nachricht, die benennt, was noch fehlt.

== Aufgabenkurve

Der Levelbestand wuchs von sechs auf dreizehn. Ein Teil davon entstand aus einer Überarbeitung der Einstiegsreihe, bei der die ersten Level neu geordnet und ihre Beschreibungen gestrafft wurden. Die neuen Level greifen die erweiterten Befehle auf, sodass jeder Schritt der Reihe entweder ein Programmierkonzept oder eine Drohnenfähigkeit einführt und möglichst nicht beides gleichzeitig.

Jedes Level trägt seither Schlagworte, die in der Übersicht angezeigt werden und eine grobe Schwierigkeit sowie das behandelte Konzept nennen, etwa Schleifen, Funktionen oder Bedingungen. Diese Vorschau setzt die in @sec:grundlagen beschriebene Passung von Anforderung und Fähigkeit um, weil die Einordnung sichtbar wird, bevor ein Level geöffnet wird. Gesperrte Level bleiben in der Übersicht sichtbar und tragen nur ein Schloss, denn ein sichtbares, aber verschlossenes Ziel wirkt als Anreiz, ein ausgeblendetes nicht. @fig:home zeigt die resultierende Übersicht.

== Kennzahlen und Rückmeldung eines Laufs

=== Kennzahlen

Die Python-Seite führt zwei Zähler. `distance` steigt bei jedem Ortswechsel, `crash_count` bei jeder Kollision. Beide gehen über `get_stats()` an den Hauptthread. Die dritte Kennzahl, die Codezeilenzahl, ermittelt die Oberfläche selbst aus dem eingegebenen Text.

Diese Auswahl folgt der ersten Festlegung aus @sec:einwaende. Alle drei Größen beschreiben das Programm, nicht die Person. Wegzahl, Kollisionshäufigkeit und Formulierungskompaktheit sind Eigenschaften des Algorithmus. Die Tippgeschwindigkeit gehört nicht dazu.

=== Terminal

`print`-Ausgaben liefen ursprünglich nur in die Entwicklerkonsole des Browsers und waren damit für die Zielgruppe praktisch unsichtbar, obwohl `print` das erste Werkzeug für Programmzustände ist. Der Worker leitet die Ausgabe jetzt zusätzlich an den Hauptthread weiter, wo sie unter dem Editor in einem Terminalbereich erscheint. Auf demselben Weg laufen auch Hinweistexte der Drohnenbefehle, etwa wenn `pickup` ins Leere greift.

Der Beitrag zur Gamifizierung ist hier kein Spielelement, sondern eine kürzere Rückmeldeschleife. Ein Fehler mit sichtbarer Ursache führt eher zu einem weiteren Versuch als einer ohne.

== Architektur der Bestenliste

Die Bestenliste ist der einzige Projektteil mit serverseitiger Komponente. Sie läuft als FastAPI-Dienst @fastapi mit Postgres-Datenbank @postgres, gestartet zusammen mit dem Frontend über Docker Compose. Der Datenbankzugriff läuft asynchron über SQLAlchemy @sqlalchemy. Kennwörter werden mit Argon2 gehasht, die Anmeldung liefert ein JWT, und Anmelde- sowie Registrierungsrouten sind ratenbegrenzt.

Drei Tabellen tragen den Dienst. `users` hält die Konten. Ein Index auf der kleingeschriebenen Fassung verhindert Namen, die sich nur in Groß- und Kleinschreibung unterscheiden. `scores` hält je Konto und Level genau die erste Lösung, `attempts` jeden Versuch. Der Vergleich mit anderen beruht damit auf der Erstlösung, während der eigene Verlauf vollständig bleibt. Die Rangfolge selbst richtet sich zuerst nach der Schrittzahl, dann nach der Zeit und zuletzt nach der Codezeilenzahl. Die Zeit läuft als Wanduhr im Hauptthread zwischen Öffnen des Levels und erster Lösung und ist damit unabhängig von Animationsgeschwindigkeit oder Interpreterlaufzeit. @sec:ergebnisse zeigt das resultierende Schema und die Oberfläche.

=== Was gewertet wird

Die Reihenfolge der Kriterien ist die zentrale Entscheidung dieses Strangs. Stünde die Zeit zuerst, bildete die Bestenliste vor allem Tippgeschwindigkeit und Vorkenntnis ab. Die Schrittzahl dagegen ist eine Eigenschaft des gefundenen Wegs und verbessert sich nur durch besseres Verständnis des Levels.

Gewertet wird nur die erste Lösung eines Levels. Die Liste bleibt so ein Vergleich der Lösungsqualität, nicht der aufgewendeten Zeit. Die Tabelle `attempts` hält ergänzend den vollständigen Verlauf, den Angemeldete in der eigenen Fortschrittsanzeige einsehen können.

=== Betrieb ohne Backend

Die Anwendung bleibt ohne Server benutzbar, weil sie als statischer Export auf GitHub Pages liegt. Fehlt die Umgebungsvariable des API-Clients, liefert jeder Aufruf `null`, und die Bestenliste bleibt ohne Fehler einfach leer. Das Spiel funktioniert dann vollständig, nur ohne Vergleich. Ein Gastmodus im Anmeldedialog macht auch die Anmeldung zur Option statt zur Voraussetzung.

== Level-Editor

=== Aufbau

Der Editor ist der umfangreichste Einzelbeitrag des Betrachtungszeitraums, über mehrere Durchgänge gewachsen. Er läuft vollständig im Browser und arbeitet auf derselben Datenstruktur wie das Spiel selbst.

Die Oberfläche trennt zwei Modi. Im Bearbeitungsmodus platziert oder löscht ein Klick einen Block auf der aktiven Ebene, im Kameramodus dreht und zoomt derselbe Klick die Ansicht. Die Alt-Taste schaltet vorübergehend auf Kamera um, die X-Taste auf Löschen, denn beide Wechsel sind beim Bauen ständig nötig. Ein Werkzeug legt zusätzlich den Startpunkt der Drohne fest. Alle Ebenen bleiben sichtbar, die aktive hebt ein Gitter hervor, damit die Tiefe beim Bauen erhalten bleibt. Zwei Formulare legen die Ausdehnung in allen drei Achsen sowie Titel, Beschreibung und Schlagworte fest. Der Wechsel per Taste statt per Menüklick hält den Bauprozess nah am Ausprobieren, das auch das Lösen eines Levels prägt.

=== Vom Entwurf zum Level

Drei Wege führen aus dem Editor heraus. Der Testlauf öffnet das Level in einem Dialog mit vollständiger Spielumgebung, also eigenem Editor, eigener Pyodide-Instanz @pyodide und eigener Szene, die erst beim Öffnen entsteht und beim Schließen wieder verworfen wird. Der Export schreibt eine YAML-Datei in den Download-Ordner, die Einreichung öffnet ein vorbereitetes GitHub-Issue mit bereits eingetragenem YAML. Editor und Spiel teilen sich dafür dieselbe Datenstruktur ohne Umweg über das Dateisystem.

Lösungsbedingungen mussten Autoren ursprünglich von Hand eintragen. Der Editor leitet sie inzwischen aus dem gebauten Level ab. Wer drei Münzen platziert, baut ein Level mit drei einzusammelnden Münzen. Geometrie und Bedingung laufen so nicht mehr auseinander, und der Bauvorgang wird kürzer.

== Reibungsabbau

Der sechste Strang bündelt Arbeiten, die selbst keine Spielelemente sind, aber Voraussetzung dafür, dass die anderen fünf wirken.

Die Darstellung auf schmalen Bildschirmen wurde überarbeitet. Betroffen waren der Ebenenwähler des Editors, ein nie gebundenes Mausradereignis und eine überfüllte Kopfzeile. Da ein erheblicher Teil der Zugriffe von Mobilgeräten kommt, entscheidet diese Ebene, ob die erste Aufgabe überhaupt erreicht wird.

Seit Juli fängt eine eigene Fehlerseite mit animierter Drohne ungültige Level-Adressen ab, statt eine Fehlermeldung des Servers zu zeigen. Das ist kein Spielelement, verhindert aber, dass eine falsche Adresse wie ein Defekt wirkt.

Schließlich entstand eine automatisierte Testabdeckung. Die Spieltests täuschen das Brückenmodul zur JavaScript-Seite vor, sodass der unveränderte Quelltext unter CPython läuft. Die Dienst-Tests laufen im selben Prozess je Test gegen eine wegwerfbare SQLite-Datenbank statt gegen Postgres. So ist die im Browser schwer prüfbare Spiellogik in einer gewöhnlichen Testumgebung abgesichert.

// ============================================================
= Ergebnisse <sec:ergebnisse>

Die in @sec:methodik beschriebenen Arbeitsstränge haben eine zuvor nicht vorhandene, geschlossene Spielschleife hervorgebracht. Jede Auswertung führt jetzt auf eine mögliche nächste Handlung, statt den Ablauf mit dem Ziel enden zu lassen. @tbl:kennzahlen fasst den quantitativen Zuwachs zwischen `v1.0.0` und dem Ende des Betrachtungszeitraums zusammen.

#figure(
  table(
    columns: (1fr, auto, auto),
    align: (left, center, center),
    table.header([Kennzahl], [`v1.0.0`], [28.09.2026]),
    [Spielbare Level], [6], [13],
    [Öffentliche Drohnen-Methoden], [10], [14],
    [Blocktypen], [9], [14],
    [Testfunktionen], [0], [118],
  ),
  caption: [Wachstum der zentralen Kennzahlen zwischen dem Ausgangsstand `v1.0.0` und dem Ende des Betrachtungszeitraums.],
) <tbl:kennzahlen>

== Neue Bausteine und Levelübersicht

Neu in der Blockregistrierung sind Münze, Kiste, Paket, Ablagefläche und Zielmarkierung. @fig:scene zeigt ein Level, das drei davon gleichzeitig nutzt. @fig:home zeigt die in @sec:methodik beschriebene Levelübersicht mit Schwierigkeits- und Konzept-Schlagworten.

#figure(
  image("Images/level-scene.png", width: 100%),
  caption: [Level #emph[Push ’n Collect] vor dem ersten Lauf. Die Kiste versperrt den Weg, die Münze liegt auf einem Seitenpfad.],
) <fig:scene>

#figure(
  image("Images/home.png", width: 100%),
  caption: [Levelübersicht mit dreizehn Einträgen. Schlagworte kündigen Schwierigkeit und Konzept an, gesperrte Level tragen ein Schloss.],
) <fig:home>

== Rückmeldung und Bestenliste

Beim Erreichen des Ziels erscheint eine Anzeige mit Zeit, den drei Kennzahlen und einem knappen, an der Absturzzahl bemessenen Kommentar (@fig:run). @fig:schema zeigt das resultierende Datenbankschema. Jedes Konto in `users` kann beliebig viele Zeilen in `scores` und `attempts` besitzen, `scores` erzwingt zusätzlich Eindeutigkeit je Konto und Level. @fig:leaderboard zeigt die daraus gespeiste Bestenliste, deren Sortierung zuerst der Schrittzahl folgt.

#figure(
  image("Images/level-run.png", width: 100%),
  caption: [Die Abschlussanzeige nach einem gelösten Level mit Zeit, Abstürzen, geflogenen Feldern und Codezeilen. Unten links zeigt das Terminal die Ausgaben der beiden `print`-Aufrufe.],
) <fig:run>

#figure(
  image("Images/leaderboard-schema.png", width: 92%),
  caption: [Datenbankschema der Bestenliste.],
) <fig:schema>

#figure(
  image("Images/leaderboard.png", width: 100%),
  caption: [Die Bestenliste einer laufenden Instanz. Die Reihenfolge folgt zuerst der Schrittzahl.],
) <fig:leaderboard>

== Level-Editor und mobile Darstellung

@fig:editor zeigt den Level-Editor mit einem geladenen Level, links Modus, Werkzeuge, Blockpalette und Größenangaben, oben die Aktionen Export, Einreichung, Testlauf und Speichern. @fig:mobile zeigt die Levelansicht auf einem schmalen Bildschirm. Szene und Editor stehen dort untereinander statt nebeneinander.

#figure(
  image("Images/editor-3d.png", width: 100%),
  caption: [Der Level-Editor mit einem geladenen Level.],
) <fig:editor>

#figure(
  placement: auto,
  image("Images/mobile-level.png", width: 34%),
  caption: [Levelansicht auf schmalem Bildschirm.],
) <fig:mobile>

// ============================================================
= Diskussion <sec:diskussion>

== Zuordnung zu den Grundbedürfnissen

Kennzahlen, Abschlussanzeige, Versuchsverlauf, gestufte Levelreihe, Terminal und Hinweise bei offenen Lösungsbedingungen machen Fortschritt abgestuft statt binär sichtbar und geben Fehlschlägen eine benennbare Ursache. Das bedient die Kompetenz. Der Level-Editor adressiert Autonomie, die Punkte und Bestenliste nicht bedienen. Er verschiebt die Rolle vom Lösen vorgegebener Aufgaben zum Stellen eigener, ohne dafür ein Konto zu verlangen. Das Bauen eines lösbaren Levels erfordert zudem, die Simulationsregeln vollständig zu verstehen, und der Editor senkt zugleich den Aufwand für neue Level von handgeschriebenem YAML auf ein Formular. Sozial eingebunden wird, wer über Bestenliste, Kontoname oder eigene Level in Bezug zu anderen tritt. Der vorher rein lokale Fortschritt bekommt so einen Rahmen außerhalb des eigenen Browsers.

Am weitesten ausgebaut ist der Kompetenzstrang, weil er auf jeden Lauf unmittelbar zurückwirkt. Die soziale Ebene ist mit Bestenliste und eingereichten Leveln die jüngste und bietet den größten Spielraum für Weiterarbeit.

== Einschränkungen und Reichweite der Aussagen

Die Wirkungsaussagen dieser Arbeit sind Entwurfsargumente aus dem gebauten System und den vorangestellten Festlegungen, keine empirischen Befunde. Eine Nutzerstudie war im Zeitrahmen nicht vorgesehen.

Drei weitere Einschränkungen bestehen.

- Fehlende Funktionalität: Abzeichen als dritter Gamifizierungs-Baustein sind zurückgestellt, eine serverseitige Plausibilitätsprüfung der Kennzahlen existiert nicht.
- Verwendete Mittel: Level verlassen den Editor nur per YAML-Export oder GitHub-Issue, ohne GitHub-Konto lässt sich keines veröffentlichen.
- Qualität: Die Bestenliste vertraut den Client-Kennzahlen vollständig, in einem offenen Wettbewerb ließe sich das ausnutzen.

== Bewusst getroffene Festlegungen

Mehrere Entwurfsentscheidungen hatten Alternativen, die aus guten Gründen nicht gewählt wurden.

Kennzahlen werden im Browser gezählt und unverändert übernommen. Das hält die Ausführung clientseitig und die Bestenliste ohne zusätzliche Rechenlast. Für eine Lehrveranstaltung reicht dieses Vertrauensmodell aus. In einem offenen Wettbewerb müsste der Dienst die Lösung selbst nachrechnen.

Die Bestenliste bringt eine serverseitige Komponente in ein zuvor serverloses Projekt. Eine Umgebungsvariable schaltet sie bei Bedarf still ab, statt sie zur Voraussetzung zu machen. Dieselbe Auslieferung bleibt so mit und ohne Dienst vollständig spielbar. Der Gastmodus hält zusätzlich die zweite Festlegung aus @sec:einwaende ein, denn kein Lerninhalt hängt an einer Belohnung.

Im Editor gebaute Level liegen im `localStorage` und verlassen ihn nur über YAML-Export oder GitHub-Issue. Für die Übergabe an das Projektteam genügt das, ohne den Editor an eine Kontopflicht zu binden.

== Wertungslogik und Motivation

Eine Belohnung, die auf etwas anderes zeigt als das Lernziel, kann die ursprüngliche Motivation überlagern @deci2000. Das war der maßgebliche Prüfpunkt beim Entwurf der Wertung. Zwei Entscheidungen begrenzen dieses Risiko. Die Rangfolge nach Schritten belohnt Levelverständnis statt bloßen Fleiß, und die Beschränkung auf die erste Lösung verhindert, dass Wiederholung allein die Liste verbessert. Beide zusammen richten die Belohnung auf dieselbe Fähigkeit, die die Anwendung vermitteln soll.

// ============================================================
= Schlussfolgerung <sec:schluss>

== Zusammenfassung

Zu Modulbeginn führte die Anwendung Python im Browser aus und animierte eine Drohne, doch der Ablauf endete mit dem Ziel. Jetzt besteht eine geschlossene Schleife. Ein Level stellt eine Aufgabe, eine Auswertung bewertet die Lösung nach Schritten, Abstürzen und Codezeilen, eine Bestenliste stellt sie neben andere, und ein Editor öffnet den Weg zur nächsten Aufgabe.

Die Kennzahlen zeigen den Umfang. Drohnen-Methoden wuchsen von zehn auf vierzehn, Blocktypen von neun auf vierzehn, Level von sechs auf dreizehn. Hinzu kamen ein optionaler FastAPI-Dienst mit Konten, Rangfolge und Versuchsverlauf, ein dreidimensionaler Level-Editor mit Testlauf und GitHub-Einreichung sowie 118 Testfunktionen, die Spiellogik und Bestenlisten-Dienst außerhalb des Browsers absichern.

== Nächste Schritte <ausblick>

Eine Nutzerstudie mit und ohne aktivierte Bestenliste könnte die hier begründeten Wirkungen empirisch prüfen. Eine serverseitige Plausibilitätskontrolle, etwa eine untere Schranke der Schrittzahl, würde die eingereichten Kennzahlen absichern. Abzeichen für das erstmalige Lösen eines Levels mit Schleife, Funktion oder Bedingung könnten den zurückgestellten dritten Gamifizierungs-Baustein besetzen. Eine Ablage eingereichter Level im Backend würde sie ohne GitHub-Konto veröffentlichbar machen und ließe sich zu einer rotierenden Auswahl kuratieren, die die soziale Ebene über den Rangvergleich hinaus erweitert.

#pagebreak()
#bibliography("my_bib.bib", title: [Literatur], style: "ieee")
