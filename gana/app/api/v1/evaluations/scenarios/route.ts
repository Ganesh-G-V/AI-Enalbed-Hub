import { NextResponse } from "next/server";
import { evaluationsService } from "@/server/services/evaluations.service";

export const GET = async () => {
  const scenarios = await evaluationsService.listScenarios();
  return NextResponse.json(scenarios);
};
