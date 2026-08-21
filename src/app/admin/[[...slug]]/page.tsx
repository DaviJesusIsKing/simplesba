import { redirect } from "next/navigation";

/** URL antiga /admin — removida. */
export default function OldAdminCatchAll() {
  redirect("/");
}
