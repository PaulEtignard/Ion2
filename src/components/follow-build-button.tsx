"use client";

import { useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { followBuild } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function FollowBuildButton({ playerId, buildId, following }: { playerId: string; buildId: string; following: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={following ? "secondary" : "default"}
      disabled={pending}
      onClick={() => start(() => followBuild(playerId, following ? null : buildId))}
    >
      {following ? <Check /> : <Plus />}
      {following ? "Build suivi" : "Suivre ce build"}
    </Button>
  );
}
