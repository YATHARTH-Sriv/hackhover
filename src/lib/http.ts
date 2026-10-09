import { ZodError } from "zod";
import { IntegrationError } from "./integrations";

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json({ error: error.issues[0]?.message ?? "Check the submitted fields." }, { status: 400 });
  }
  if (error instanceof IntegrationError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error(error);
  return Response.json({ error: "An unexpected error occurred. Please retry." }, { status: 500 });
}
