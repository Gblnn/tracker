import Back from "@/components/back";

export default function PageNotFound() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100svh",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1rem",
        gap: "1rem",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, margin: "2rem" }}>
        <Back />
      </div>

      <div
        style={{
          borderRight: "1px solid rgba(100 100 100/ 60%)",
          padding: "0.5rem",
          paddingRight: "1rem",
        }}
      >
        <p style={{ fontSize: "1.5rem", fontWeight: "600" }}>404</p>
      </div>
      <p style={{ fontSize: "0.8rem" }}>This page could not be found</p>
    </div>
  );
}
