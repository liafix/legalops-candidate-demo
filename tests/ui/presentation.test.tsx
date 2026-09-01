// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LogExplorer } from "@/components/diagnostics/LogExplorer";
import { IncidentSectionNav } from "@/components/incidents/IncidentSectionNav";

afterEach(cleanup);

const logs = [
  {
    id: "1",
    timestamp: "2026-09-01T07:21:43.000Z",
    severity: "INFO" as const,
    requestId: "req_83fc",
    message: "Synchronization requested",
  },
  {
    id: "2",
    timestamp: "2026-09-01T07:21:45.000Z",
    severity: "ERROR" as const,
    requestId: "req_83fc",
    message: "UPSTREAM_TIMEOUT",
  },
  {
    id: "3",
    timestamp: "2026-09-01T07:31:45.000Z",
    severity: "INFO" as const,
    requestId: "req_retry_123",
    message: "Synchronization completed",
  },
];

describe("LogExplorer interaction", () => {
  it("filters logs by severity", () => {
    render(<LogExplorer logs={logs} />);
    fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "ERROR" } });

    expect(screen.getByText("UPSTREAM_TIMEOUT")).toBeInTheDocument();
    expect(screen.queryByText("Synchronization completed")).not.toBeInTheDocument();
  });

  it("filters logs by request correlation ID", () => {
    render(<LogExplorer logs={logs} />);
    fireEvent.change(screen.getByLabelText("Request ID"), { target: { value: "retry_123" } });

    expect(screen.getByText("Synchronization completed")).toBeInTheDocument();
    expect(screen.queryByText("UPSTREAM_TIMEOUT")).not.toBeInTheDocument();
  });

  it("shows an empty state when filters match nothing", () => {
    render(<LogExplorer logs={logs} />);
    fireEvent.change(screen.getByLabelText("Request ID"), { target: { value: "missing" } });

    expect(screen.getByText(/No logs match/)).toBeInTheDocument();
  });
});

describe("incident presentation navigation", () => {
  it("exposes a compact walkthrough across the full troubleshooting flow", () => {
    render(<IncidentSectionNav />);

    expect(screen.getByRole("link", { name: "Context" })).toHaveAttribute("href", "#context");
    expect(screen.getByRole("link", { name: "Diagnostics" })).toHaveAttribute(
      "href",
      "#diagnostics",
    );
    expect(screen.getByRole("link", { name: "QA" })).toHaveAttribute("href", "#qa");
    expect(screen.getByRole("link", { name: "Resolution" })).toHaveAttribute(
      "href",
      "#resolution",
    );
  });
});

