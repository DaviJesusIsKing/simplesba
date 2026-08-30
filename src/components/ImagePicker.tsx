"use client";

export function ImagePicker({
  label,
  value,
  onChange,
  hint = "JPG ou PNG até ~800 KB",
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-sm text-[var(--muted-fg)]"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 900_000) {
            alert("Imagem grande demais. Use outra com menos de ~800 KB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result || ""));
          reader.readAsDataURL(file);
        }}
      />
      <p className="text-xs text-[var(--muted-fg)] mt-1">{hint}</p>
      {value && (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={value}
            alt=""
            className="h-20 w-20 rounded-lg object-cover border border-[var(--border)]"
          />
          <button
            type="button"
            className="text-xs text-red-400 underline"
            onClick={() => onChange("")}
          >
            Remover foto
          </button>
        </div>
      )}
    </div>
  );
}
