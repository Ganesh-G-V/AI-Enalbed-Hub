"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/shared/Badge";
import { CopyButton } from "@/components/shared/CopyButton";
import { Type, Clock } from "lucide-react";

interface PromptCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  role: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  onCopy?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

export function PromptCard({
  id,
  title,
  category,
  description,
  role,
  difficulty,
  tags,
  onCopy,
  onFavorite,
  isFavorite = false,
  className,
}: PromptCardProps) {
  return (
    <Card className={["overflow-hidden hover:border-primary/50 transition-colors", className].join(" ")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {onCopy && <CopyButton value={`prompt:${id}`} size="sm" label="Copy prompt" />}
        </div>
        <CardDescription className="text-[0.8rem]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[0.7rem] px-2 py-1">{category}</Badge>
          <Badge variant="outline" className="text-[0.7rem] px-2 py-1">{difficulty}</Badge>
          <Badge variant="secondary" className="text-[0.7rem] px-2 py-1">{role}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[0.7rem] px-2 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
          <Type className="size-3.5" /> {tags.length} tags
        </div>
        <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
          <Clock className="size-3.5" /> 5 min read
        </div>
      </CardFooter>
    </Card>
  );
}
