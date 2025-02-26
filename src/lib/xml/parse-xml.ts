/**
 * Lets simplify XmlElement into a one and only supported of output type
 * Reason: simplify the later parsing of skin xml(s).
 */

import { StringScanner } from "@rgrove/parse-xml/dist/lib/StringScanner";
import * as syntax from "@rgrove/parse-xml/dist/lib/syntax";
import { XmlError } from "@rgrove/parse-xml/dist/lib/XmlError";
import { XmlElement } from "./xml-element";
import { xmlRegistry } from "@lib/registry";

const emptyString = "";
let DEBUG = 0;

const temp_att: string[] = [];

export class Parser {
  readonly document: XmlElement;

  private currentNode: XmlElement;
  // private readonly options: ParserOptions;
  private readonly scanner: StringScanner;

  /**
   * @param xml XML string to parse.
   * @param options Parser options.
   */
  constructor(xml: string, root:XmlElement=null) {
    let doc = (this.document = root? root : new XmlElement('DOC'));
    let scanner = (this.scanner = new StringScanner(xml));

    this.currentNode = doc;
    // this.options = options;

    // if (this.options.includeOffsets) {
    //   doc.start = 0;
    //   doc.end = xml.length;
    // }

    scanner.consumeStringFast("\uFEFF"); // byte order mark
    this.consumeProlog();

    if (!this.consumeElement()) {
      throw this.error("Root element is missing or invalid");
    }

    while (this.consumeMisc()) {} // eslint-disable-line no-empty

    if (!scanner.isEnd) {
      throw this.error("Extra content at the end of the document");
    }

    if (DEBUG) {
      console.log("KNOWN-ATTs:", temp_att.sort());
    }
  }

  newNode(tag:string){
    
  }

  /**
   * Adds the given `XmlElement` as a child of `this.currentNode`.
   */
  addNode(node: XmlElement, charIndex: number) {
    node.parent = this.currentNode;

    // if (this.options.includeOffsets) {
    //   node.start = this.scanner.charIndexToByteIndex(charIndex);
    //   node.end = this.scanner.charIndexToByteIndex();
    // }

    // ts-expect-error: XmlElement has a more limited set of possible children
    // than XmlElement so TypeScript is unhappy, but we always do the right
    // thing.
    this.currentNode.children.push(node);
    return true;
  }

  /**
   * Adds the given _text_ to the document, either by appending it to a
   * preceding `XmlText` node (if possible) or by creating a new `XmlText` node.
   */
  addText(text: string, charIndex: number) {
    let { children } = this.currentNode;
    let { length } = children;

    text = text.trim();

    if (!text) return true; // ignore whitespace

    if (length > 0) {
      let prevNode = children[length - 1];

      if (prevNode.text) {
        // let textNode = prevNode as XmlText;

        // The previous node is a text node, so we can append to it and avoid
        // creating another node.
        prevNode.text += text;

        // if (this.options.includeOffsets) {
        //   textNode.end = this.scanner.charIndexToByteIndex();
        // }

        return true;
      }
    }

    return this.addNode(new XmlElement("TEXT", { text }), charIndex);
  }

  /**
   * Consumes element attributes.
   *
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-starttags
   */
  consumeAttributes(): Record<string, string> {
    let attributes = Object.create(null);

    while (this.consumeWhitespace()) {
      let attrName = this.consumeName();

      if (!attrName) {
        break;
      }
      attrName = attrName.toLowerCase();
      if (DEBUG) {
        if (!temp_att.includes(attrName)) temp_att.push(attrName);
      }

      let attrValue = this.consumeEqual() && this.consumeAttributeValue();

      if (attrValue === false) {
        throw this.error("Attribute value expected");
      }

      if (attrName in attributes) {
        throw this.error(`Duplicate attribute: ${attrName}`);
      }

      if (
        attrName === "xml:space" &&
        attrValue !== "default" &&
        attrValue !== "preserve"
      ) {
        throw this.error(
          'Value of the `xml:space` attribute must be "default" or "preserve"'
        );
      }

      attributes[attrName] = attrValue;
    }

    // if (this.options.sortAttributes) {
    //   let attrNames = Object.keys(attributes).sort();
    //   let sortedAttributes = Object.create(null);

    //   for (let i = 0; i < attrNames.length; ++i) {
    //     let attrName = attrNames[i] as string;
    //     sortedAttributes[attrName] = attributes[attrName];
    //   }

    //   attributes = sortedAttributes;
    // }

    return attributes;
  }

  /**
   * Consumes an `AttValue` (attribute value) if possible.
   *
   * @returns
   *   Contents of the `AttValue` minus quotes, or `false` if nothing was
   *   consumed. An empty string indicates that an `AttValue` was consumed but
   *   was empty.
   *
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-AttValue
   */
  consumeAttributeValue(): string | false {
    let { scanner } = this;
    let quote = scanner.peek();

    if (quote !== '"' && quote !== "'") {
      return false;
    }

    scanner.advance();

    let chars;
    let isClosed = false;
    let value = emptyString;
    let regex =
      quote === '"'
        ? syntax.attValueCharDoubleQuote
        : syntax.attValueCharSingleQuote;

    matchLoop: while (!scanner.isEnd) {
      chars = scanner.consumeMatch(regex);

      if (chars) {
        this.validateChars(chars);
        value += chars.replace(syntax.attValueNormalizedWhitespace, " ");
      }

      switch (scanner.peek()) {
        case quote:
          isClosed = true;
          break matchLoop;

        case "&":
          value += this.consumeReference();
          continue;

        case "<":
          throw this.error(
            "Unescaped `<` is not allowed in an attribute value"
          );

        case emptyString:
          break matchLoop;
      }
    }

    if (!isClosed) {
      throw this.error("Unclosed attribute");
    }

    scanner.advance();
    return value;
  }

  /**
   * Consumes a CDATA section if possible.
   *
   * @returns Whether a CDATA section was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-cdata-sect
   */
  consumeCdataSection(): boolean {
    let { scanner } = this;
    // let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<![CDATA[")) {
      return false;
    }

    let text = scanner.consumeUntilString("]]>");
    this.validateChars(text);

    if (!scanner.consumeStringFast("]]>")) {
      throw this.error("Unclosed CDATA section");
    }

    // return this.options.preserveCdata
    //   ? this.addNode(new XmlCdata(normalizeLineBreaks(text)), startIndex)
    //   : this.addText(text, startIndex);
    return true;
  }

  /**
   * Consumes character data if possible.
   *
   * @returns Whether character data was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#dt-chardata
   */
  consumeCharData(): boolean {
    let { scanner } = this;
    let startIndex = scanner.charIndex;
    let charData = scanner.consumeUntilMatch(syntax.endCharData);

    if (!charData) {
      return false;
    }

    this.validateChars(charData);

    if (scanner.peek(3) === "]]>") {
      throw this.error(
        "Element content may not contain the CDATA section close delimiter `]]>`"
      );
    }

    return this.addText(charData, startIndex);
  }

  /**
   * Consumes a comment if possible.
   *
   * @returns Whether a comment was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Comment
   */
  consumeComment(): boolean {
    let { scanner } = this;
    // let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<!--")) {
      return false;
    }

    let content = scanner.consumeUntilString("--");
    this.validateChars(content);

    if (!scanner.consumeStringFast("-->")) {
      if (scanner.peek(2) === "--") {
        throw this.error("The string `--` isn't allowed inside a comment");
      }

      throw this.error("Unclosed comment");
    }

    // return this.options.preserveComments
    //   ? this.addNode(new XmlComment(normalizeLineBreaks(content)), startIndex)
    //   : true;
    return true;
  }

  /**
   * Consumes a reference in a content context if possible.
   *
   * This differs from `consumeReference()` in that a consumed reference will be
   * added to the document as a text node instead of returned.
   *
   * @returns Whether a reference was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#entproc
   */
  consumeContentReference(): boolean {
    let startIndex = this.scanner.charIndex;
    let ref = this.consumeReference();

    return ref ? this.addText(ref, startIndex) : false;
  }

  /**
   * Consumes a doctype declaration if possible.
   *
   * This is a loose implementation since doctype declarations are currently
   * discarded without further parsing.
   *
   * @returns Whether a doctype declaration was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#dtd
   */
  consumeDoctypeDeclaration(): boolean {
    let { scanner } = this;
    // let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<!DOCTYPE")) {
      return false;
    }

    let tag = this.consumeWhitespace() && this.consumeName();

    if (!tag) {
      throw this.error("Expected a tag");
    }

    let publicId;
    let systemId;

    if (this.consumeWhitespace()) {
      if (scanner.consumeStringFast("PUBLIC")) {
        publicId = this.consumeWhitespace() && this.consumePubidLiteral();

        if (publicId === false) {
          throw this.error("Expected a public identifier");
        }

        this.consumeWhitespace();
      }

      if (publicId !== undefined || scanner.consumeStringFast("SYSTEM")) {
        this.consumeWhitespace();
        systemId = this.consumeSystemLiteral();

        if (systemId === false) {
          throw this.error("Expected a system identifier");
        }

        this.consumeWhitespace();
      }
    }

    let internalSubset;

    if (scanner.consumeStringFast("[")) {
      // The internal subset may contain comments that contain `]` characters,
      // so we can't use `consumeUntilString()` here.
      internalSubset = scanner.consumeUntilMatch(/\][\x20\t\r\n]*>/);

      if (!scanner.consumeStringFast("]")) {
        throw this.error("Unclosed internal subset");
      }

      this.consumeWhitespace();
    }

    if (!scanner.consumeStringFast(">")) {
      throw this.error("Unclosed doctype declaration");
    }

    // return this.options.preserveDocumentType
    //   ? this.addNode(new XmlDocumentType(tag, publicId, systemId, internalSubset), startIndex)
    //   : true;
    return true;
  }

  /**
   * Consumes an element if possible.
   *
   * @returns Whether an element was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-element
   */
  consumeElement(): boolean {
    let { scanner } = this;
    let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<")) {
      return false;
    }

    let tag = this.consumeName();

    if (!tag) {
      scanner.reset(startIndex);
      return false;
    }

    let attributes = this.consumeAttributes();
    let isEmpty = !!scanner.consumeStringFast("/>");

    // let element = new XmlElement(tag, attributes);
    // tag = tag.toLowerCase()
    const Klass = xmlRegistry.get(tag.toLowerCase(), XmlElement)
    let element = new Klass(tag, attributes);

    element.parent = this.currentNode;

    if (!isEmpty) {
      if (!scanner.consumeStringFast(">")) {
        throw this.error(`Unclosed start tag for element \`${tag}\``);
      }

      this.currentNode = element;

      do {
        this.consumeCharData();
      } while (
        this.consumeElement() ||
        this.consumeContentReference() ||
        this.consumeCdataSection() ||
        this.consumeProcessingInstruction() ||
        this.consumeComment()
      );

      let endTagMark = scanner.charIndex;
      let endTagName;

      if (
        !scanner.consumeStringFast("</") ||
        !(endTagName = this.consumeName()) ||
        endTagName !== tag
      ) {
        scanner.reset(endTagMark);
        throw this.error(`Missing end tag for element ${tag}`);
      }

      this.consumeWhitespace();

      if (!scanner.consumeStringFast(">")) {
        throw this.error(`Unclosed end tag for element ${tag}`);
      }

      this.currentNode = element.parent;
    }

    return this.addNode(element, startIndex);
  }

  /**
   * Consumes an `Eq` production if possible.
   *
   * @returns Whether an `Eq` production was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Eq
   */
  consumeEqual(): boolean {
    this.consumeWhitespace();

    if (this.scanner.consumeStringFast("=")) {
      this.consumeWhitespace();
      return true;
    }

    return false;
  }

  /**
   * Consumes `Misc` content if possible.
   *
   * @returns Whether anything was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Misc
   */
  consumeMisc(): boolean {
    return (
      this.consumeComment() ||
      this.consumeProcessingInstruction() ||
      this.consumeWhitespace()
    );
  }

  /**
   * Consumes one or more `Name` characters if possible.
   *
   * @returns `Name` characters, or an empty string if none were consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Name
   */
  consumeName(): string {
    return syntax.isNameStartChar(this.scanner.peek())
      ? this.scanner.consumeMatchFn(syntax.isNameChar)
      : emptyString;
  }

  /**
   * Consumes a processing instruction if possible.
   *
   * @returns Whether a processing instruction was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-pi
   */
  consumeProcessingInstruction(): boolean {
    let { scanner } = this;
    let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<?")) {
      return false;
    }

    let tag = this.consumeName();

    if (tag) {
      if (tag.toLowerCase() === "xml") {
        scanner.reset(startIndex);
        throw this.error("XML declaration isn't allowed here");
      }
    } else {
      throw this.error("Invalid processing instruction");
    }

    if (!this.consumeWhitespace()) {
      if (scanner.consumeStringFast("?>")) {
        // return this.addNode(new XmlProcessingInstruction(tag), startIndex);
        return true;
      }

      throw this.error(
        "Whitespace is required after a processing instruction tag"
      );
    }

    let content = scanner.consumeUntilString("?>");
    this.validateChars(content);

    if (!scanner.consumeStringFast("?>")) {
      throw this.error("Unterminated processing instruction");
    }

    // return this.addNode(new XmlProcessingInstruction(tag, normalizeLineBreaks(content)), startIndex);
    return true;
  }

  /**
   * Consumes a prolog if possible.
   *
   * @returns Whether a prolog was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-prolog-dtd
   */
  consumeProlog(): boolean {
    let { scanner } = this;
    let startIndex = scanner.charIndex;

    this.consumeXmlDeclaration();

    while (this.consumeMisc()) {} // eslint-disable-line no-empty

    if (this.consumeDoctypeDeclaration()) {
      while (this.consumeMisc()) {} // eslint-disable-line no-empty
    }

    return startIndex < scanner.charIndex;
  }

  /**
   * Consumes a public identifier literal if possible.
   *
   * @returns
   *   Value of the public identifier literal minus quotes, or `false` if
   *   nothing was consumed. An empty string indicates that a public id literal
   *   was consumed but was empty.
   *
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-PubidLiteral
   */
  consumePubidLiteral(): string | false {
    let startIndex = this.scanner.charIndex;
    let value = this.consumeSystemLiteral();

    if (
      value !== false &&
      !/^[-\x20\r\na-zA-Z0-9'()+,./:=?;!*#@$_%]*$/.test(value)
    ) {
      this.scanner.reset(startIndex);
      throw this.error("Invalid character in public identifier");
    }

    return value;
  }

  /**
   * Consumes a reference if possible.
   *
   * This differs from `consumeContentReference()` in that a consumed reference
   * will be returned rather than added to the document.
   *
   * @returns
   *   Parsed reference value, or `false` if nothing was consumed (to
   *   distinguish from a reference that resolves to an empty string).
   *
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Reference
   */
  consumeReference(): string | false {
    let { scanner } = this;

    if (!scanner.consumeStringFast("&")) {
      return false;
    }

    let ref = scanner.consumeMatchFn(syntax.isReferenceChar);

    if (scanner.consume() !== ";") {
      throw this.error(
        "Unterminated reference (a reference must end with `;`)"
      );
    }

    let parsedValue;

    if (ref[0] === "#") {
      // This is a character reference.
      let codePoint =
        ref[1] === "x"
          ? parseInt(ref.slice(2), 16) // Hex codepoint.
          : parseInt(ref.slice(1), 10); // Decimal codepoint.

      if (isNaN(codePoint)) {
        throw this.error("Invalid character reference");
      }

      if (!syntax.isXmlCodePoint(codePoint)) {
        throw this.error(
          "Character reference resolves to an invalid character"
        );
      }

      parsedValue = String.fromCodePoint(codePoint);
    } else {
      // This is an entity reference.
      parsedValue = syntax.predefinedEntities[ref];

      if (parsedValue === undefined) {
        // let {
        //   ignoreUndefinedEntities,
        //   resolveUndefinedEntity,
        // } = this.options;

        let wrappedRef = `&${ref};`; // for backcompat with <= 2.x

        // if (resolveUndefinedEntity) {
        //   let resolvedValue = resolveUndefinedEntity(wrappedRef);

        //   if (resolvedValue !== null && resolvedValue !== undefined) {
        //     let type = typeof resolvedValue;

        //     if (type !== 'string') {
        //       throw new TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${type}`);
        //     }

        //     return resolvedValue;
        //   }
        // }

        // if (ignoreUndefinedEntities) {
        //   return wrappedRef;
        // }

        scanner.reset(-wrappedRef.length);
        throw this.error(`Named entity isn't defined: ${wrappedRef}`);
      }
    }

    return parsedValue;
  }

  /**
   * Consumes a `SystemLiteral` if possible.
   *
   * A `SystemLiteral` is similar to an attribute value, but allows the
   * characters `<` and `&` and doesn't replace references.
   *
   * @returns
   *   Value of the `SystemLiteral` minus quotes, or `false` if nothing was
   *   consumed. An empty string indicates that a `SystemLiteral` was consumed
   *   but was empty.
   *
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-SystemLiteral
   */
  consumeSystemLiteral(): string | false {
    let { scanner } = this;
    let quote =
      scanner.consumeStringFast('"') || scanner.consumeStringFast("'");

    if (!quote) {
      return false;
    }

    let value = scanner.consumeUntilString(quote);
    this.validateChars(value);

    if (!scanner.consumeStringFast(quote)) {
      throw this.error("Missing end quote");
    }

    return value;
  }

  /**
   * Consumes one or more whitespace characters if possible.
   *
   * @returns Whether any whitespace characters were consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#white
   */
  consumeWhitespace(): boolean {
    return !!this.scanner.consumeMatchFn(syntax.isWhitespace);
  }

  /**
   * Consumes an XML declaration if possible.
   *
   * @returns Whether an XML declaration was consumed.
   * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-XMLDecl
   */
  consumeXmlDeclaration(): boolean {
    let { scanner } = this;
    let startIndex = scanner.charIndex;

    if (!scanner.consumeStringFast("<?xml")) {
      return false;
    }

    // if (!this.consumeWhitespace()) {
    //   throw this.error('Invalid XML declaration');
    // }

    // let version = !!scanner.consumeStringFast('version')
    //   && this.consumeEqual()
    //   && this.consumeSystemLiteral();

    // if (version === false) {
    //   throw this.error('XML version is missing or invalid');
    // } else if (!/^1\.[0-9]+$/.test(version)) {
    //   throw this.error('Invalid character in version number');
    // }

    // let encoding;
    // let standalone;

    // if (this.consumeWhitespace()) {
    //   encoding = !!scanner.consumeStringFast('encoding')
    //     && this.consumeEqual()
    //     && this.consumeSystemLiteral();

    //   if (encoding) {
    //     this.consumeWhitespace();
    //   }

    //   standalone = !!scanner.consumeStringFast('standalone')
    //     && this.consumeEqual()
    //     && this.consumeSystemLiteral();

    //   if (standalone) {
    //     if (standalone !== 'yes' && standalone !== 'no') {
    //       throw this.error('Only "yes" and "no" are permitted as values of `standalone`');
    //     }

    //     this.consumeWhitespace();
    //   }
    // }

    this.consumeAttributes();

    if (!scanner.consumeStringFast("?>")) {
      throw this.error("Invalid or unclosed XML declaration");
    }

    // return this.options.preserveXmlDeclaration
    //   ? this.addNode(new XmlDeclaration(
    //       version,
    //       encoding || undefined,
    //       (standalone as 'yes' | 'no' | false) || undefined,
    //     ), startIndex)
    //   : true;
    return true;
  }

  /**
   * Returns an `XmlError` for the current scanner position.
   */
  error(message: string) {
    let { scanner } = this;
    return new XmlError(message, scanner.charIndex, scanner.string);
  }

  /**
   * Throws an invalid character error if any character in the given _string_
   * isn't a valid XML character.
   */
  validateChars(str: string) {
    let { length } = str;

    for (let i = 0; i < length; ++i) {
      let cp = str.codePointAt(i) as number;

      if (!syntax.isXmlCodePoint(cp)) {
        this.scanner.reset(-([...str].length - i));
        throw this.error("Invalid character");
      }

      if (cp > 65535) {
        i += 1;
      }
    }
  }
}

/**
 * Parses the given XML string and returns an `XmlDocument` instance
 * representing the document tree.
 *
 * @example
 *
 * import { parseXml } from '@rgrove/parse-xml';
 * let doc = parseXml('<kittens fuzzy="yes">I like fuzzy kittens.</kittens>');
 *
 * @param xml XML string to parse.
 * @param options Parser options.
 */
export function parseXml(xml: string, root:XmlElement=null) {
  return new Parser(xml, root).document;
}

export function parseXmlFragment(xml: string): XmlElement {
  // Note: Included files don't have a single root node, so we add a synthetic one.
  // A different XML parser library might make this unnessesary.
  return parseXml(`<wrapper>${xml}</wrapper>`) as unknown as XmlElement;
}
