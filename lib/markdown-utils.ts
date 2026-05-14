/**
 * Markdown utility functions for processing and analyzing markdown content
 */

export interface MarkdownStats {
  words: number;
  characters: number;
  lines: number;
  paragraphs: number;
}

/**
 * Calculate statistics for markdown content
 */
export function getMarkdownStats(content: string): MarkdownStats {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const paragraphs = nonEmptyLines.filter(line => line.trim().length > 0).length;

  // Count words (split by whitespace)
  const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return {
    words,
    characters: content.length,
    lines: lines.length,
    paragraphs,
  };
}

/**
 * Format statistics for display
 */
export function formatStats(stats: MarkdownStats): string {
  const parts: string[] = [];

  if (stats.words > 0) {
    parts.push(`${stats.words} word${stats.words !== 1 ? 's' : ''}`);
  }
  if (stats.characters > 0) {
    parts.push(`${stats.characters} character${stats.characters !== 1 ? 's' : ''}`);
  }
  if (stats.lines > 0) {
    parts.push(`${stats.lines} line${stats.lines !== 1 ? 's' : ''}`);
  }

  return parts.join(' · ');
}

/**
 * Get line numbers for display
 */
export function getLineNumbers(content: string): number[] {
  return Array.from({ length: content.split('\n').length }, (_, i) => i + 1);
}

/**
 * Check if content is valid markdown
 */
export function isValidMarkdown(content: string): boolean {
  return content.length > 0;
}

/**
 * Extract frontmatter from markdown content
 */
export function extractFrontmatter(content: string): { frontmatter: string; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (match) {
    return {
      frontmatter: match[1],
      content: content.slice(match[0].length),
    };
  }

  return {
    frontmatter: '',
    content,
  };
}

/**
 * Debounce function for auto-save
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
