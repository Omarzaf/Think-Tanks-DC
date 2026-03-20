export function DarkMoneyBadge({ count }: { count: number }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: '#fef2f2',
      color: '#b91c1c',
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      border: '1px solid #fecaca',
    }}>
      {count} Dark Money Tanks
    </span>
  );
}
