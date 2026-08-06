Backend-Architektur für eine Psychotherapie-AI-Plattform
Baue ein sauberes, modular aufgebautes Backend für eine professionelle AI-Plattform im Bereich Psychotherapie.
Ziel
Das Backend soll drei AI-Komponenten intelligent miteinander verbinden:
1.	Lokales Therapy LLM
o	zunächst ein lokales 8B/14B Open-Weight-Modell
o	später austauschbar gegen ein eigenes Fine-Tuned Therapy Model
o	Inference über eine OpenAI-kompatible API, z. B. vLLM
o	das Modell soll nicht fest im Backend verdrahtet sein
2.	RAG-System
o	für evidenzbasierte und kontrollierte Wissensquellen
o	z. B. Leitlinien, Psychoedukation, wissenschaftliche Dokumente und freigegebene therapeutische Materialien
o	PostgreSQL + pgvector verwenden
o	Embeddings und Retrieval modular gestalten
o	später austauschbare Embedding- und Reranking-Modelle ermöglichen
3.	Externes Frontier LLM
o	als optionales stärkeres Modell für komplexe Aufgaben
o	z. B. GPT/Claude/Gemini über API
o	nicht jede Anfrage soll an das externe Modell gehen
o	das Backend soll abhängig von Aufgabe, Komplexität und Safety entscheiden, ob das lokale Modell oder das Frontier-Modell verwendet wird
 
Architektur
Verwende folgende logische Architektur:
User
↓
API
↓
Conversation Service
↓
Safety / Risk Detection
↓
AI Orchestrator
↓
Intent + Complexity Router
↓
┌─────────────────────────────┐
│ │
│ Local Therapy LLM │
│ │
│ RAG │
│ │
│ Frontier LLM │
│ │
└─────────────────────────────┘
↓
Response Validation / Safety
↓
Final Response
↓
User
Der AI Orchestrator ist die zentrale Komponente.
Er entscheidet:
•	ob RAG benötigt wird
•	ob Patient Memory benötigt wird
•	ob das lokale Modell ausreicht
•	ob ein Frontier-Modell benötigt wird
•	welches Modell für die Aufgabe geeignet ist
•	welche Informationen in den LLM-Kontext aufgenommen werden dürfen
 
Tech Stack
Verwende:
•	Python 3.12+
•	FastAPI
•	Pydantic
•	SQLAlchemy
•	PostgreSQL
•	pgvector
•	Alembic
•	httpx
•	pytest
•	Docker / Docker Compose
Optional:
•	Redis für Caching / Queueing
•	Background Worker für Dokumentverarbeitung
Das System soll zunächst lokal laufen.
 
Projektstruktur
Erstelle folgende Struktur:
backend/
│
├── app/
│ ├── main.py
│ │
│ ├── api/
│ │ ├── routes/
│ │ │ ├── chat.py
│ │ │ ├── sessions.py
│ │ │ ├── patients.py
│ │ │ ├── documents.py
│ │ │ └── health.py
│ │ │
│ │ └── dependencies.py
│ │
│ ├── core/
│ │ ├── config.py
│ │ ├── logging.py
│ │ └── security.py
│ │
│ ├── db/
│ │ ├── database.py
│ │ ├── models/
│ │ └── migrations/
│ │
│ ├── ai/
│ │ │
│ │ ├── orchestrator/
│ │ │ ├── orchestrator.py
│ │ │ ├── router.py
│ │ │ └── schemas.py
│ │ │
│ │ ├── models/
│ │ │ ├── base.py
│ │ │ ├── local_llm.py
│ │ │ └── frontier_llm.py
│ │ │
│ │ ├── rag/
│ │ │ ├── embeddings.py
│ │ │ ├── retriever.py
│ │ │ ├── reranker.py
│ │ │ └── pipeline.py
│ │ │
│ │ ├── memory/
│ │ │ ├── memory_service.py
│ │ │ └── memory_retriever.py
│ │ │
│ │ ├── safety/
│ │ │ ├── risk_detector.py
│ │ │ ├── policy.py
│ │ │ └── response_checker.py
│ │ │
│ │ └── prompts/
│ │ ├── system.py
│ │ ├── therapy.py
│ │ └── crisis.py
│ │
│ ├── services/
│ │ ├── chat_service.py
│ │ ├── session_service.py
│ │ ├── patient_service.py
│ │ └── document_service.py
│ │
│ └── schemas/
│ ├── chat.py
│ ├── patient.py
│ └── session.py
│
├── tests/
│
├── scripts/
│ └── ingest_documents.py
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
 
1. AI Model Interface
Erstelle ein gemeinsames Interface:
LLMProvider
mit z. B.:
•	generate()
•	stream()
•	health_check()
Implementiere:
LocalLLMProvider
FrontierLLMProvider
Das Backend darf niemals direkt von einem konkreten Modellnamen abhängig sein.
Beispiel:
LocalLLMProvider
→ http://localhost:8000/v1
Später:
LocalLLMProvider
→ vLLM GPU Server
FrontierLLMProvider
→ externe API
So muss beim Wechsel des Modells nicht die restliche Anwendung verändert werden.
 
2. AI Orchestrator
Erstelle einen AIOrchestrator.
Input:
•	user_message
•	patient_id
•	session_id
•	conversation_history
Der Orchestrator führt folgende Pipeline aus:
1.	Safety check
2.	Intent detection
3.	Complexity detection
4.	Patient Memory retrieval
5.	RAG retrieval
6.	Model selection
7.	Prompt construction
8.	LLM generation
9.	Response safety check
10.	Final response
 
3. Router
Der Router soll zunächst bewusst einfach und nachvollziehbar sein.
Beispiel:
if crisis_detected:
use_crisis_workflow()
elif requires_clinical_knowledge:
retrieve_rag()
use_local_therapy_llm()
elif requires_complex_reasoning:
use_frontier_llm()
else:
use_local_therapy_llm()
Der Router soll später leicht durch ein trainiertes Routing-Modell ersetzt werden können.
 
4. RAG Pipeline
Implementiere:
Document
→ text extraction
→ cleaning
→ chunking
→ embedding
→ PostgreSQL/pgvector
Bei einer Anfrage:
User query
→ query embedding
→ vector search
→ optional keyword search
→ merge
→ reranking
→ top relevant chunks
→ LLM context
Jeder Chunk muss Metadaten enthalten:
•	document_id
•	source
•	title
•	author
•	publication_date
•	document_type
•	topic
•	chunk_id
Die Quelle soll später in der Antwort nachvollziehbar sein.
 
5. Patient Memory
Patient Memory muss strikt vom allgemeinen RAG getrennt sein.
RAG = allgemeines klinisches Wissen.
Memory = patientenspezifische Informationen.
Beispiele für Memory:
•	Therapieziele
•	bisher besprochene Themen
•	Präferenzen
•	relevante frühere Sitzungsinformationen
Bei jeder Anfrage darf nur relevanter Memory-Content in den Prompt gelangen.
Keine komplette Patientendatenbank in den LLM-Kontext laden.
 
6. Context Builder
Erstelle einen ContextBuilder.
Er soll dynamisch einen sicheren LLM-Kontext erzeugen:
SYSTEM INSTRUCTIONS
+
SAFETY INSTRUCTIONS
+
RELEVANT PATIENT MEMORY
+
RELEVANT RAG CONTEXT
+
RECENT CONVERSATION
+
USER MESSAGE
Der ContextBuilder soll Token-Limits berücksichtigen.
 
7. Safety
Safety muss VOR und NACH dem LLM laufen.
Input:
User message
→ Risk detector
Output beispielsweise:
{
"risk_level": "low",
"self_harm": false,
"suicide": false,
"psychosis": false,
"requires_special_flow": false
}
Bei erhöhtem Risiko darf nicht einfach der normale Chat-Flow verwendet werden.
Implementiere zunächst eine klare Safety-Abstraktion, sodass später ein spezialisiertes Safety Model integriert werden kann.
 
8. Response Validation
Nach jeder LLM-Antwort:
Response
→ safety checker
→ policy checker
→ final response
Wenn die Antwort nicht akzeptabel ist:
1.	nicht direkt an den Nutzer senden
2.	entweder regenerieren
3.	auf ein anderes Modell wechseln
4.	sicheren Fallback verwenden
 
9. Chat API
Implementiere:
POST /api/chat
Request:
{
"patient_id": "...",
"session_id": "...",
"message": "..."
}
Response:
{
"message": "...",
"model_used": "...",
"rag_used": true,
"sources": [],
"risk_level": "low"
}
Im Production-System dürfen interne Modell-/Routinginformationen nicht unnötig an Patienten exponiert werden. Die Response-Struktur soll deshalb später leicht zwischen interner und externer API angepasst werden können.
 
10. Konfiguration
Alle Modell- und Infrastrukturinformationen über Environment Variables.
Beispiel:
LOCAL_LLM_BASE_URL=
LOCAL_LLM_MODEL=
FRONTIER_LLM_API_KEY=
FRONTIER_LLM_MODEL=
DATABASE_URL=
EMBEDDING_MODEL=
RAG_TOP_K=
RERANK_TOP_K=
Nie API Keys hardcoden.
Erstelle .env.example.
 
11. Docker
Erstelle Docker Compose für lokale Entwicklung.
Services:
•	backend
•	postgres
•	optional redis
Das lokale LLM soll zunächst als externer Service konfigurierbar sein, damit das Backend nicht zwingend die GPU selbst enthalten muss.
Beispiel:
backend
→ http://local-llm:8000/v1
Die Architektur muss später erlauben:
Development:
Laptop → lokales LLM
Production:
Backend → separater GPU Server → vLLM
 
12. Datenschutz und Security
Da es sich um eine Psychotherapie-Anwendung handelt:
•	keine Secrets im Code
•	keine Patientendaten in normalen Application Logs
•	Audit Logging vorbereiten
•	Datenzugriff strikt über patient_id / tenant_id isolieren
•	Rollen und Berechtigungen vorbereiten
•	personenbezogene Daten minimieren
•	keine Trainingsverwendung von Patientendaten standardmäßig
•	Datenflüsse klar trennen
•	externe LLM-Aufrufe müssen explizit kontrollierbar sein
Baue keine medizinischen oder rechtlichen Behauptungen in die Anwendung ein.
Die Architektur soll später professionell auf DSGVO, Datenschutz-Folgenabschätzung und gegebenenfalls Medizinprodukterecht geprüft werden können.
 
13. Tests
Erstelle Tests für:
•	Local LLM Provider
•	Frontier LLM Provider
•	Router
•	RAG retrieval
•	Memory retrieval
•	Safety detection
•	Context building
•	response validation
•	complete AI pipeline
Erstelle außerdem Mock-LLMs, damit die Tests keine externen APIs benötigen.
 
14. Wichtig: Modularität
Ich möchte später problemlos:
PsyCoPref
→ eigenes Therapy Model
oder
Llama
→ anderes Open-Weight-Modell
oder
Frontier API A
→ Frontier API B
austauschen können.
Ebenso:
pgvector
→ andere Vector Database
ohne die gesamte Anwendung umzubauen.
Keine unnötige Framework-Komplexität.
Kein Microservice-System im MVP.
Bevorzuge zunächst einen modularen Monolithen.
 
15. Ergebnis
Erstelle zuerst die komplette Backend-Struktur und die Interfaces.
Danach implementiere einen minimal funktionierenden End-to-End-Flow:
User
→ /api/chat
→ Safety
→ Router
→ RAG optional
→ Local LLM
→ Response Safety
→ Response
Der erste funktionierende Flow soll mit einem Mock Local LLM funktionieren, auch wenn noch kein echtes Modell installiert ist.
Danach kann der echte lokale LLM Provider über eine OpenAI-kompatible API angeschlossen werden.
Erkläre nach der Implementierung:
1.	Welche Dateien erstellt wurden
2.	Wie die Komponenten miteinander kommunizieren
3.	Wie das lokale LLM angeschlossen wird
4.	Wie RAG angeschlossen wird
5.	Wie später ein Frontier LLM angeschlossen wird
6.	Wie das System gestartet wird
7.	Welche Teile als Nächstes implementiert werden sollten
Baue zunächst keine unnötigen Features. Priorität ist eine saubere, testbare AI-Orchestrator-Architektur.
<img width="468" height="643" alt="image" src="https://github.com/user-attachments/assets/db2556d2-9706-4458-aba2-0b84ccc17a7a" />
