import { redirect } from "next/navigation";

/** Business Management opens on its first section */
export default function BusinessPage() {
  redirect("/app/business/sales");
}
