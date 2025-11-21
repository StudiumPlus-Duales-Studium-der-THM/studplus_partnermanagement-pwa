# Notizen-Statusmodell

## Übersicht

Das Statusmodell für Sprachnotizen in der StudiumPlus Partner-Notizen App definiert den Lebenszyklus einer Notiz von der Aufnahme bis zum fertigen GitHub Issue. Jede Notiz durchläuft verschiedene Stadien der Verarbeitung, die durch das `NoteStatus` Enum abgebildet werden.

## Status-Definition

Die möglichen Stati sind in `src/types/voiceNote.ts` definiert:

```typescript
export enum NoteStatus {
  RECORDED = 'recorded',           // Stabil
  TRANSCRIBING = 'transcribing',   // Transient
  TRANSCRIBED = 'transcribed',     // Stabil
  PROCESSING = 'processing',       // Transient
  PROCESSED = 'processed',         // Stabil
  SENDING = 'sending',             // Transient
  SENT = 'sent',                   // Stabil
  ERROR = 'error'                  // Stabil
}
```

## Status-Kategorien

### Stabile Stati

Diese Stati repräsentieren persistente Zustände, in denen eine Notiz für längere Zeit verbleiben kann:

| Status | Label | Bedeutung | Aktionen |
|--------|-------|-----------|----------|
| **RECORDED** | Aufgenommen | Audio wurde aufgenommen, aber noch nicht transkribiert | User kann abspielen und transkribieren lassen |
| **TRANSCRIBED** | Transkribiert | Audio wurde in Text umgewandelt, aber noch nicht aufbereitet | User wählt Company/Contact aus und startet Aufbereitung |
| **PROCESSED** | Verarbeitet | Text wurde aufbereitet und ist bereit zum Versand | User kann Text bearbeiten und an GitHub senden |
| **SENT** | Gesendet | GitHub Issue wurde erfolgreich erstellt | Notiz ist fertig, nur noch lesend zugreifbar |
| **ERROR** | Fehler | Bei einem Verarbeitungsschritt ist ein Fehler aufgetreten | User kann Verarbeitung erneut versuchen |

### Transiente Stati

Diese Stati existieren nur für kurze Zeit (wenige Sekunden) während aktiver API-Aufrufe:

| Status | Label | Dauer | Folgestatus |
|--------|-------|-------|-------------|
| **TRANSCRIBING** | Transkribiert... | ~3-10 Sekunden | → `TRANSCRIBED` (Erfolg) oder `ERROR` (Fehler) |
| **PROCESSING** | Wird verarbeitet... | ~5-15 Sekunden | → `PROCESSED` (Erfolg) oder `ERROR` (Fehler) |
| **SENDING** | Wird gesendet... | ~2-5 Sekunden | → `SENT` (Erfolg) oder `ERROR` (Fehler) |

## Status-Übergänge

### Normaler Workflow (Happy Path)

```
RECORDED
    ↓ [User startet Transkription]
TRANSCRIBING (transient)
    ↓ [OpenAI Whisper API-Call erfolgreich]
TRANSCRIBED
    ↓ [User wählt Company/Contact & startet Aufbereitung]
PROCESSING (transient)
    ↓ [OpenAI GPT API-Call erfolgreich]
PROCESSED
    ↓ [User sendet an GitHub]
SENDING (transienter)
    ↓ [GitHub API-Call erfolgreich]
SENT
```

### Fehlerbehandlung

Von jedem transienten Status kann ein Übergang zu `ERROR` erfolgen:

```
TRANSCRIBING → [API-Fehler] → ERROR
PROCESSING   → [API-Fehler] → ERROR
SENDING      → [API-Fehler] → ERROR
```

Bei einem Fehler bleibt die Notiz im `ERROR`-Status mit einer entsprechenden Fehlermeldung. Der User kann die Verarbeitung erneut versuchen.

### Neuversuche nach Fehler

Aus dem `ERROR`-Status kann die Verarbeitung abhängig vom Fehlertyp erneut gestartet werden:

```
ERROR → [Retry] → TRANSCRIBING/PROCESSING/SENDING → ...
```

## Code-Referenzen

### Statusübergänge setzen

Alle Statusübergänge werden über den Voice Notes Store (`src/stores/voiceNotes.ts`) gesetzt. Die Verarbeitungslogik befindet sich in `src/composables/useProcessing.ts`.

**Beispiel eines typischen Status-Übergangs:**

```typescript
await voiceNotesStore.updateStatus(noteId, NoteStatus.TRANSCRIBING)
const transcription = await transcribeAudio(note.audioBlob, apiKey)
await voiceNotesStore.setTranscription(noteId, transcription) // → TRANSCRIBED
```

**Fehlerbehandlung:**

Bei jedem API-Fehler wird der Status auf `ERROR` gesetzt:

```typescript
await voiceNotesStore.updateStatus(noteId, NoteStatus.ERROR, errorMessage)
```

## UI-Verhalten pro Status

### HistoryView Filter

Der Filter in `src/views/HistoryView.vue` zeigt **nur stabile Stati**:
- Alle
- Aufgenommen (RECORDED)
- Transkribiert (TRANSCRIBED)
- Verarbeitet (PROCESSED)
- Gesendet (SENT)
- Fehler (ERROR)

**Warum keine transienten Stati im Filter?**

Die transienten Stati (`TRANSCRIBING`, `PROCESSING`, `SENDING`) werden bewusst **nicht** als Filteroptionen angeboten, weil:

1. **Kurze Lebensdauer**: Diese Stati existieren nur für 2-15 Sekunden während aktiver API-Calls
2. **Keine Persistenz**: Sobald der API-Call abgeschlossen ist, wechselt der Status sofort zu einem stabilen Zustand
3. **Nutzlosigkeit**: Ein Filter nach diesen Stati würde in 99,9% der Fälle keine Ergebnisse liefern
4. **Verwirrung vermeiden**: User würden nicht verstehen, warum ein Filter "Transkribiert..." keine Notizen findet
5. **Technisches Detail**: Diese Stati sind reine UI-Feedback-Indikatoren ("es läuft gerade..."), keine echten Geschäftszustände

### Status-Icons

Icons werden in `src/views/HistoryView.vue` definiert:

```typescript
const getStatusIcon = (status: NoteStatus): string => {
  const icons: Record<NoteStatus, string> = {
    [NoteStatus.RECORDED]: 'mdi-microphone',
    [NoteStatus.TRANSCRIBING]: 'mdi-loading',      // rotierend
    [NoteStatus.TRANSCRIBED]: 'mdi-text',
    [NoteStatus.PROCESSING]: 'mdi-loading',        // rotierend
    [NoteStatus.PROCESSED]: 'mdi-file-document',
    [NoteStatus.SENDING]: 'mdi-loading',           // rotierend
    [NoteStatus.SENT]: 'mdi-check',
    [NoteStatus.ERROR]: 'mdi-alert'
  }
  return icons[status] || 'mdi-help'
}
```

### Status-Farben

Farben werden in `src/utils/formatters.ts` definiert:

```typescript
const colors: Record<NoteStatus, string> = {
  [NoteStatus.RECORDED]: 'orange',           // Wartet auf Aktion
  [NoteStatus.TRANSCRIBING]: 'blue-lighten-1', // In Bearbeitung
  [NoteStatus.TRANSCRIBED]: 'blue',          // Bereit für nächsten Schritt
  [NoteStatus.PROCESSING]: 'purple-lighten-1', // In Bearbeitung
  [NoteStatus.PROCESSED]: 'purple',          // Bereit zum Senden
  [NoteStatus.SENDING]: 'green-lighten-1',   // In Bearbeitung
  [NoteStatus.SENT]: 'green',                // Erfolgreich abgeschlossen
  [NoteStatus.ERROR]: 'red'                  // Fehler
}
```

### Bearbeitbarkeit

In `src/views/HistoryView.vue` wird definiert, welche Notizen bearbeitet werden können:

```typescript
const canEdit = (status: NoteStatus): boolean => {
  return [
    NoteStatus.TRANSCRIBED,  // Vor der Aufbereitung
    NoteStatus.PROCESSED     // Nach der Aufbereitung, vor dem Senden
  ].includes(status)
}
```

### Klickverhalten

In `src/views/HistoryView.vue` wird das Klickverhalten definiert:

```typescript
const handleNoteClick = async (note) => {
  switch (note.status) {
    case NoteStatus.RECORDED:
      router.push(`/recording/${note.id}`)  // Zum Abspielen/Transkribieren
      break
    case NoteStatus.TRANSCRIBED:
    case NoteStatus.PROCESSED:
      router.push(`/preview/${note.id}`)    // Zum Bearbeiten/Senden
      break
    case NoteStatus.SENT:
      window.open(note.githubIssueUrl)      // GitHub Issue öffnen
      break
    case NoteStatus.ERROR:
      await retryNote(note.id)              // Erneut versuchen
      break
  }
}
```

## Best Practices

### Für Entwickler

1. **Transiente Stati nur während API-Calls setzen**: Die Stati `TRANSCRIBING`, `PROCESSING`, `SENDING` sollten nur unmittelbar vor einem API-Call gesetzt und direkt danach durch einen stabilen Status ersetzt werden.

2. **Immer Error-Handling**: Jeder API-Call, der einen transienten Status setzt, muss im `catch`-Block den Status auf `ERROR` setzen.

3. **Atomare Statusübergänge**: Status-Updates sollten atomar erfolgen - niemals einen Status setzen und dann vergessen, ihn zu aktualisieren.

4. **Status-Labels über Formatter**: Immer `getStatusLabel()` aus `src/utils/formatters.ts` verwenden, niemals hardcodierte Labels.

### Für UI/UX

1. **Loading-Indikatoren**: Transiente Stati sollten durch rotierende Icons/Spinner visualisiert werden.

2. **Disable während Verarbeitung**: Aktionen sollten während transienter Stati deaktiviert sein.

3. **Klare Fehlermeldungen**: Im `ERROR`-Status sollte immer eine aussagekräftige Fehlermeldung angezeigt werden.

4. **Retry-Möglichkeit**: Bei `ERROR` sollte immer eine Möglichkeit zum erneuten Versuch angeboten werden.

## Zukünftige Erweiterungen

Mögliche Erweiterungen des Statusmodells:

- **DRAFT**: Notizen, die vom User manuell als Entwurf gespeichert wurden
- **ARCHIVED**: Alte, abgeschlossene Notizen
- **DELETED**: Soft-Delete-Mechanismus statt hartem Löschen
- **SYNCING**: Für Offline-Synchronisation (wenn offline erstellt und noch nicht hochgeladen)
