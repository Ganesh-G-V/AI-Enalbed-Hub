"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";

interface FeedbackControlProps {
  onRating: (rating: "helpful" | "not_helpful") => void;
  currentRating?: "helpful" | "not_helpful";
  className?: string;
}

export function FeedbackControl({
  onRating,
  currentRating,
  className,
}: FeedbackControlProps) {
  return (
    <div
      className={["flex items-center gap-2", className].join(" ")}
      role="group"
      aria-label="Was this helpful?"
    >
      <ShadcnButton
        onClick={() => onRating("helpful")}
        size="sm"
        variant={currentRating === "helpful" ? "default" : "outline"}
        aria-pressed={currentRating === "helpful"}
        data-testid="feedback-helpful"
      >
        <ThumbsUp className="mr-1 size-4" /> Helpful
      </ShadcnButton>
      <ShadcnButton
        onClick={() => onRating("not_helpful")}
        size="sm"
        variant={currentRating === "not_helpful" ? "destructive" : "outline"}
        aria-pressed={currentRating === "not_helpful"}
        data-testid="feedback-not-helpful"
      >
        <ThumbsDown className="mr-1 size-4" /> Not helpful
      </ShadcnButton>
      {currentRating && (
        <Badge variant="success" className="text-xs">
          {currentRating === "helpful" ? "Marked helpful" : "Marked not helpful"}
        </Badge>
      )}
    </div>
  );
}
