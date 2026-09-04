export const statusLabel: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  expired: "Não confirmado a tempo",
};

export const statusColor: Record<string, string> = {
  pending: "text-amber-300",
  confirmed: "text-green-400",
  cancelled: "text-red-400",
  done: "text-sky-300",
  expired: "text-neutral-400",
};
