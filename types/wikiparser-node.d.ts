declare module 'wikiparser-node/bundle/bundle-es8.min.js' {
  interface WikiParserOptions {
    /**
     * Language code for the parser (e.g., 'en', 'zh', 'fr')
     */
    lang?: string
    /**
     * Site configuration name
     */
    config?: string
  }

  interface WikiParserAST {
    /**
     * Convert the AST to HTML
     */
    toHtml(): string
    /**
     * Convert the AST back to Wikitext
     */
    toWikitext(): string
  }

  class WikiParser {
    /**
     * Create a new WikiParser instance
     * @param wikitext - The MediaWiki wikitext to parse
     * @param optionsOrLang - Options object or language code
     */
    constructor(wikitext: string, optionsOrLang?: string | WikiParserOptions)

    /**
     * Parse the wikitext and return an AST
     */
    parse(): WikiParserAST

    /**
     * Get parser configuration
     */
    static config: string
  }

  export default WikiParser
}
