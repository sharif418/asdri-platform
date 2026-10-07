"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/**
 * Bangla-first WYSIWYG editor for office staff: bold, italic, headings,
 * lists, links, quotes — a strict toolbar mirroring the storage whitelist.
 * Produces HTML that src/lib/sanitize.ts accepts.
 *
 * a11y: the contenteditable is named via the required `label` prop
 * (aria-label), the placeholder is rendered by the Tiptap Placeholder
 * extension + CSS in globals.css (`.admin-editor-focus …`), and every
 * toolbar control is a ≥44px target (round 4 M3/M12).
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  minHeight = 180,
  dir = "ltr",
}: {
  value: string;
  onChange: (html: string) => void;
  /** Accessible name for the editor body, e.g. "বিস্তারিত বিজ্ঞপ্তি" (M3). */
  label: string;
  placeholder?: string;
  minHeight?: number;
  dir?: "ltr" | "rtl";
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value || "",
    immediatelyRender: false,
    // v3 defaults to no re-render on transaction — the toolbar's active
    // states and the link popover's "খুলুন" affordance need it.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "prose-islamic admin-editor-focus",
        style: `min-height: ${minHeight}px; outline: none;`,
        dir,
        "aria-label": label,
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div
        className="rounded-lg border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
        style={{ minHeight }}
      >
        এডিটর লোড হচ্ছে…
      </div>
    );
  }

  const toolButtonClass = (active: boolean) =>
    `inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
      active ? "bg-primary/10 text-primary" : ""
    }`;

  const tools: { icon: typeof Bold; label: string; action: () => void; active: () => boolean }[] = [
    { icon: Bold, label: "বোল্ড", action: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive("bold") },
    { icon: Italic, label: "ইটালিক", action: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive("italic") },
    { icon: Strikethrough, label: "স্ট্রাইক", action: () => editor.chain().focus().toggleStrike().run(), active: () => editor.isActive("strike") },
    { icon: Heading2, label: "শিরোনাম ২", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive("heading", { level: 2 }) },
    { icon: Heading3, label: "শিরোনাম ৩", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive("heading", { level: 3 }) },
    { icon: List, label: "বুলেট তালিকা", action: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive("bulletList") },
    { icon: ListOrdered, label: "নম্বর তালিকা", action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive("orderedList") },
    { icon: Quote, label: "উদ্ধৃতি", action: () => editor.chain().focus().toggleBlockquote().run(), active: () => editor.isActive("blockquote") },
  ];

  /** Apply the URL from the popover input (M2 — replaces window.prompt). */
  const applyLink = () => {
    const raw = linkUrl.trim();
    if (!raw) {
      editor.chain().focus().unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const href = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    editor.chain().focus().setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card focus-within:border-primary/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-secondary/40 px-2 py-1">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={tool.action}
            aria-label={tool.label}
            aria-pressed={tool.active()}
            title={tool.label}
            className={toolButtonClass(tool.active())}
          >
            <tool.icon aria-hidden className="h-4 w-4" />
          </button>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open);
            if (open) setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="লিংক"
              title="লিংক"
              aria-expanded={linkOpen}
              className={toolButtonClass(editor.isActive("link"))}
            >
              <Link2 aria-hidden className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyLink();
              }}
            >
              <label htmlFor="rte-link-url" className="text-xs font-semibold">
                লিংক URL
              </label>
              <input
                id="rte-link-url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://…"
                dir="ltr"
                autoFocus
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <div className="mt-2.5 flex justify-end gap-2">
                {editor.isActive("link") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkOpen(false);
                    }}
                  >
                    লিংক খুলুন
                  </Button>
                )}
                <Button type="submit" size="sm">
                  প্রয়োগ
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          aria-label="আনডু"
          title="আনডু"
          className={toolButtonClass(false)}
        >
          <Undo2 aria-hidden className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          aria-label="রিডু"
          title="রিডু"
          className={toolButtonClass(false)}
        >
          <Redo2 aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}
