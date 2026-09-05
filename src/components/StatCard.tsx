import { Card } from './Card';

export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'amber' | 'forest' | 'rust';
}) {
  const toneClass = {
    default: 'text-ink',
    amber: 'text-amber',
    forest: 'text-forest',
    rust: 'text-rust',
  }[tone];

  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-ink/40 font-semibold mb-1">{label}</div>
      <div className={`text-2xl font-display font-semibold ${toneClass}`}>{value}</div>
    </Card>
  );
}