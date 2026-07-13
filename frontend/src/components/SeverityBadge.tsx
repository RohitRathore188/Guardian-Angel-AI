interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'moderate'
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const classes = {
    critical: 'badge-critical',
    high: 'badge-high',
    moderate: 'badge-moderate',
  }

  const labels = {
    critical: '🔴 Critical',
    high: '🟠 High',
    moderate: '🟡 Moderate',
  }

  return <span className={classes[severity]}>{labels[severity]}</span>
}
