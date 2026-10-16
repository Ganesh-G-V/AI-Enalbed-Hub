import { db } from "@/server/db/client";
import { FeedbackRating } from "@prisma/client";
import { z } from "zod";

const FeedbackSchema = z.object({
  userId: z.string().min(1),
  targetType: z.enum(["prompt", "knowledge", "assistant", "evaluation"]),
  targetId: z.string().min(1),
  rating: z.nativeEnum(FeedbackRating),
  comment: z.string().optional(),
});

export class FeedbackService {
  async submit(data: z.infer<typeof FeedbackSchema>) {
    const parsed = FeedbackSchema.parse(data);
    // Never retain sensitive prompt content in feedback analytics.
    return db.feedback.create({
      data: {
        userId: parsed.userId,
        targetType: parsed.targetType,
        targetId: parsed.targetId,
        rating: parsed.rating,
        comment: parsed.comment ?? null,
      },
    });
  }

  async distribution(targetType: string, targetId: string) {
    return db.feedback.groupBy({
      by: ["rating"],
      where: { targetType, targetId },
      _count: { id: true },
    });
  }
}

export const feedbackService = new FeedbackService();
