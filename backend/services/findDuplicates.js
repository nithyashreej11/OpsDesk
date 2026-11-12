// Simple word-overlap similarity — free, no API key needed.
// Compares the new ticket's title+description against recent open tickets
// and flags ones that share a high proportion of significant words.

function toWordSet(text) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'my', 'to', 'and', 'of', 'in', 'on', 'i', 'it', 'this', 'that']);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  );
}

function similarityScore(setA, setB) {
  const intersection = [...setA].filter((word) => setB.has(word));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.length / union.size; // Jaccard similarity, 0 to 1
}

function findDuplicates(newTitle, newDescription, recentTickets, threshold = 0.3) {
  const newWords = toWordSet(`${newTitle} ${newDescription}`);

  const matches = recentTickets
    .map((ticket) => {
      const existingWords = toWordSet(`${ticket.title} ${ticket.description}`);
      const score = similarityScore(newWords, existingWords);
      return { ticket, score };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return { isDuplicate: false, matches: [] };
  }

  return {
    isDuplicate: true,
    matches: matches.map((m) => ({
      ticketId: m.ticket._id,
      title: m.ticket.title,
      similarity: Math.round(m.score * 100),
    })),
  };
}

module.exports = findDuplicates;

//*We break both texts into sets of meaningful words (stripping common filler words like "the", "is", "a")
//Jaccard similarity = (words they share) ÷ (total unique words across both) — a standard, simple way to measure text overlap without needing embeddings or an API
//threshold = 0.3 means "at least 30% word overlap" counts as a likely duplicate — tunable */