import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import type { FieldControlProps } from "@/shared/ui/form/FormField";

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  labelId,
  control,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly labelId: string;
  readonly control: FieldControlProps;
}) {
  const { t } = useTranslation("messaging");
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        id: control.id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        "aria-invalid": String(control["aria-invalid"]),
        "aria-describedby": control["aria-describedby"] ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur,
  });
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      list: editor.isActive("bulletList"),
    }),
  });
  useEffect(() => {
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (current !== value)
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  return (
    <div>
      <div>
        <Button
          type="button"
          aria-pressed={active.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          {t("messages.bold")}
        </Button>
        <Button
          type="button"
          aria-pressed={active.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          {t("messages.italic")}
        </Button>
        <Button
          type="button"
          aria-pressed={active.list}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          {t("messages.list")}
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
