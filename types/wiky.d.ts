declare module 'wiky' {
  interface WikyOptions {
    /**
     * Whether to convert URLs to links
     */
    linkify?: boolean
    /**
     * Whether to parse images
     */
    image?: boolean
    /**
     * Whether to parse tables
     */
    table?: boolean
    /**
     * CSS class for links
     */
    linkClass?: string
    /**
     * CSS class for images
     */
    imageClass?: string
  }

  class Wiky {
    /**
     * Convert MediaWiki markup to HTML
     * @param input - MediaWiki wikitext
     * @param options - Parsing options
     * @returns HTML string
     */
    static toHtml(input: string, options?: WikyOptions): string

    /**
     * Convert HTML back to MediaWiki markup
     * @param input - HTML string
     * @returns MediaWiki wikitext
     */
    static toWikitext(input: string): string
  }

  export default Wiky
}
