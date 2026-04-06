const SamuraiSilhouette = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 300"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Simplified samurai silhouette — standing figure with katana */}
    <path d="
      M100 20
      C95 20 92 25 92 32
      C92 38 95 42 100 42
      C105 42 108 38 108 32
      C108 25 105 20 100 20
      Z
      M94 44
      L88 80
      L72 78
      L70 82
      L88 86
      L86 130
      L78 200
      L74 270
      L80 272
      L92 200
      L100 160
      L108 200
      L120 272
      L126 270
      L122 200
      L114 130
      L112 86
      L130 82
      L128 78
      L112 80
      L106 44
      Z
      M128 78
      L142 60
      L158 30
      L160 28
      L158 26
      L140 56
      L126 76
      Z
    " />
  </svg>
);

export default SamuraiSilhouette;
