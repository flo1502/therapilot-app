
## TheraPilot – AI-Assistent für Psycholog:innen (MVP)

Eine installierbare Web-App (PWA), die Psycholog:innen bei Sessions, Notizen und Patienten-Slides unterstützt – mit Architektur, die später ein lokales LLM (Ollama) als Backend nutzen kann.

### Phase 1: Web-Prototyp mit MVP-Features (dieser Plan)

**Datenarchitektur (lokal, datenschutzkonform)**
- Alle Patienten- und Session-Daten **ausschließlich im Browser** (IndexedDB via Dexie)
- Pseudonymisierung: Patienten erhalten Kürzel (z.B. „P-2024-007") statt Klarnamen; Klarname optional verschlüsselt mit Master-Passwort (AES-GCM via Web Crypto API)
- Export/Import als verschlüsselte JSON-Datei für Backup
- Kein Cloud-Sync, keine Telemetrie

**Hauptbereiche der App**

1. **Dashboard** – Übersicht heutiger Termine, letzte Sessions, Quick-Actions
2. **Patientenverwaltung**
   - Liste mit Pseudonym, Diagnose-Tags (ICD-11), Therapieansatz
   - Patientenakte: Stammdaten, Verlauf, Sessions, Hausaufgaben, individualisierte Slides
3. **Session-Modul**
   - Vor der Session: Auto-Vorschlag basierend auf letzter Sitzung + Therapieziel
   - Während: Notiz-Editor mit Diktat (Web Speech API, lokal im Browser)
   - Nach der Session: AI strukturiert nach **SOAP** (Subjektiv, Objektiv, Assessment, Plan) oder **VT-Verlaufsbogen**
4. **Template-Bibliothek**
   - Vorgefertigte Therapie-Templates: KVT (Gedankenprotokoll, Verhaltensanalyse SORKC), ACT (Werte-Kompass, Defusion), Schematherapie (Modus-Modell), Achtsamkeit, Psychoedukation (Angst, Depression, Trauma)
   - Jedes Template = Slide-Set + Arbeitsblätter, pro Patient anpassbar
5. **Slide-Generator**
   - Auswahl Template → AI personalisiert Inhalte mit Patientenkontext (Beispiele aus deren Lebensbereich, passendes Sprachniveau)
   - Editor zum Nachbearbeiten (Text, Bilder, Reihenfolge)
   - Präsentationsmodus für Praxis-Bildschirm + PDF-Export für Patient

**AI-Integration (Phase 1: Lovable AI Gateway als Prototyp)**
- Klare Abstraktionsschicht (`src/lib/ai/provider.ts`) mit austauschbarem Provider
- Im Prototyp: Lovable AI Gateway (Gemini Flash) – **mit deutlichem Hinweis im UI**, dass für Echteinsatz auf lokales LLM gewechselt werden muss
- Patientendaten werden vor AI-Calls automatisch pseudonymisiert (Namen → Platzhalter)
- Phase 2-Hook vorbereitet: Ollama-Endpoint (`http://localhost:11434`) als Drop-in-Replacement

**Design**
- Ruhige, professionelle Ästhetik: Sage/Cream-Palette (medizinisch-warm, nicht klinisch-kalt)
- Sehr klare Typografie, viel Whitespace, keine verspielten Elemente
- Light + Dark Mode
- Komplett auf Deutsch

**PWA-Setup**
- Installierbar, funktioniert offline für alle Kernfunktionen außer AI-Calls
- Manifest + Service Worker (mit Lovable-Preview-Guard)
- Hinweis: Voller Offline-AI-Modus erst in Phase 2 (Electron + Ollama)

### Phase 2 (später, nach Prototyp-Validierung)
- Electron-Wrapper für echte Desktop-App
- Ollama-Integration für 100% lokales LLM
- Optional: Audio-Transkription mit lokalem Whisper

### MVP-Lieferumfang dieses Plans
Dashboard, Patientenverwaltung mit Verschlüsselung, Session-Notizen mit AI-Strukturierung, Template-Bibliothek mit 6–8 Start-Templates, Slide-Generator mit Präsentationsmodus, PDF-Export, deutsche UI, PWA-installierbar, AI-Provider-Abstraktion für späteren Ollama-Wechsel.
