"use client";

import { Extension } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import clsx from "clsx";

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`
              };
            }
          }
        }
      }
    ];
  }
});

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const fontSizes = [
  { label: "Normal", value: "16px" },
  { label: "Grande", value: "20px" },
  { label: "Titular", value: "28px" }
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false
      }),
      TextStyle,
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank"
        }
      })
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-64 border border-border px-4 py-4 text-base leading-7 outline-none focus:border-black"
      }
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-64 animate-pulse border border-border bg-black/[0.03]" />
    );
  }

  const activeFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "16px";

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  const toolbarButton =
    "min-h-9 min-w-9 border border-border px-2 text-sm transition hover:border-black hover:bg-black hover:text-white";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          value={activeFontSize}
          onChange={(event) =>
            editor.chain().focus().setMark("textStyle", { fontSize: event.target.value }).run()
          }
          className="h-9 border border-border bg-white px-2 text-sm outline-none transition focus:border-black"
          aria-label="Tamaño de fuente"
        >
          {fontSizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive("bold")}
          className={clsx(toolbarButton, editor.isActive("bold") && "border-black bg-black text-white")}
          title="Negrita"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive("italic")}
          className={clsx(toolbarButton, "italic", editor.isActive("italic") && "border-black bg-black text-white")}
          title="Itálica"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-pressed={editor.isActive("bulletList")}
          className={clsx(toolbarButton, editor.isActive("bulletList") && "border-black bg-black text-white")}
          title="Lista"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-pressed={editor.isActive("orderedList")}
          className={clsx(toolbarButton, editor.isActive("orderedList") && "border-black bg-black text-white")}
          title="Lista numerada"
        >
          1.
        </button>
        <button
          type="button"
          onClick={setLink}
          aria-pressed={editor.isActive("link")}
          className={clsx(toolbarButton, editor.isActive("link") && "border-black bg-black text-white")}
          title="Enlace"
        >
          ↗
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
