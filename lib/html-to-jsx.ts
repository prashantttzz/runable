const ATTRIBUTE_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
};

const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const camelCase = (prop: string) =>
  prop
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");

function convertStyle(styleValue: string) {
  const declarations = styleValue
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean);

  if (!declarations.length) return "";

  const parts = declarations
    .map((decl) => {
      const [prop, value] = decl.split(":");
      if (!prop || !value) return "";
      return `${camelCase(prop)}: "${value.trim()}"`;
    })
    .filter(Boolean);

  return parts.length ? `style={{ ${parts.join(", ")} }}` : "";
}

function convertAttributes(el: Element) {
  const attrs: string[] = [];
  Array.from(el.attributes).forEach((attr) => {
    if (attr.name === "data-rid") return;
    if (attr.name === "style") {
      const styleString = convertStyle(attr.value);
      if (styleString) attrs.push(styleString);
      return;
    }

    const attrName = ATTRIBUTE_MAP[attr.name] || attr.name;
    if (attr.value === "" && typeof (el as any)[attr.name] === "boolean") {
      attrs.push(attrName);
      return;
    }

    const safeValue = attr.value.replace(/"/g, '&quot;');
    attrs.push(`${attrName}="${safeValue}"`);
  });

  return attrs.length ? " " + attrs.join(" ") : "";
}

function serializeNode(node: ChildNode, depth = 0): string {
  const indent = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? `${indent}${text}` : "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const attrs = convertAttributes(el);

  const children = Array.from(el.childNodes)
    .map((child) => serializeNode(child, depth + 1))
    .filter(Boolean);

  if (!children.length && SELF_CLOSING_TAGS.has(tag)) {
    return `${indent}<${tag}${attrs} />`;
  }

  if (!children.length) {
    return `${indent}<${tag}${attrs}></${tag}>`;
  }

  const childrenContent = children.join("\n");
  return `${indent}<${tag}${attrs}>\n${childrenContent}\n${indent}</${tag}>`;
}

export function htmlToJsx(html: string) {
  if (typeof window === "undefined") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  return Array.from(doc.body.childNodes)
    .map((node) => serializeNode(node, 0))
    .filter(Boolean)
    .join("\n");
}

