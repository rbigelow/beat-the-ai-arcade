// Rule-based phishing signal detector (transparent, not machine learning).
export const SIGNAL_RULES = [
  { id: 'urgency', label: 'Urgency', weight: 25, test: (t) => /(urgent|immediately|act now|expires|within \d+ hour|in \d+ hour|suspended|locked|today!)/i.test(t) },
  { id: 'credentials', label: 'Credential request', weight: 35, test: (t) => /(password|login details|bank account|verify your|student number)/i.test(t) },
  { id: 'url', label: 'Suspicious URL', weight: 20, test: (t) => /https?:\/\/[^\s]*(verify|login|claim|check|free)[^\s]*/i.test(t) },
  { id: 'reward', label: 'Too-good-to-be-true offer', weight: 15, test: (t) => /(you won|congratulations|free|gift card|\$\d+)/i.test(t) },
  { id: 'punctuation', label: 'Excess exclamation marks', weight: 5, test: (t) => /!!+/.test(t) },
]
export const RISK_THRESHOLD = 40

export function analyzeMessage(message) {
  const text = `${message.subject}\n${message.body}`
  const signals = SIGNAL_RULES.filter((rule) => rule.test(text))
  const riskScore = Math.min(100, signals.reduce((sum, rule) => sum + rule.weight, 0))
  return { signals, riskScore, classification: riskScore >= RISK_THRESHOLD ? 'phishing' : 'legitimate' }
}
