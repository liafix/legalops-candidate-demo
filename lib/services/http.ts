import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/domain/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function fail(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { data: null, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    },
    { status: 500 },
  );
}
