import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Chart from "../renewal/Chart";

it("draws finite chart coordinates for flat and invalid data, resizes, and releases its observer", () => {
  const context = Object.fromEntries(["scale", "beginPath", "moveTo", "lineTo", "stroke", "closePath", "fill"].map(key => [key, vi.fn()]));
  context.createLinearGradient = () => ({ addColorStop: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  vi.spyOn(HTMLCanvasElement.prototype, "clientWidth", "get").mockReturnValue(320);
  vi.spyOn(HTMLCanvasElement.prototype, "clientHeight", "get").mockReturnValue(160);
  let resize;
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() { disconnect(); }
  });
  const { rerender, unmount } = render(<Chart points={[[1, 10], [2, NaN], [3, 10]]} label="Bitcoin history" />);
  expect(screen.getByRole("img", { name: "Bitcoin history" })).toBeTruthy();
  expect(context.stroke).toHaveBeenCalled();
  for (const args of [...context.moveTo.mock.calls, ...context.lineTo.mock.calls]) expect(args.every(Number.isFinite)).toBe(true);
  context.scale.mockClear();
  resize();
  expect(context.scale).toHaveBeenCalledTimes(1);
  rerender(<Chart points={[]} />);
  context.stroke.mockClear();
  resize();
  expect(context.stroke).not.toHaveBeenCalled();
  unmount();
  expect(disconnect).toHaveBeenCalledTimes(2);
});
