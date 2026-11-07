export type AmenityIconName = 'parking' | 'wellness' | 'transfer' | 'laundry' | 'wifi' | 'coffee' | 'pool' | 'security' | 'service'

const paths: Record<AmenityIconName, string[]> = {
  parking: ['M6 22v-5l3-7h14l3 7v5M6 18h20M9 22v3M23 22v3M10 10l2-4h8l2 4M10 20h2M20 20h2', 'M27 3h7v10h-7zM30 11V5h1a2 2 0 0 1 0 4h-1'],
  wellness: ['M18 7c-4 6-9 6-9 13a9 9 0 0 0 18 0c0-7-5-7-9-13Z', 'M18 16v18M18 25l-5-5M18 29l5-5'],
  transfer: ['M6 25V15l3-7h18l3 7v10M6 18h24M9 25v5M27 25v5M10 22h3M23 22h3M14 8V4h8v4', 'M5 15H2M31 15h3'],
  laundry: ['M12 5l6 4 6-4 9 7-5 7-4-3v17H12V16l-4 3-5-7 9-7Z', 'M14 6a4 4 0 0 0 8 0'],
  wifi: ['M3 13a24 24 0 0 1 30 0M8 19a16 16 0 0 1 20 0M13 25a8 8 0 0 1 10 0', 'M18 31h.01'],
  coffee: ['M7 14h18v9a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-9ZM25 16h3a4 4 0 0 1 0 8h-3M4 34h26', 'M12 10c-4-4 4-4 0-8M20 10c-4-4 4-4 0-8'],
  pool: ['M12 26V8a4 4 0 0 1 4-4M22 26V8a4 4 0 0 1 4-4M12 12h10M12 20h10', 'M3 29q4-4 8 0t8 0 8 0 8 0M3 35q4-4 8 0t8 0 8 0 8 0'],
  security: ['M18 3l12 5v10c0 8-12 16-12 16S6 26 6 18V8l12-5Z', 'M12 18l4 4 9-10'],
  service: ['M5 27a13 13 0 0 1 26 0M3 28h30M8 33h20M18 14v-3M15 11h6', 'M7 8h.01M29 8h.01'],
}

export default function AmenityIcon({ name }: { name: AmenityIconName }) {
  return (
    <svg viewBox="0 0 38 40" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name].map((path, index) => <path key={index} d={path} />)}
    </svg>
  )
}
