/**
 * Custom MediaWiki Parser
 * Handles MediaWiki/Wikitext syntax for rendering to HTML
 */

export type ContentFormat = 'markdown' | 'mediawiki';

export function detectFormatByExtension(filename: string): ContentFormat {
  if (!filename) return 'markdown';
  const ext = filename.toLowerCase().split('.').pop() || '';
  return ['wiki', 'mediawiki', 'wikitext', 'wt'].includes(ext) ? 'mediawiki' : 'markdown';
}

export function parseMediaWiki(content: string): string {
  try {
    const parser = new MediaWikiParser(content);
    return parser.parse();
  } catch (error) {
    console.error('MediaWiki parse error:', error);
    return `<div class="mediawiki-error">
      <p class="text-destructive">Error parsing MediaWiki content.</p>
      <pre class="bg-muted p-4 rounded">${escapeHtml(content)}</pre>
    </div>`;
  }
}

interface ListItem {
  level: number;
  listType: 'ul' | 'ol';
  type: 'list' | 'li';
}

class MediaWikiParser {
  private lines: string[];
  private result: string[] = [];
  private listStack: ListItem[] = [];
  private inTable = false;
  private tableCurrentRow: string[] = [];
  private inDefinitionList = false;

  constructor(private content: string) {
    this.lines = this.content.split('\n');
  }

  parse(): string {
    this.result = [];
    this.listStack = [];
    this.inTable = false;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        this.closeLists();
        this.closeDefinitionList();
        this.closeTable();
        continue;
      }

      if (this.handleHeader(line)) continue;
      if (this.handleHorizontalRule(line)) continue;

      // Inside a table, handle cells
      if (this.inTable) {
        if (this.handleTableEnd(line)) continue;
        if (this.handleTableRow(line)) continue;
        if (this.handleTableCell(line)) continue;
        // unrecognized line inside table — skip
        continue;
      }

      if (this.handleTableStart(line)) continue;
      if (this.handleList(line)) continue;
      if (this.handleDefinitionList(line)) continue;

      const processed = this.processInline(line);
      this.result.push(`<p>${processed}</p>`);
    }

    this.closeLists();
    this.closeDefinitionList();
    this.closeTable();

    return `<div class="mediawiki-content">${this.result.join('\n')}</div>`;
  }

  private handleHeader(line: string): boolean {
    const match = line.match(/^(={2,6})\s*(.+?)\s*\1\s*$/);
    if (!match) return false;

    const level = match[1].length;
    this.closeLists();
    this.closeDefinitionList();
    this.closeTable();

    this.result.push(`<h${level}>${this.processInline(match[2])}</h${level}>`);
    return true;
  }

  private handleHorizontalRule(line: string): boolean {
    if (!line.match(/^----\s*$/)) return false;
    this.closeLists();
    this.closeDefinitionList();
    this.closeTable();
    this.result.push('<hr class="my-4" />');
    return true;
  }

  private handleTableStart(line: string): boolean {
    // Match {| or :{| (table inside definition list)
    const match = line.match(/^:?(\{\|\s*(.*)$)/);
    if (!match) return false;
    this.closeLists();
    this.closeDefinitionList();
    this.inTable = true;
    this.tableCurrentRow = [];
    const rest = match[1];
    const attrs = rest.replace(/^\{\|\s*/, '').trim();
    this.result.push(`<table ${attrs || 'class="wikitable border border-border"'}>`);
    return true;
  }

  private handleTableEnd(line: string): boolean {
    if (line.trim() !== '|}') return false;
    if (this.tableCurrentRow.length > 0) this.renderTableRow();
    this.inTable = false;
    this.result.push('</table>');
    return true;
  }

  private handleTableRow(line: string): boolean {
    if (!line.match(/^\|-\s*(.*)$/)) return false;
    if (this.tableCurrentRow.length > 0) this.renderTableRow();
    return true;
  }

  private renderTableRow() {
    if (this.tableCurrentRow.length === 0) return;
    this.result.push('<tr>');
    for (const cell of this.tableCurrentRow) {
      this.result.push(cell);
    }
    this.result.push('</tr>');
    this.tableCurrentRow = [];
  }

  private handleTableCell(line: string): boolean {
    if (!this.inTable) return false;

    const trimmed = line.trimStart();
    if (!trimmed.startsWith('!') && !trimmed.startsWith('|')) return false;

    const isHeader = trimmed.startsWith('!');
    const content = trimmed.substring(1).trim();
    if (!content) return true;

    const separator = isHeader ? '!!' : '||';
    const cells = this.splitOutsideBrackets(content, separator);

    for (const cell of cells) {
      if (!cell) continue;

      const { attrs, content: cellContent } = this.splitCellAttrs(cell);
      const processed = this.processInline(cellContent);
      const tag = isHeader ? 'th' : 'td';
      const cls = isHeader
        ? 'border border-border px-3 py-2 bg-muted font-semibold text-left'
        : 'border border-border px-3 py-2';

      this.tableCurrentRow.push(
        `<${tag} ${attrs} class="${cls}">${processed}</${tag}>`
      );
    }

    return true;
  }

  // Split text by a separator string, but only outside [[...]] brackets
  private splitOutsideBrackets(text: string, separator: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    let i = 0;

    while (i < text.length) {
      if (text[i] === '[' && text[i + 1] === '[') {
        depth++;
        i += 2;
        continue;
      }
      if (text[i] === ']' && text[i + 1] === ']') {
        depth = Math.max(0, depth - 1);
        i += 2;
        continue;
      }
      if (depth === 0 && text.substring(i, i + separator.length) === separator) {
        parts.push(text.substring(start, i).trim());
        start = i + separator.length;
        i += separator.length;
        continue;
      }
      i++;
    }

    parts.push(text.substring(start).trim());
    return parts;
  }

  // Split a single cell into { attrs, content } at the first | outside [[...]]
  // Only treats as attributes if the part before | contains '='
  private splitCellAttrs(cell: string): { attrs: string; content: string } {
    let depth = 0;
    for (let i = 0; i < cell.length; i++) {
      if (cell[i] === '[' && cell[i + 1] === '[') {
        depth++;
        i++;
      } else if (cell[i] === ']' && cell[i + 1] === ']') {
        depth = Math.max(0, depth - 1);
        i++;
      } else if (cell[i] === '|' && depth === 0) {
        const before = cell.substring(0, i).trim();
        if (before.includes('=')) {
          return { attrs: before, content: cell.substring(i + 1).trim() };
        }
        break;
      }
    }
    return { attrs: '', content: cell.trim() };
  }

  private handleList(line: string): boolean {
    // Match lines starting with * or # (but not :* which is a definition sub-item)
    const match = line.match(/^([*#]+)\s*(.*)$/);
    if (!match) return false;

    const markers = match[1];
    const content = match[2];
    const level = markers.length;
    const type = markers[level - 1] === '*' ? 'ul' : 'ol';

    while (this.listStack.length > 0 && this.listStack[this.listStack.length - 1].level >= level) {
      const item = this.listStack.pop()!;
      if (item.type === 'li') this.result.push('</li>');
      this.result.push(`</${item.listType}>`);
    }

    if (this.listStack.length === 0 || this.listStack[this.listStack.length - 1].level < level) {
      this.result.push(`<${type} class="pl-6 my-1${type === 'ul' ? ' list-disc' : ' list-decimal'}">`);
      this.listStack.push({ level, listType: type, type: 'list' });
    }

    if (this.listStack.length > 0 && this.listStack[this.listStack.length - 1].type === 'li') {
      this.result.push('</li>');
    }

    this.result.push(`<li>${this.processInline(content)}`);
    this.listStack.push({ level, listType: type, type: 'li' });
    return true;
  }

  private closeLists() {
    while (this.listStack.length > 0) {
      const item = this.listStack.pop()!;
      if (item.type === 'li') this.result.push('</li>');
      else this.result.push(`</${item.listType}>`);
    }
  }

  private handleDefinitionList(line: string): boolean {
    const match = line.match(/^(:+)(.*)$/);
    if (!match) return false;

    const colons = match[1].length;
    let content = match[2];

    if (!this.inDefinitionList) {
      this.result.push('<dl class="my-2 ml-4">');
      this.inDefinitionList = true;
    }

    // Handle :* or :# (definition list item that is itself a list)
    const listMatch = content.match(/^([*#]+)\s*(.*)$/);
    if (listMatch) {
      // Close any open sub-lists first, then delegate to list handler
      const markers = listMatch[1];
      const listContent = listMatch[2];
      const listType = markers[markers.length - 1] === '*' ? 'ul' : 'ol';

      this.result.push(`<dd class="ml-4 my-1"><${listType} class="pl-4 my-1${listType === 'ul' ? ' list-disc' : ' list-decimal'}"><li>${this.processInline(listContent)}</li></${listType}></dd>`);
      return true;
    }

    this.result.push(`<dd class="ml-4 my-1" style="margin-left: ${colons}rem">${this.processInline(content.trim())}</dd>`);
    return true;
  }

  private closeDefinitionList() {
    if (this.inDefinitionList) {
      this.result.push('</dl>');
      this.inDefinitionList = false;
    }
  }

  private closeTable() {
    if (this.inTable) {
      if (this.tableCurrentRow.length > 0) this.renderTableRow();
      this.result.push('</table>');
      this.inTable = false;
    }
  }

  private processInline(text: string): string {
    let result = text;

    // HTML comments (remove)
    result = result.replace(/<!--[\s\S]*?-->/g, '');

    // Images before links (otherwise [[Image:...]] gets consumed by link handler)
    result = result.replace(/\[\[(?:Image|File):([^\]|]+)(\|[^\]]*)?\]\]/gi,
      (_match, filename: string, options?: string) => {
        const alt = options ? options.replace(/^\|/, '').split('|')[0] || filename : filename;
        return `<img src="/images/${encodeURIComponent(filename)}" alt="${escapeHtml(alt)}" class="wiki-image rounded-lg shadow-md my-2" />`;
      }
    );

    // Bold + italic: '''''text'''''
    result = result.replace(/'''''(.+?)'''''/g, '<strong><em>$1</em></strong>');

    // Bold: '''text'''
    result = result.replace(/'''(.+?)'''/g, '<strong>$1</strong>');

    // Italic: ''text''
    result = result.replace(/''(.+?)''/g, '<em>$1</em>');

    // Internal links: [[Page]], [[Page|Text]], [[Page#Section|Text]]
    result = result.replace(/\[\[([^\]|#]+)(#[^\]|]+)?(\|([^\]]+))?\]\]/g,
      (_match, page: string, section?: string, _?: string, display?: string) => {
        const fullPage = (page || '') + (section || '');
        const text = display || page;
        return `<a href="/wiki/${encodeURIComponent(fullPage)}" class="wiki-link-internal text-primary hover:underline">${text}</a>`;
      }
    );

    // External links with double brackets and label: [[url text]] (MediaWiki syntax)
    result = result.replace(/\[\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]\]/g,
      '<a href="$1" class="wiki-link-external text-primary hover:underline" target="_blank" rel="noopener noreferrer">$2</a>'
    );

    // External links with single brackets and label: [url label]
    result = result.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g,
      '<a href="$1" class="wiki-link-external text-primary hover:underline" target="_blank" rel="noopener noreferrer">$2</a>'
    );

    // Bare external links: [url]
    result = result.replace(/\[(https?:\/\/[^\s]+)\]/g,
      '<a href="$1" class="wiki-link-external text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return result;
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
