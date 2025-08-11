import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders headline and button", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Vite \+ React \+ Tailwind \+ shadcn\/ui/i,
    );
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });
});
