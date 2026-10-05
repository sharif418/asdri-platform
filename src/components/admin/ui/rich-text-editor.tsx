"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";

/**
 * Bangla-first WYSIWYG editor for office staff: bold, italic, headings,
 * lists, links, quotes — a strict toolbar mirroring the storage whitelist.
 * Produces HTML that src/lib/sanitize.ts accepts.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 180,
  dir = "ltr",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  dir?: "ltr" | "rtl";
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } })],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-islamic admin-editor-focus",
        style: `min-height: ${minHeight}px; outline: none;`,
        dir,
        "data-placeholder": placeholder ?? "",
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

  const tools: { icon: typeof Bold; label: string; action: () => void; active: () => boolean }[] = [
    { icon: Bold, label: "বোল্ড", action: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive("bold") },
    { icon: Italic, label: "ইটালিক", action: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive("italic") },
    { icon: Strikethrough, label: "স্ট্রাইক", action: () => editor.chain().focus().toggleStrike().run(), active: () => editor.isActive("strike") },
    { icon: Bold, label: "শিরোনাম ২", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive("heading", { level: 2 }) },
    { icon: Bold, label: "শিরোনাম ৩", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive("heading", { level: 3 }) },
    { icon: List, label: "বুলেট তালিকা", action: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive("bulletList") },
    { icon: ListOrdered, label: "নম্বর তালিকা", action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive("orderedList") },
    { icon: Quote, label: "উদ্ধৃতি", action: () => editor.chain().focus().toggleBlockquote().run(), active: () => editor.isActive("blockquote") },
  ];

  return (
    <div className="overflow-hidden rounded-lg border bg-card focus-within:border-primary/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-secondary/40 px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={tool.action}
            aria-label={tool.label}
            title={tool.label}
            className={`rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
              tool.active() ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <tool.icon aria-hidden className="h-4 w-4" />
          </button>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("লিংক URL দিন (https://…)", "https://");
            if (url && url !== "https://") {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          aria-label="লিংক"
          title="লিংক"
          className={`rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
            editor.isActive("link") ? "bg-primary/10 text-primary" : ""
          }`}
        >
          <span className="text-xs font-bold">🔗</span>
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          aria-label="আনডু"
          className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Undo2 aria-hidden className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          aria-label="রিডু"
          className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Redo2 aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}
