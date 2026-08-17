const OLIVE = "#6B7C2F";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";

/**
 * A ticket-style divider used across the account and checkout screens.
 *
 * @param {{ label?: string }} props
 */
export default function TicketBand({ label = "ADMIT ONE" }) {
  return (
    <div
      aria-label={label}
      className="relative flex min-h-10 items-center overflow-hidden border-y px-5"
      style={{
        background: OLIVE,
        borderColor: OLIVE,
        color: DARK,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
        style={{ background: DARK }}
      />
      <span
        aria-hidden="true"
        className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
        style={{ background: DARK }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-5 top-1/2 border-t border-dashed"
        style={{ borderColor: "rgba(5, 10, 10, 0.35)" }}
      />

      <div className="relative flex w-full items-center justify-between gap-4">
        <span
          className="text-[9px] font-bold tracking-[0.3em]"
          style={{ fontFamily: "Arial Black, sans-serif" }}
        >
          {label}
        </span>
        <span
          className="text-[9px] font-mono font-semibold tracking-[0.25em]"
          style={{ color: OLIVE_LIGHT }}
        >
          FD / 2026
        </span>
      </div>
    </div>
  );
}

TicketBand.defaultProps = {
  label: "ADMIT ONE",
};

TicketBand.displayName = "TicketBand";
