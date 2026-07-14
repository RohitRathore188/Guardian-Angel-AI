// Mock data used until the backend is live
export interface Case {
  id: string
  location: { lat: number; lng: number; address: string }
  status: 'reported' | 'dispatched' | 'rescued' | 'closed'
  ai_severity: 'critical' | 'high' | 'moderate'
  ai_analysis: string
  ai_dispatch_reason: string
  created_at: string
  evidence: { file_url: string }[]
  structured_analysis?: any
}

export const mockCases: Case[] = [
  {
    id: 'case-001',
    location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi' },
    status: 'reported',
    ai_severity: 'critical',
    ai_analysis:
      'Child appears to be a newborn (0–2 months). No visible injuries but child is crying and appears severely distressed. Found unattended near railway platform 3. Immediate medical attention required.',
    ai_dispatch_reason:
      'Newborn requires urgent medical assessment. Hospital and Child Welfare authorities have been alerted.',
    created_at: new Date().toISOString(),
    evidence: [{ file_url: 'https://placehold.co/400x300/1a1a2e/e94560?text=Evidence+Photo' }],
  },
  {
    id: 'case-002',
    location: { lat: 19.0760, lng: 72.8777, address: 'Gateway of India, Mumbai' },
    status: 'dispatched',
    ai_severity: 'high',
    ai_analysis:
      'Child appears to be approximately 2–3 years old. Minor bruising visible on left arm. Child is conscious but appears unresponsive to verbal communication. Signs of possible neglect.',
    ai_dispatch_reason:
      'Signs of possible abuse or neglect detected. Police and Child Welfare alerted. Medical unit standing by.',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    evidence: [{ file_url: 'https://placehold.co/400x300/1a1a2e/f59e0b?text=Evidence+Photo' }],
  },
  {
    id: 'case-003',
    location: { lat: 22.7196, lng: 75.8577, address: 'Rajwada, Indore' },
    status: 'rescued',
    ai_severity: 'moderate',
    ai_analysis:
      'Child appears to be 4–5 years old. No visible injuries. Child is awake, crying, and appears lost rather than abandoned. Environmental conditions are safe.',
    ai_dispatch_reason:
      'Lost child scenario. Child Welfare and local police notified for reunification with family.',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    evidence: [{ file_url: 'https://placehold.co/400x300/1a1a2e/10b981?text=Evidence+Photo' }],
  },
]
