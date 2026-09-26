import { FolderSearch } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { ButtonLink } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="rounded-xl border border-line bg-surface/40">
      <EmptyState
        icon={<FolderSearch aria-hidden="true" />}
        title="This project doesn’t exist"
        description="It may have been archived, or the link is incorrect."
        action={<ButtonLink href="/app/projects">Back to projects</ButtonLink>}
      />
    </div>
  );
}
