"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

export type InfoTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

/**
 * Mobile-style bottom tab bar. The advisor pulls up extra context only when
 * they want it: tapping a tab slides its panel up over the page, tapping again
 * (or the close control) tucks it away so the primary surface stays focused.
 */
export function InfoTabs({ tabs }: { tabs: InfoTab[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = tabs.find((tab) => tab.id === activeId) ?? null;

  return (
    <>
      {/* Keeps page content clear of the fixed bar. */}
      <div aria-hidden className="h-24" />

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px]">
          {active ? (
            <div className="caption-enter mb-2 max-h-[64vh] overflow-auto rounded-[1.6rem] border border-line/80 bg-panel/95 p-4 shadow-diffusion backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {active.label}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  aria-label="Close panel"
                  className="focus-ring pressable inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-muted transition-colors hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {active.content}
            </div>
          ) : null}

          <div className="flex items-center gap-1 rounded-[1.4rem] border border-line/80 bg-panel/85 p-1.5 shadow-diffusion backdrop-blur-xl">
            {tabs.map((tab) => {
              const isActive = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveId(isActive ? null : tab.id)}
                  aria-pressed={isActive}
                  className={`focus-ring pressable flex flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] px-2 py-2.5 text-[0.66rem] font-semibold leading-none transition-colors sm:flex-row sm:gap-2 sm:py-2 sm:text-sm ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {isActive ? <ChevronDown className="hidden h-3.5 w-3.5 sm:inline" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
