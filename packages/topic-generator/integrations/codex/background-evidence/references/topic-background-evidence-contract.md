# Topic Background Evidence proposal contract

Return exactly one object:

```json
{
  "schemaVersion": "topic-background-evidence-proposal/v1",
  "keyword": "ANUA",
  "site": "us",
  "language": "zh",
  "themeIntentDigest": "sha256:...",
  "sources": [
    {
      "id": "source:anua-official-about",
      "type": "official-brand",
      "title": "About ANUA",
      "url": "https://brand.example/about",
      "publisher": "ANUA"
    }
  ],
  "claims": [
    {
      "id": "claim:anua-identity",
      "type": "identity",
      "text": "A concise fact explicitly supported by the cited source.",
      "sourceIds": ["source:anua-official-about"],
      "usage": "context-only"
    }
  ]
}
```

Allowed source types are `official-brand`, `wikipedia`, and `authoritative-cultural`. Allowed claim
types are `identity`, `origin`, `meaning`, `tradition`, and `terminology`. IDs must be unique;
every claim needs at least one known source ID. Use 1–8 opened HTTPS sources and 1–12 concise
claims. The runtime validates identity, source-type boundaries, references, counts, and digests.

`context-only` means the claim can orient a newcomer. It does not authorize product ingredient,
benefit, efficacy, popularity, inventory, price, discount, rating, or customer-outcome language.
