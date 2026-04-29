// src/utils/bm25.js

/**
 * A lightweight, zero-dependency implementation of the Okapi BM25 ranking function.
 */
export class BM25 {
  /**
   * @param {Array} corpus - The array of documents to index.
   * @param {Function} extractTextFn - A function that takes a document and returns an array of strings to index.
   * @param {number} k1 - Controls non-linear term frequency normalization (default 1.5).
   * @param {number} b - Controls to what degree document length normalizes tf values (default 0.75).
   */
  constructor(corpus = [], extractTextFn = (doc) => [doc], k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.documents = corpus;
    this.N = corpus.length;
    this.avgdl = 0;
    this.docLengths = [];
    this.termFreqs = [];
    this.docFreqs = {};

    this._buildIndex(extractTextFn);
  }

  /**
   * Tokenizes and normalizes text.
   * - Removes diacritics
   * - Converts to lowercase
   * - Removes non-alphanumeric characters
   * - Splits by whitespace
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace punctuation with space
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  _buildIndex(extractTextFn) {
    let totalLength = 0;

    this.documents.forEach((doc, idx) => {
      // Extract all text fields and join them
      const textFields = extractTextFn(doc).filter(Boolean).join(" ");
      const tokens = this.tokenize(textFields);

      this.docLengths[idx] = tokens.length;
      totalLength += tokens.length;

      const termFreq = {};
      tokens.forEach((t) => {
        termFreq[t] = (termFreq[t] || 0) + 1;
      });
      this.termFreqs[idx] = termFreq;

      // Calculate Document Frequency (DF)
      Object.keys(termFreq).forEach((t) => {
        this.docFreqs[t] = (this.docFreqs[t] || 0) + 1;
      });
    });

    this.avgdl = this.N > 0 ? totalLength / this.N : 0;
  }

  /**
   * Calculate Inverse Document Frequency for a term.
   */
  idf(term) {
    const n = this.docFreqs[term] || 0;
    // Standard BM25 IDF formula
    return Math.log((this.N - n + 0.5) / (n + 0.5) + 1);
  }

  /**
   * Searches the indexed corpus and returns matching documents ranked by BM25 score.
   * 
   * @param {string} query - The search query
   * @returns {Array} Array of ranked results: [{ doc: originalDoc, score: number }]
   */
  search(query) {
    if (!query || query.trim() === "") {
      return this.documents.map((doc) => ({ doc, score: 0 }));
    }

    const tokens = this.tokenize(query);
    if (tokens.length === 0) {
      return this.documents.map((doc) => ({ doc, score: 0 }));
    }

    const scores = this.documents.map((doc, idx) => {
      let score = 0;
      const dl = this.docLengths[idx];
      const tfDict = this.termFreqs[idx];

      tokens.forEach((term) => {
        if (!tfDict[term]) return; // Term doesn't appear in this document

        const tf = tfDict[term];
        const num = tf * (this.k1 + 1);
        const den = tf + this.k1 * (1 - this.b + this.b * (dl / (this.avgdl || 1)));
        
        score += this.idf(term) * (num / den);
      });

      return { doc, score };
    });

    // Filter out documents with 0 score (no match) and sort descending
    return scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.doc); // Return just the documents in ranked order
  }
}
