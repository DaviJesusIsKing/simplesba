"use client";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1800;
      let { width, height } = img;
      if (width > max || height > max) {
        const ratio = Math.min(max / width, max / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("read"));
    };
    img.src = url;
  });
}

export function ImagePicker({
  label,
  value,
  onChange,
  hint = "Foto do celular. Mantém boa qualidade (até ~1800px).",
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-3 space-y-2">
      <label className="label">{label}</label>
      <label className="btn btn-secondary w-full cursor-pointer !min-h-11">
        {value ? "Trocar foto" : "Escolher foto"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              alert("Escolha uma imagem.");
              return;
            }
            try {
              const data = await compressImage(file);
              onChange(data);
            } catch {
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result || ""));
              reader.readAsDataURL(file);
            }
          }}
        />
      </label>
      <p className="text-xs text-[var(--muted-fg)]">{hint}</p>
      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt="Prévia"
            className="h-24 w-24 rounded-xl object-cover border border-[var(--border)]"
          />
          <button
            type="button"
            className="text-xs text-red-400 underline"
            onClick={() => onChange("")}
          >
            Remover foto
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted-fg)]">Nenhuma foto ainda.</p>
      )}
    </div>
  );
}
