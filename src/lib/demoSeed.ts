// Demo-Seed: Mittelgradige Depression (F32.1), 4 Sitzungen.
// Vollständig statisch – kein AI-Call nötig. Schreibt in Dexie; cloudSync pusht
// in die geteilte Supabase-Tabelle (sofern eingeloggt).

import { db, type Patient, type SessionEntry } from "./db";
import { emptyAnamneseProfile, type AnamneseProfile, type AnamneseField } from "./anamneseTypes";
import type { KVDocumentation, KVExtraction } from "./kvDocTypes";
import type { SchemaAnalysisResult } from "./schemaTypes";
import type { SessionKPIs } from "./kpiTypes";

export const DEMO_PATIENT_ID = "P-2026-001";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const now = Date.now();

function f(text: string, sessionId: string, sessionNr: number, quote: string): AnamneseField {
  return { text, confidence: 0.85, sources: [{ sessionId, sessionNr, quote }] };
}

function buildAnamnese(): AnamneseProfile {
  const p = emptyAnamneseProfile();
  const s1 = "S-DEMO-1";
  p.kindheit.selbstbeschreibung = f("Als zurückhaltend, eher angepasst, früh perfektionistisch beschrieben.", s1, 1, "Ich war immer das brave Kind, das alles richtig machen wollte.");
  p.kindheit.gesundheitszustand = f("Körperlich unauffällig.", s1, 1, "Körperlich war ich immer gesund.");
  p.kindheit.problemeStoerungen = f("Selbstwertproblematik seit Schulzeit, kein psychiatrischer Vorbefund.", s1, 1, "Ich hab immer gedacht, ich bin nicht gut genug.");
  p.eltern.persoenlichkeit = f("Mutter sehr leistungsorientiert, Vater emotional distanziert.", s1, 1, "Meine Mutter wollte immer, dass alles perfekt ist.");
  p.eltern.erziehungsstil = f("Hohe Leistungsansprüche, wenig affektive Zuwendung.", s1, 1, "Lob gab es selten, Kritik oft.");
  p.eltern.atmosphaere = f("Konfliktarm, aber emotional kühl.", s1, 1, "Es war nie laut zuhause, aber auch nicht warm.");
  p.schule.beziehungMitschuelerLehrer = f("Eher Außenseiterin, gute Schülerin, wenig Freundschaften.", s1, 1, "In der Schule war ich eher die Stille.");
  p.beruf.ausbildungen = f("Lehramtsstudium Sek. I, seit 8 Jahren als Lehrerin tätig.", s1, 1, "Ich unterrichte seit acht Jahren.");
  p.beruf.beziehungVorgesetzteKollegen = f("Distanziert-höflich, fühlt sich von Kolleg:innen wenig gesehen.", s1, 1, "Im Lehrerzimmer fühl ich mich oft wie unsichtbar.");
  p.sexualitaetPartnerschaften = f("Beziehung vor 2 Jahren beendet, seither Single, sexuell wenig Interesse seit Symptombeginn.", s1, 1, "Seit der Trennung will ich keine neue Beziehung.");
  p.interessenHobbys = f("Früher Chor, Yoga, Lesen – aktuell weitgehend reduziert.", s1, 1, "Ich war im Chor, aber seit einem halben Jahr nicht mehr.");
  p.ressourcen = f("Sprachlich gewandt, reflektiert, eine vertraute Schwester als Bezugsperson.", s1, 1, "Mit meiner Schwester kann ich reden.");
  p.aktuelleLebenssituation.wohnen = f("Lebt allein in 2-Zimmer-Wohnung, geordnet.", s1, 1, "Ich wohne allein.");
  p.aktuelleLebenssituation.arbeit = f("Vollzeit Lehrerin, aktuell mit AU 4 Wochen.", s1, 1, "Ich bin seit vier Wochen krankgeschrieben.");
  p.aktuelleLebenssituation.beziehungen = f("Kontakt zu Schwester regelmäßig, Freundeskreis ausgedünnt.", s1, 1, "Mit meiner Schwester telefoniere ich oft.");
  p.symptomanamnese.aktuelleSymptomatik = f("Niedergeschlagenheit, Antriebsminderung, Anhedonie, Schlafstörung, Grübeln, Konzentrationsstörung – Beginn vor ca. 6 Monaten.", s1, 1, "Ich kann mich morgens kaum aufraffen.");
  p.symptomanamnese.beginnAusloeser = f("Nach Konflikt am Arbeitsplatz und Trennung schleichender Beginn.", s1, 1, "Es ging los nach dem Streit mit meiner Schulleitung.");
  p.symptomanamnese.behandlungen = f("Keine psychotherapeutische Vorbehandlung, keine stationäre Behandlung.", s1, 1, "Ich war noch nie in Therapie.");
  p.symptomanamnese.medikation = f("Keine antidepressive Medikation, Patientin lehnt aktuell ab.", s1, 1, "Tabletten will ich erstmal nicht.");
  p.psychischerBefund.auftreten = f("Wach, orientiert, leise Stimme, reduzierte Mimik.", s1, 1, "—");
  p.psychischerBefund.denkmuster = f("Negative Selbstbewertung, Generalisierung, Schwarz-Weiß-Denken.", s1, 1, "Wenn ich etwas nicht schaffe, bin ich komplett gescheitert.");
  p.persoenlichkeitsstruktur = f("Selbstunsicher-perfektionistische Züge, ohne Hinweise auf Persönlichkeitsstörung.", s1, 1, "—");
  p.bewertungVorlaeufigeDiagnose = f("Mittelgradige depressive Episode (F32.1), monophasisch, ohne psychotische Symptome.", s1, 1, "—");
  p.updatedAt = now;
  p.sessionsCovered = ["S-DEMO-1", "S-DEMO-2", "S-DEMO-3", "S-DEMO-4"];
  return p;
}

// ───────────────── Transkripte ─────────────────

const TX1 = `THERAPEUTIN: Schön, dass Sie da sind. Wie geht es Ihnen heute?
PATIENTIN: Ehrlich gesagt nicht gut. Ich habe gestern Abend wieder lange wachgelegen und gegrübelt.
THERAPEUTIN: Worüber haben Sie nachgedacht?
PATIENTIN: Über alles, was ich falsch mache. Dass ich es im Job nicht mehr schaffe, dass ich allein bin, dass ich eigentlich nichts auf die Reihe kriege.
THERAPEUTIN: Das klingt sehr belastend. Können Sie beschreiben, wie ein typischer Tag aktuell aussieht?
PATIENTIN: Ich wache gegen sechs auf, bleibe aber liegen bis halb zehn. Dann zwinge ich mich, einen Kaffee zu machen. Essen kann ich kaum etwas. Ich sitze viel auf dem Sofa, schaue aufs Handy, aber lese nichts richtig. Nachmittags lege ich mich oft wieder hin.
THERAPEUTIN: Gibt es Dinge, die Ihnen früher Freude gemacht haben?
PATIENTIN: Ich war im Chor und habe gerne gelesen. Yoga auch. Aber das hat alles aufgehört. Ich fühle einfach nichts mehr dabei.
THERAPEUTIN: Sie sind seit vier Wochen krankgeschrieben. Wie kam es dazu?
PATIENTIN: Ich konnte morgens nicht mehr in die Schule gehen. Ich habe vor der Tür gestanden und musste weinen. Mein Hausarzt hat mich dann krankgeschrieben.
THERAPEUTIN: Wenn Sie an Ihre Arbeit denken, welche Gedanken kommen Ihnen?
PATIENTIN: Dass ich keine gute Lehrerin bin. Dass die Schüler mich nicht ernst nehmen. Dass die Kollegen mich für inkompetent halten.
THERAPEUTIN: Sind das Gedanken, die Sie überprüfen, oder die einfach da sind?
PATIENTIN: Die sind einfach da. Ich glaube sie ja auch.
THERAPEUTIN: Gibt es Momente, in denen Sie an sich selbst zweifeln, ob das Leben so noch Sinn hat?
PATIENTIN: Manchmal denke ich, es wäre besser, wenn ich morgens nicht mehr aufwachen müsste. Aber etwas tun würde ich mir nicht.
THERAPEUTIN: Danke, dass Sie das so offen sagen. Diese passiven Gedanken zu haben ist im Rahmen einer Depression nicht selten. Wir werden das immer wieder besprechen. Haben Sie eine Bezugsperson?
PATIENTIN: Meine Schwester. Mit ihr telefoniere ich regelmäßig.
THERAPEUTIN: Gut. Lassen Sie uns heute zwei Dinge tun: Erstens möchte ich Ihnen das Modell der Depression erklären, damit Sie verstehen, warum diese Gedanken und der Rückzug zusammenhängen. Zweitens würde ich gerne mit Ihnen eine kleine erste Aktivität vereinbaren für diese Woche.
PATIENTIN: Okay.
THERAPEUTIN: Bei Depression entsteht ein Teufelskreis: Sie fühlen sich müde, ziehen sich zurück, machen weniger, und gerade dadurch sinkt die Stimmung weiter. Wenn wir es schaffen, ganz kleine Aktivitäten wieder einzubauen, durchbrechen wir diesen Kreis.
PATIENTIN: Das klingt logisch, aber ich habe einfach keine Kraft.
THERAPEUTIN: Das verstehe ich. Deshalb sehr klein anfangen. Was wäre etwas, das Sie sich diese Woche vorstellen könnten – nicht jeden Tag, vielleicht dreimal?
PATIENTIN: Vielleicht einmal um den Block gehen.
THERAPEUTIN: Sehr gut. Dreimal in der Woche zehn Minuten spazieren, am besten vormittags. Und führen Sie bitte ein kurzes Stimmungstagebuch: morgens, mittags, abends jeweils einen Wert von null bis zehn.
PATIENTIN: Das kriege ich hin.
THERAPEUTIN: Schön. Wir sehen uns nächste Woche.`;

const TX2 = `THERAPEUTIN: Wie ist die Woche gelaufen?
PATIENTIN: Etwas besser als ich dachte. Spazieren bin ich viermal gewesen, nicht dreimal.
THERAPEUTIN: Das ist beachtlich. Wie war es jeweils?
PATIENTIN: Beim ersten Mal sehr schwer. Ich habe lange gebraucht, um die Schuhe anzuziehen. Aber als ich draußen war, war es okay. Beim dritten Mal habe ich mich sogar ein bisschen besser gefühlt danach.
THERAPEUTIN: Was haben Sie im Stimmungstagebuch beobachtet?
PATIENTIN: Morgens immer am schlimmsten, so zwei oder drei. Abends manchmal eine fünf. An den Spaziergang-Tagen abends sogar eine sechs.
THERAPEUTIN: Das ist eine sehr wichtige Beobachtung. Aktivität verändert die Stimmung – wenn auch nicht sofort. Was geht in Ihnen vor, wenn Sie das hören?
PATIENTIN: Eigentlich beruhigt es mich. Aber gleichzeitig denke ich, ich müsste mehr schaffen.
THERAPEUTIN: Lassen Sie uns diesen Gedanken anschauen. „Ich müsste mehr schaffen“ – ist das ein hilfreicher Gedanke?
PATIENTIN: Nein. Er macht mir nur Druck.
THERAPEUTIN: Gibt es eine fairere Formulierung?
PATIENTIN: Vielleicht: „Ich habe diese Woche etwas geschafft. Das ist ein Anfang.“
THERAPEUTIN: Das ist sehr gut. Schreiben Sie sich diesen Satz auf. Wir nennen das einen alternativen Gedanken.
PATIENTIN: Ich habe diese Woche auch meine Schwester getroffen. Wir haben einen Kaffee getrunken.
THERAPEUTIN: Wie war es?
PATIENTIN: Schön. Ich habe gemerkt, dass ich es gar nicht so schlimm fand wie befürchtet.
THERAPEUTIN: Sie hatten also vorher die Erwartung, es würde schlimm.
PATIENTIN: Ja. Ich habe gedacht, ich falle ihr zur Last.
THERAPEUTIN: Und die Realität?
PATIENTIN: Sie hat sich gefreut. Sie hat sogar gesagt, dass sie froh ist, dass ich rauskomme.
THERAPEUTIN: Das ist ein wichtiger Hinweis. Ihre Gedanken sagen Ihnen: „Ich bin eine Belastung.“ Die Wirklichkeit zeigt etwas anderes. Über die Arbeit – haben Sie daran gedacht?
PATIENTIN: Ja, aber ich kriege Angst, wenn ich nur an die Schule denke.
THERAPEUTIN: Wir lassen die Arbeit noch eine Weile außen vor. Erstmal stabilisieren. Wie sieht es mit dem Schlaf aus?
PATIENTIN: Immer noch schwer. Ich liege oft eine Stunde wach.
THERAPEUTIN: Ich gebe Ihnen ein einfaches Schlafhygiene-Blatt mit. Für diese Woche: bitte Spaziergang fortsetzen, dazu zweimal eine kleine andere Aktivität – zum Beispiel kurz Yoga, kochen, mit Ihrer Schwester telefonieren. Und führen Sie ein kleines Gedankenprotokoll: Wenn ein typischer negativer Gedanke auftaucht, schreiben Sie ihn auf und versuchen, eine alternative Sicht zu finden.
PATIENTIN: In Ordnung.
THERAPEUTIN: Wie geht es Ihnen mit Gedanken, dass es besser wäre nicht mehr aufzuwachen?
PATIENTIN: Sind noch da, aber seltener. Tun würde ich nichts.
THERAPEUTIN: Gut, dass Sie es ansprechen. Wir prüfen das jede Sitzung.`;

const TX3 = `THERAPEUTIN: Erzählen Sie mir, wie es Ihnen geht.
PATIENTIN: Es geht aufwärts, langsam. Ich habe diese Woche sechs Aktivitäten geschafft. Spaziergänge, einmal Yoga, zweimal mit meiner Schwester telefoniert, einmal mit einer alten Freundin getroffen.
THERAPEUTIN: Sie haben eine Freundin getroffen – das war Ihre Initiative?
PATIENTIN: Ja. Ich habe sie selbst angeschrieben. Vorher hatte ich richtig Angst davor.
THERAPEUTIN: Was hat Ihnen geholfen, es trotzdem zu tun?
PATIENTIN: Ich habe an unseren alternativen Gedanken gedacht. Und ich habe mir gesagt: Wenn es schief geht, geht es schief. Aber wenn ich es nicht versuche, weiß ich es nie.
THERAPEUTIN: Das ist eine sehr wichtige Verhaltensveränderung. Und wie war es konkret?
PATIENTIN: Wir haben fast zwei Stunden geredet. Es war wirklich schön. Ich habe sogar gelacht.
THERAPEUTIN: Was sagt das über den Gedanken „Niemand mag mich“ oder „Ich bin eine Belastung“?
PATIENTIN: Dass er nicht stimmt. Zumindest nicht durchgängig.
THERAPEUTIN: Lassen Sie uns heute mit dem Gedankenprotokoll arbeiten. Welche Situation kam diese Woche?
PATIENTIN: Ich habe gehört, dass eine Kollegin aus meiner Schule schwanger ist. Sofort kam: „Ich werde nie eine Familie haben, ich bin allein, ich bin gescheitert.“
THERAPEUTIN: Wie stark war der Gedanke, null bis hundert?
PATIENTIN: Achtzig.
THERAPEUTIN: Welche Emotion ging damit einher?
PATIENTIN: Traurigkeit, Neid, Wertlosigkeit.
THERAPEUTIN: Welche Belege sprechen für den Gedanken „Ich bin gescheitert“?
PATIENTIN: Ich bin 34, allein, ohne Beziehung, krankgeschrieben.
THERAPEUTIN: Und welche Belege sprechen dagegen?
PATIENTIN: Ich habe einen festen Beruf. Ich habe eine intakte Beziehung zu meiner Schwester. Ich bin gerade dabei, etwas zu verändern.
THERAPEUTIN: Welche alternative, fairere Sichtweise wäre möglich?
PATIENTIN: Vielleicht: „Ich bin gerade in einer schwierigen Phase, aber mein Leben ist nicht gescheitert. Ich gehe Schritte.“
THERAPEUTIN: Wie stark glauben Sie diesen Satz, null bis hundert?
PATIENTIN: Vielleicht fünfzig. Aber das ist mehr als sonst.
THERAPEUTIN: Sehr gut. Wenn Sie 50 % glauben, dass es nicht gescheitert ist – wie verändert das die Emotion?
PATIENTIN: Die Traurigkeit ist noch da, aber weniger massiv.
THERAPEUTIN: Wie sieht es mit dem Schlaf aus?
PATIENTIN: Besser. Ich schlafe meistens innerhalb von 30 Minuten ein.
THERAPEUTIN: Und die Gedanken, nicht aufwachen zu wollen?
PATIENTIN: Sind diese Woche nicht aufgetreten.
THERAPEUTIN: Das ist eine wichtige positive Entwicklung. Für die nächste Woche: bitte weiter Aktivitäten, zwei Gedankenprotokolle, und beginnen Sie, eine Liste zu führen mit Dingen, die Sie gut können oder gut gemacht haben – ein Stärken-Tagebuch.
PATIENTIN: Okay.`;

const TX4 = `THERAPEUTIN: Wie ist es Ihnen ergangen?
PATIENTIN: Insgesamt deutlich besser. Ich war fast jeden Tag draußen, ich habe wieder mit dem Chor telefoniert und überlege, nächste Woche dort hinzugehen.
THERAPEUTIN: Das wäre ein großer Schritt. Was hindert Sie noch?
PATIENTIN: Die Angst, dass alle fragen, wo ich war. Dass es komisch wird.
THERAPEUTIN: Was hilft Ihnen, mit dieser Angst umzugehen?
PATIENTIN: Ich kann mir vorher zwei, drei Sätze überlegen. Und ich muss nicht erklären, warum ich weg war, wenn ich es nicht will.
THERAPEUTIN: Genau. Sie sehen, wie Sie inzwischen aktiv mit Angst umgehen, statt nur zu vermeiden. Das ist eine wichtige Veränderung.
PATIENTIN: Ich habe das Stärken-Tagebuch geführt. Es war anfangs schwer, aber ich habe jeden Tag etwas gefunden.
THERAPEUTIN: Können Sie ein Beispiel teilen?
PATIENTIN: Am Dienstag: „Ich habe meiner Nachbarin geholfen, ihre Einkäufe hochzutragen, obwohl ich müde war.“ Und: „Ich habe heute eine Mail geschrieben, die ich seit Wochen aufgeschoben hatte.“
THERAPEUTIN: Wie hat sich das ausgewirkt?
PATIENTIN: Ich merke, dass ich nicht nur die Versager-Brille aufhabe. Es gibt auch anderes.
THERAPEUTIN: Wie ist die Stimmung im Durchschnitt?
PATIENTIN: Morgens noch vier, abends sechs bis sieben. Letzte Woche war auch ein Tiefpunkt, am Donnerstag bin ich morgens nicht aus dem Bett gekommen.
THERAPEUTIN: Was haben Sie an diesem Tag gemacht?
PATIENTIN: Ich habe mich daran erinnert, dass das normal ist. Ich bin nicht in alte Muster gefallen. Am Abend bin ich doch noch spazieren gegangen.
THERAPEUTIN: Das ist genau der Punkt – Rückschläge gehören dazu, aber Sie reagieren anders darauf als vor vier Wochen.
PATIENTIN: Ja, das merke ich auch.
THERAPEUTIN: Wie sieht es mit Gedanken aus, nicht mehr aufwachen zu wollen?
PATIENTIN: Sind nicht mehr da.
THERAPEUTIN: Wir sollten in den nächsten Sitzungen langsam an die berufliche Wiedereingliederung denken. Wie fühlt sich der Gedanke an?
PATIENTIN: Angst, aber nicht mehr Panik. Ich kann darüber nachdenken.
THERAPEUTIN: Wir bereiten das in den nächsten zwei Sitzungen vor – mit einer hierarchischen Planung in kleinen Schritten. Für diese Woche: weiter Aktivitäten, Chorbesuch falls möglich, Stärken-Tagebuch fortführen, und schreiben Sie bitte drei Dinge auf, die Ihnen am Wiedereinstieg Angst machen.
PATIENTIN: Das mache ich.
THERAPEUTIN: Und wenn doch wieder ein sehr schwerer Tag kommt?
PATIENTIN: Ich rufe meine Schwester an. Und ich kann auch die Krisennummer nutzen, die Sie mir gegeben haben.
THERAPEUTIN: Sehr gut.`;

// ───────────────── KV-Doku ─────────────────

function kvDoc(n: number): KVDocumentation {
  const docs: Record<number, KVDocumentation> = {
    1: {
      aktuelle_symptomatik: "Patientin berichtet anhaltende Niedergeschlagenheit, Antriebsminderung, Anhedonie, Ein- und Durchschlafstörung, vermehrtes Grübeln, reduzierter Appetit. Beginn vor ca. 6 Monaten. Seit 4 Wochen Arbeitsunfähigkeit. Passive Suizidgedanken ohne Handlungsabsicht oder Plan.",
      inhalte_der_sitzung: "Schilderung des aktuellen Tagesablaufs, der vorherrschenden depressiven Kognitionen (Wertlosigkeit, Versagensgefühl, Belastungsannahme) und des sozialen Rückzugs. Erfassung von Vorbehandlungen, Medikation und Bezugspersonen.",
      therapeutische_interventionen: "Psychoedukation Depressionsmodell mit Schwerpunkt auf dem Teufelskreis aus Rückzug und Stimmungsverschlechterung. Einführung Stimmungstagebuch. Erste Vereinbarung zur Verhaltensaktivierung.",
      verlauf_und_einschaetzung: "Mittelgradige depressive Episode (F32.1), klinisch konsistent mit Selbstbericht und Befund. Patientin reflektiert, motivationsbereit, kein Hinweis auf psychotische Symptome.",
      vereinbarungen: "3× wöchentlich Spaziergang à 10 Minuten, tägliches Stimmungstagebuch (morgens/mittags/abends, 0–10). Folgesitzung in einer Woche.",
      risikoabklaerung: "Passive Suizidgedanken ohne Plan oder Handlungsabsicht. Distanzierungsfähigkeit gegeben. Bezugsperson (Schwester) verfügbar. Krisenkontakte ausgehändigt. Keine akute Eigen- oder Fremdgefährdung.",
      administrative_hinweise: "Einzeltherapie, 50 Minuten, Erstdiagnostik fortgesetzt.",
    },
    2: {
      aktuelle_symptomatik: "Leichte Symptomreduktion. Antrieb diskret gesteigert, Stimmung morgens weiter gedrückt, abends besser. Schlafstörung persistierend. Passive Suizidgedanken seltener.",
      inhalte_der_sitzung: "Auswertung Stimmungstagebuch (Stimmung 2–6) und Aktivitätenprotokoll (4 Spaziergänge, 1 Treffen mit Schwester). Identifikation des Gedankens „Ich bin eine Belastung“ und Realitätstest. Schlafhygiene.",
      therapeutische_interventionen: "Verhaltensanalyse, erste kognitive Umstrukturierung mit Erarbeitung eines alternativen Gedankens. Psychoedukation Schlafhygiene. Validierung erster Aktivierungserfolge.",
      verlauf_und_einschaetzung: "Beginnende Aktivierung erkennbar. Patientin reflektiert eigene Vermeidung und differenziert zwischen Erwartung und Realität. Stabile Therapiebeziehung.",
      vereinbarungen: "Weiterführung Spaziergänge, zusätzlich 2 kleine Alternativaktivitäten, einfaches Gedankenprotokoll (Situation–Gedanke–Alternative). Schlafhygiene umsetzen.",
      risikoabklaerung: "Passive Suizidgedanken seltener, keine aktive Suizidalität, keine Selbstverletzung. Bezugsperson eingebunden. Krisenkontakte bekannt.",
      administrative_hinweise: "Einzeltherapie, 50 Minuten.",
    },
    3: {
      aktuelle_symptomatik: "Deutliche, aber langsame Symptomreduktion. Mehr Aktivierung, soziale Initiative, verbesserter Schlaf. Negative Selbstbewertung weiter präsent, aber differenzierbar. Keine Suizidgedanken in der vergangenen Woche.",
      inhalte_der_sitzung: "Reflexion über initiiertes Treffen mit alter Freundin. Strukturierte kognitive Umstrukturierung anhand des Gedankens „Ich bin gescheitert“ mit Pro-/Kontra-Analyse und alternativem Gedanken.",
      therapeutische_interventionen: "Kognitive Umstrukturierung (Sokratischer Dialog), Ressourcenaktivierung, Verstärkung sozialer Initiative, Auftrag Stärken-Tagebuch.",
      verlauf_und_einschaetzung: "Kognitiver Shift beginnt: adaptive Gedanken werden gebildet und teilweise geglaubt (~50 %). Sozialer Rückzug rückläufig. Behavioral Activation greift.",
      vereinbarungen: "Aktivitäten beibehalten, 2 weitere Gedankenprotokolle, tägliches Stärken-Tagebuch.",
      risikoabklaerung: "Keine Suizidgedanken in der Berichtswoche, keine Selbstverletzung. Bezugsperson und Krisenkontakte verfügbar.",
      administrative_hinweise: "Einzeltherapie, 50 Minuten.",
    },
    4: {
      aktuelle_symptomatik: "Anhaltend rückläufige Symptomatik. Stimmung morgens 4, abends 6–7. Ein Tiefpunkt in der Woche, ohne Rückfall in alte Vermeidungsmuster. Schlaf weitgehend stabil. Keine Suizidgedanken.",
      inhalte_der_sitzung: "Reflexion Stärken-Tagebuch und Umgang mit Tiefpunkt. Vorbereitung Wiederaufnahme Chor-Aktivität. Erste Annäherung an Thema berufliche Wiedereingliederung.",
      therapeutische_interventionen: "Ressourcenaktivierung, Rückfallprophylaxe (Reaktion auf Tiefpunkt als Lerngelegenheit), kognitive Umstrukturierung Versagensschema, Vorbereitung hierarchische Expositionsplanung Arbeit.",
      verlauf_und_einschaetzung: "Stabiler positiver Verlauf mit erwartbaren Schwankungen. Patientin nutzt Bewältigungsstrategien selbstständig. Cognitive Shift konsolidiert, sozialer Rückzug deutlich reduziert.",
      vereinbarungen: "Aktivitätenplan fortführen, Chor besuchen, Stärken-Tagebuch weiter, 3 angstauslösende Aspekte des Wiedereinstiegs schriftlich.",
      risikoabklaerung: "Keine Suizidgedanken, keine Selbstverletzung. Bezugsperson und Krisennummer bekannt. Patientin reflektiert eigene Notfallstrategien.",
      administrative_hinweise: "Einzeltherapie, 50 Minuten.",
    },
  };
  return docs[n];
}

function kvExt(n: number): KVExtraction {
  const symptome = [
    ["Niedergeschlagenheit", "Antriebsminderung", "Anhedonie", "Schlafstörung", "Grübeln", "Appetitminderung", "passive Suizidgedanken"],
    ["Niedergeschlagenheit (morgens)", "Antriebsminderung", "Schlafstörung", "Grübeln", "passive Suizidgedanken (seltener)"],
    ["leichte Niedergeschlagenheit", "Restschlafstörung", "negative Selbstbewertung"],
    ["leichte Morgenstimmungstiefs", "negative Selbstbewertung (rückläufig)"],
  ][n - 1];
  const themen = [
    ["Tagesablauf", "Wertlosigkeit", "Rückzug", "Krankschreibung", "Bezugspersonen"],
    ["Verhaltensaktivierung", "Belastungs-Annahme", "Schlafhygiene", "Realitätstest"],
    ["Soziale Initiative", "Versagens-Schema", "Familie/Beziehung", "Stärken"],
    ["Rückfallprophylaxe", "Chor / Hobby", "Berufliche Wiedereingliederung"],
  ][n - 1];
  const intsArr: KVExtraction["interventionen"][] = [
    [
      { kind: "Psychoedukation", beschreibung: "Depressionsmodell, Teufelskreis Rückzug." },
      { kind: "Verhaltensanalyse", beschreibung: "Tagesstruktur und Aktivitätsniveau erhoben." },
      { kind: "KVT", beschreibung: "Erste Aktivitätsplanung." },
    ],
    [
      { kind: "Kognitive Umstrukturierung", beschreibung: "Alternativgedanke zu „Ich bin eine Belastung“." },
      { kind: "Verhaltensanalyse", beschreibung: "Auswertung Stimmungs- und Aktivitätsprotokoll." },
      { kind: "Psychoedukation", beschreibung: "Schlafhygiene." },
      { kind: "Validierung", beschreibung: "Erste Aktivierungserfolge anerkannt." },
    ],
    [
      { kind: "Sokratischer Dialog", beschreibung: "Pro/Kontra zu „Ich bin gescheitert“." },
      { kind: "Kognitive Umstrukturierung", beschreibung: "Alternativgedanke mit Glaubensgrad-Skalierung." },
      { kind: "Ressourcenaktivierung", beschreibung: "Stärken-Tagebuch eingeführt." },
    ],
    [
      { kind: "Ressourcenaktivierung", beschreibung: "Stärken-Tagebuch ausgewertet." },
      { kind: "Kognitive Umstrukturierung", beschreibung: "Versagensschema differenziert." },
      { kind: "Hausaufgaben-Besprechung", beschreibung: "Aktivitätenplan, Chor-Annäherung." },
      { kind: "KVT", beschreibung: "Vorbereitung hierarchische Wiedereingliederung Arbeit." },
    ],
  ];
  const vereinbarungen = [
    ["3× Spaziergang/Woche", "Stimmungstagebuch täglich", "Folgesitzung in 1 Woche"],
    ["Aktivitäten beibehalten + 2 Alternativaktivitäten", "Gedankenprotokoll", "Schlafhygiene umsetzen"],
    ["Aktivitäten beibehalten", "2 Gedankenprotokolle", "Stärken-Tagebuch täglich"],
    ["Aktivitäten fortführen", "Chorbesuch", "3 Aspekte Wiedereinstieg notieren"],
  ][n - 1];
  const verlaufIndikatoren = [
    ["Therapiemotivation gegeben", "Bezugsperson aktiv", "noch wenig Aktivierung"],
    ["leichte Symptomreduktion", "erste erfolgreiche Aktivierung", "Schlaf weiter gestört"],
    ["soziale Initiative erkennbar", "kognitiver Shift beginnt", "Schlaf gebessert"],
    ["Bewältigungsstrategien werden selbstständig genutzt", "Rückschläge nicht generalisiert", "Wiedereingliederung in Planung"],
  ][n - 1];
  const risiken: KVExtraction["risiken"][] = [
    { suizidalitaet: "passive Todeswünsche, keine aktive Suizidalität, keine Planung, distanzierungsfähig", selbstverletzung: "keine", substanzkonsum: "keine Auffälligkeit", fremdgefahrdung: "keine" },
    { suizidalitaet: "passive Todeswünsche seltener, distanzierungsfähig", selbstverletzung: "keine", substanzkonsum: "keine", fremdgefahrdung: "keine" },
    { suizidalitaet: "keine Suizidgedanken in der Berichtswoche", selbstverletzung: "keine", substanzkonsum: "keine", fremdgefahrdung: "keine" },
    { suizidalitaet: "keine Suizidgedanken, Notfallstrategien bekannt", selbstverletzung: "keine", substanzkonsum: "keine", fremdgefahrdung: "keine" },
  ];
  return {
    symptome,
    themen,
    interventionen: intsArr[n - 1],
    vereinbarungen,
    risiken: risiken[n - 1],
    verlauf_indikatoren: verlaufIndikatoren,
    abrechnung: { sitzungsformat: "Einzeltherapie", dauerMin: 50, besonderheiten: n === 1 ? "Erstdiagnostik fortgesetzt" : undefined },
  };
}

// ───────────────── Schema-Analyse ─────────────────

function schemaAnalysis(sessionId: string, n: number): SchemaAnalysisResult {
  const groups = [
    // Session 1 – stark belastet
    [
      { type: "Defekt / Scham" as const, count: 4, chat_preview: "„Ich bin nicht gut genug“, „Ich bin wertlos“ – mehrfach.", examples: [
        { trigger_sentence: "Ich kriege nichts auf die Reihe.", context: "Beim Beschreiben des Tagesablaufs.", timestamp: "00:04" },
        { trigger_sentence: "Ich bin keine gute Lehrerin.", context: "Auf Frage nach Arbeitsgedanken.", timestamp: "00:18" },
      ]},
      { type: "Versagen / Unzulänglichkeit" as const, count: 3, chat_preview: "Generalisiert: „Ich schaffe nichts mehr.“", examples: [
        { trigger_sentence: "Ich schaffe es im Job nicht mehr.", context: "Einstiegsschilderung.", timestamp: "00:02" },
      ]},
      { type: "Misstrauen / Bewertung durch andere" as const, count: 2, chat_preview: "„Kollegen halten mich für inkompetent.“", examples: [
        { trigger_sentence: "Die Kollegen halten mich für inkompetent.", context: "Bei Arbeitsgedanken.", timestamp: "00:19" },
      ]},
    ],
    // Session 2 – etwas weniger, erste Alternativen
    [
      { type: "Defekt / Scham" as const, count: 3, chat_preview: "„Ich bin eine Belastung“ – mehrfach.", examples: [
        { trigger_sentence: "Ich falle meiner Schwester zur Last.", context: "Vor Treffen mit Schwester.", timestamp: "00:14" },
      ]},
      { type: "Versagen / Unzulänglichkeit" as const, count: 2, chat_preview: "„Ich müsste mehr schaffen.“", examples: [
        { trigger_sentence: "Ich müsste mehr schaffen.", context: "Reaktion auf Tagebuch-Auswertung.", timestamp: "00:09" },
      ]},
    ],
    // Session 3 – Cognitive Shift sichtbar
    [
      { type: "Versagen / Unzulänglichkeit" as const, count: 2, chat_preview: "„Ich bin gescheitert“ – einmal, dann revidiert.", examples: [
        { trigger_sentence: "Ich bin gescheitert.", context: "Nach Nachricht über Schwangerschaft der Kollegin.", timestamp: "00:11" },
      ]},
      { type: "Defekt / Scham" as const, count: 1, chat_preview: "Reduziert, klare Differenzierung.", examples: [
        { trigger_sentence: "Wertlos.", context: "Emotion benannt, nicht als Wahrheit gesetzt.", timestamp: "00:13" },
      ]},
    ],
    // Session 4 – weitgehend differenziert
    [
      { type: "Versagen / Unzulänglichkeit" as const, count: 1, chat_preview: "Punktuell, sofort relativiert.", examples: [
        { trigger_sentence: "Heute war ein schwerer Tag.", context: "Reflexion Tiefpunkt.", timestamp: "00:17" },
      ]},
    ],
  ];
  return {
    session_id: sessionId,
    schema_summary_chat: groups[n - 1] as SchemaAnalysisResult["schema_summary_chat"],
    generatedAt: now,
  };
}

// ───────────────── KPIs ─────────────────

function kpis(n: number): SessionKPIs {
  // Verlauf: 1 → 4: Symptomatik ↓, Aktivierung ↑, Sozialkontakt ↑, Emotionsreg ↑, Risk ↓
  const series = [
    { mood: 3, anhedonia: 8, energy: 2, cognition: 3, hopelessness: 7, selfDeprecation: 8,
      sleep: 8, psy: 4, som: 5, guilt: 7,
      neg: 7, adp: 0, pos: 2, avoid: 6, soc: 1, init: 0,
      awareness: 2, regulation: 1, posSelf: 0, negSelf: 6,
      fnW: 1, fnS: 2, fnD: 3, risk: 1 as const, sev: 72,
      riskNotes: "Passive Todeswünsche („nicht mehr aufwachen“), ohne Plan, distanzierungsfähig.",
    },
    { mood: 4, anhedonia: 7, energy: 4, cognition: 4, hopelessness: 6, selfDeprecation: 7,
      sleep: 7, psy: 3, som: 4, guilt: 6,
      neg: 5, adp: 2, pos: 4, avoid: 4, soc: 2, init: 1,
      awareness: 3, regulation: 2, posSelf: 1, negSelf: 4,
      fnW: 1, fnS: 3, fnD: 4, risk: 1 as const, sev: 60,
      riskNotes: "Passive Todeswünsche seltener, keine aktive Suizidalität.",
    },
    { mood: 5, anhedonia: 5, energy: 5, cognition: 5, hopelessness: 4, selfDeprecation: 5,
      sleep: 4, psy: 2, som: 3, guilt: 4,
      neg: 3, adp: 5, pos: 6, avoid: 2, soc: 4, init: 2,
      awareness: 4, regulation: 3, posSelf: 3, negSelf: 2,
      fnW: 2, fnS: 5, fnD: 6, risk: 0 as const, sev: 45,
      riskNotes: "Keine Suizidgedanken in der Berichtswoche.",
    },
    { mood: 6, anhedonia: 4, energy: 6, cognition: 6, hopelessness: 3, selfDeprecation: 4,
      sleep: 3, psy: 2, som: 2, guilt: 3,
      neg: 2, adp: 7, pos: 8, avoid: 1, soc: 5, init: 3,
      awareness: 4, regulation: 4, posSelf: 5, negSelf: 1,
      fnW: 3, fnS: 6, fnD: 7, risk: 0 as const, sev: 35,
      riskNotes: "Keine Suizidgedanken; Notfallstrategien selbstständig benannt.",
    },
  ];
  const s = series[n - 1];
  return {
    depressionSeverity: s.sev,
    negativeBeliefsCount: s.neg,
    adaptiveBeliefsCount: s.adp,
    positiveActivitiesCount: s.pos,
    activeActivities: Math.max(0, s.pos - 1),
    passiveActivities: 1,
    socialContactsCount: s.soc,
    socialInitiated: s.init,
    socialPassive: Math.max(0, s.soc - s.init),
    emotionAwareness: s.awareness,
    emotionRegulation: s.regulation,
    positiveSelfStatements: s.posSelf,
    negativeSelfStatements: s.negSelf,
    extractedAt: now,
    mood: s.mood,
    anhedonia: s.anhedonia,
    energy: s.energy,
    cognition: s.cognition,
    hopelessness: s.hopelessness,
    selfDeprecation: s.selfDeprecation,
    avoidanceCount: s.avoid,
    functioningWork: s.fnW,
    functioningSocial: s.fnS,
    functioningDaily: s.fnD,
    sleepDisturbance: s.sleep,
    psychomotor: s.psy,
    somaticSymptoms: s.som,
    guilt: s.guilt,
    riskLevel: s.risk,
    riskNotes: s.riskNotes,
    scid: {
      coreSymptoms: true,
      durationOver2Weeks: true,
      functionalImpairment: true,
      exclusionOtherDisorder: true,
      confidence: "high",
      likelyDiagnosis: "F32.1 – Mittelgradige depressive Episode",
    },
    keyQuotes: n === 1 ? [
      { text: "Ich kriege nichts auf die Reihe.", tag: "belief" },
      { text: "Es wäre besser, wenn ich morgens nicht mehr aufwachen müsste.", tag: "risk" },
      { text: "Ich fühle einfach nichts mehr dabei.", tag: "emotion" },
    ] : n === 2 ? [
      { text: "Ich habe diese Woche etwas geschafft. Das ist ein Anfang.", tag: "insight" },
      { text: "Ich falle meiner Schwester zur Last.", tag: "belief" },
    ] : n === 3 ? [
      { text: "Ich bin gerade in einer schwierigen Phase, aber mein Leben ist nicht gescheitert.", tag: "insight" },
      { text: "Ich habe sie selbst angeschrieben.", tag: "activity" },
    ] : [
      { text: "Ich bin nicht in alte Muster gefallen.", tag: "insight" },
      { text: "Ich kann darüber nachdenken.", tag: "emotion" },
      { text: "Ich rufe meine Schwester an.", tag: "activity" },
    ],
  };
}

// ───────────────── Sessions zusammenbauen ─────────────────

const TRANSCRIPTS = [TX1, TX2, TX3, TX4];

const STRUCTURED = [
  "Erstkontakt nach Krankschreibung. Anamnese, Depressionsmodell, Verhaltensaktivierung initiiert. Passive Suizidgedanken ohne Plan, Krisenkontakte ausgehändigt.",
  "Erste Aktivierungserfolge (4 Spaziergänge, Treffen mit Schwester). Erste kognitive Umstrukturierung. Schlafhygiene. Passive Suizidgedanken seltener.",
  "Soziale Initiative (Treffen mit Freundin). Strukturierte kognitive Umstrukturierung mit Pro/Kontra. Stärken-Tagebuch eingeführt. Keine Suizidgedanken.",
  "Stabile positive Entwicklung mit erwartbarem Tiefpunkt. Rückfallprophylaxe. Vorbereitung berufliche Wiedereingliederung. Keine Suizidgedanken.",
];

const HOMEWORK = [
  "3× wöchentlich 10 Min Spaziergang; Stimmungstagebuch (morgens/mittags/abends, 0–10).",
  "Spaziergänge fortsetzen + 2 Alternativaktivitäten; Gedankenprotokoll (Situation → Gedanke → Alternative); Schlafhygiene.",
  "Aktivitäten beibehalten; 2 Gedankenprotokolle; tägliches Stärken-Tagebuch.",
  "Aktivitäten fortführen; Chorbesuch wagen; 3 angstauslösende Aspekte des Wiedereinstiegs schriftlich.",
];

const NEXT_FOCUS = [
  "Stimmungstagebuch auswerten, Aktivitätsplanung vertiefen.",
  "Kognitive Umstrukturierung weiterführen, Schlafverlauf besprechen.",
  "Stärken-Tagebuch auswerten, Versagensschema bearbeiten.",
  "Hierarchische Planung Wiedereingliederung Arbeit.",
];

function buildSessions(): SessionEntry[] {
  return [1, 2, 3, 4].map((n) => {
    const id = `S-DEMO-${n}`;
    const date = now - (5 - n) * WEEK;
    return {
      id,
      patientId: DEMO_PATIENT_ID,
      date,
      durationMin: 50,
      rawNotes: STRUCTURED[n - 1],
      structured: STRUCTURED[n - 1],
      format: "VT-Verlauf",
      homework: HOMEWORK[n - 1],
      nextFocus: NEXT_FOCUS[n - 1],
      createdAt: date,
      transcript: TRANSCRIPTS[n - 1],
      kvDocumentation: kvDoc(n),
      kvExtraction: kvExt(n),
      kvValidation: { score: 92, errors: [], warnings: n === 1 ? ["Erstdokumentation – Anamnese läuft."] : [], generatedAt: date },
      schemaAnalysis: schemaAnalysis(id, n),
      schemaAnalyzedAt: date,
      sessionKPIs: kpis(n),
    };
  });
}

function buildPatient(): Patient {
  return {
    id: DEMO_PATIENT_ID,
    createdAt: now - 5 * WEEK,
    updatedAt: now,
    name: "Anna M. (Demo)",
    notes: "Demo-Patientin für End-to-End-Workflow. F32.1, ambulant, AU seit 4 Wochen. Keine echten Patientendaten.",
    ageGroup: "30-40",
    gender: "weiblich",
    approach: "KVT",
    diagnoses: ["F32.1"],
    goals: "Wiederaufnahme strukturierter Tagesaktivität; Reduktion negativer Selbstbewertung; soziale Reaktivierung; Vorbereitung berufliche Wiedereingliederung.",
    startDate: new Date(now - 5 * WEEK).toISOString().slice(0, 10),
    active: true,
    anamneseProfile: buildAnamnese(),
    anamneseUpdatedAt: now,
  };
}

export async function seedDemoPatient(overwrite = false): Promise<{ created: boolean; sessions: number }> {
  const existing = await db.patients.get(DEMO_PATIENT_ID);
  if (existing && !overwrite) {
    return { created: false, sessions: await db.sessions.where("patientId").equals(DEMO_PATIENT_ID).count() };
  }
  const patient = buildPatient();
  const sessions = buildSessions();
  if (overwrite && existing) {
    await db.sessions.where("patientId").equals(DEMO_PATIENT_ID).delete();
  }
  await db.patients.put(patient);
  await db.sessions.bulkPut(sessions);
  return { created: true, sessions: sessions.length };
}

export async function demoExists(): Promise<boolean> {
  return !!(await db.patients.get(DEMO_PATIENT_ID));
}
