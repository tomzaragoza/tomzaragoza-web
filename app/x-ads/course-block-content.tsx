/* eslint-disable @next/next/no-img-element -- Private media uses authenticated redirect URLs. */
import type { CSSProperties, ReactNode } from "react";
import { type CourseBlock, type CourseInline, courseBlockText, safeContentUrl } from "@/lib/course-blocks";
import { CourseVideo } from "./course-video";
import styles from "./course-document.module.css";

const colors: Record<string, string> = { gray: "#787774", brown: "#9f6b53", red: "#d44c47", orange: "#d9730d", yellow: "#b68a00", green: "#448361", blue: "#337ea9", purple: "#9065b0", pink: "#c14c8a" };
function color(value?: string) { return value && value !== "default" ? colors[value] || (/^#[a-f0-9]{3,8}$/i.test(value) ? value : undefined) : undefined; }
function Inline({ content }: { content: CourseInline[] }) {
  return content.map((part, index) => {
    if (part.type === "link") return <a key={index} href={safeContentUrl(part.href) ? part.href : undefined} rel="noreferrer"><Inline content={part.content} /></a>;
    let node: ReactNode = part.text;
    if (part.styles.bold) node = <strong>{node}</strong>;
    if (part.styles.italic) node = <em>{node}</em>;
    if (part.styles.underline) node = <u>{node}</u>;
    if (part.styles.strike) node = <s>{node}</s>;
    if (part.styles.code) node = <code>{node}</code>;
    return <span key={index} style={{ color: color(part.styles.textColor), backgroundColor: color(part.styles.backgroundColor) }}>{node}</span>;
  });
}
function BlockContent({ block, pageSlug }: { block: CourseBlock; pageSlug?: string }) {
  const content = Array.isArray(block.content) ? <Inline content={block.content} /> : null;
  const url = block.props.url && safeContentUrl(block.props.url) ? block.props.url : undefined;
  switch (block.type) {
    case "heading": { const Heading = `h${Math.max(2, block.props.level ?? 2)}` as "h2" | "h3" | "h4" | "h5" | "h6"; return <Heading>{content}</Heading>; }
    case "paragraph": return <p>{content || <br />}</p>;
    case "bulletListItem": case "numberedListItem": return <>{content}</>;
    case "checkListItem": return <p><input type="checkbox" checked={block.props.checked ?? false} readOnly aria-label="Checklist item" /> {content}</p>;
    case "toggleListItem": return <details><summary>{content}</summary><CourseBlocks blocks={block.children} pageSlug={pageSlug} /></details>;
    case "quote": return <blockquote>{content}</blockquote>;
    case "codeBlock": return <pre><code>{courseBlockText(block)}</code></pre>;
    case "divider": return <hr />;
    case "image": return <figure><img src={url} alt={block.props.name || block.props.caption || "Course image"} loading="lazy" style={{ width: block.props.previewWidth, maxWidth: "100%" }} />{block.props.caption && <figcaption>{block.props.caption}</figcaption>}</figure>;
    case "video": return url ? <CourseVideo video={{ url, title: block.props.caption || block.props.name }} pageSlug={pageSlug} videoId={block.id} /> : null;
    case "audio": return <figure><audio controls preload="metadata" src={url} />{block.props.caption && <figcaption>{block.props.caption}</figcaption>}</figure>;
    case "file": return <p><a href={url}>{block.props.name || "Download file"}</a>{block.props.caption && <> — {block.props.caption}</>}</p>;
    case "table": {
      const table = !Array.isArray(block.content) ? block.content : undefined;
      return table ? <div className={styles.tableScroll}><table><colgroup>{table.columnWidths?.map((width, i) => <col key={i} style={{ width: width ?? undefined }} />)}</colgroup><tbody>{table.rows.map((row, r) => <tr key={r}>{row.cells.map((cell, c) => {
        const Cell = r < (table.headerRows ?? 0) || c < (table.headerCols ?? 0) ? "th" : "td";
        const props = Array.isArray(cell) ? {} : cell.props;
        return <Cell key={c} colSpan={props.colspan} rowSpan={props.rowspan} style={{ textAlign: props.textAlignment, backgroundColor: color(props.backgroundColor), color: color(props.textColor) }}><Inline content={Array.isArray(cell) ? cell : cell.content} /></Cell>;
      })}</tr>)}</tbody></table></div> : null;
    }
  }
}
export function CourseBlocks({ blocks, pageSlug }: { blocks: readonly CourseBlock[]; pageSlug?: string }) {
  const groups: CourseBlock[][] = [];
  for (const block of blocks) {
    const last = groups.at(-1);
    if ((block.type === "bulletListItem" || block.type === "numberedListItem") && last?.[0].type === block.type) last.push(block);
    else groups.push([block]);
  }
  function render(block: CourseBlock, list = false) {
    const Element = list ? "li" : "div";
    const style: CSSProperties = { textAlign: block.props.textAlignment, color: color(block.props.textColor), backgroundColor: color(block.props.backgroundColor) };
    return <Element key={block.id} className={styles.block}>
      <div style={style}><BlockContent block={block} pageSlug={pageSlug} /></div>
      {block.children.length > 0 && block.type !== "toggleListItem" && <div className={styles.children}><CourseBlocks blocks={block.children} pageSlug={pageSlug} /></div>}
    </Element>;
  }
  return <div className={styles.document}>{groups.map(group => group[0].type === "numberedListItem" ? <ol key={group[0].id} start={group[0].props.start}>{group.map(block => render(block, true))}</ol> : group[0].type === "bulletListItem" ? <ul key={group[0].id}>{group.map(block => render(block, true))}</ul> : render(group[0]))}</div>;
}
