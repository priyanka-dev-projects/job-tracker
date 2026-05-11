import React from "react";
import { ClipLoader } from "react-spinners";

export default function Loader({
  text = "Loading...",
  height = "70vh",
}) {
  return (
    <div
      style={{
        minHeight: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <ClipLoader
        size={42}
        color="#6366f1"
        speedMultiplier={0.9}
      />

      <div
        style={{
          fontSize: 14,
          color: "#64748b",
          fontWeight: 500,
        }}
      >
        {text}
      </div>
    </div>
  );
}