interface PirateMoneyIconArtworkProps {
  compact?: boolean;
}

export function PirateMoneyIconArtwork({
  compact = false,
}: PirateMoneyIconArtworkProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #082f49 0%, #0e7490 58%, #f59e0b 100%)",
        color: "#fff7ed",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "9%",
          border: "10px solid rgba(255, 247, 237, 0.24)",
          borderRadius: "30%",
        }}
      />
      <div
        style={{
          width: "64%",
          height: "64%",
          borderRadius: "9999px",
          background: "linear-gradient(145deg, #fde68a 0%, #f59e0b 100%)",
          border: "10px solid #78350f",
          boxShadow: "0 28px 64px rgba(8, 47, 73, 0.45)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#451a03",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        <div style={{ fontSize: compact ? 58 : 156 }}>¥</div>
        <div
          style={{
            marginTop: compact ? 4 : 12,
            fontSize: compact ? 24 : 68,
            letterSpacing: 0,
          }}
        >
          PM
        </div>
      </div>
    </div>
  );
}
