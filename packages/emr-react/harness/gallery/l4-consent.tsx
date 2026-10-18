'use client';

import { useState } from 'react';
import { View } from 'react-native';
import { EmrConsentCapture, EmrConsentStatusBadge, type EmrConsentCaptureModel, type EmrConsentIntent, type EmrConsentMethod, type EmrConsentCategory, type EmrConsentPurpose } from '../../src';
import type { GallerySection } from './types';

// Synthetic placeholder text only; not legal wording.
const NOTICE = {
  en: { label: 'English', title: 'Placeholder consent notice', sections: [
    { heading: 'Why we ask', body: 'Placeholder text. This paragraph stands in for the real notice supplied by the app.' },
    { heading: 'What we keep', body: 'Placeholder text. Replace with approved wording before any real use.' },
    { heading: 'Your choices', body: 'Placeholder text. You may change your choices later.' },
  ] },
  hi: { label: 'हिन्दी', title: 'नमूना सहमति सूचना', sections: [
    { heading: 'हम क्यों पूछते हैं', body: 'नमूना पाठ। यह अनुच्छेद ऐप द्वारा दी जाने वाली वास्तविक सूचना की जगह है।' },
    { heading: 'हम क्या रखते हैं', body: 'नमूना पाठ। वास्तविक उपयोग से पहले स्वीकृत शब्द रखें।' },
    { heading: 'आपके विकल्प', body: 'नमूना पाठ। आप बाद में विकल्प बदल सकते हैं।' },
  ] },
} as const;

const PURPOSES: EmrConsentPurpose[] = [
  { id: 'care', label: 'Eye care records', description: 'Placeholder: keep records needed for treatment.', essential: true },
  { id: 'followup', label: 'Follow-up contact', description: 'Placeholder: contact for follow-up visits.', essential: false },
  { id: 'research', label: 'Research use', description: 'Placeholder: use de-identified data in research.', essential: false },
  { id: 'camp', label: 'Screening camp sharing', description: 'Placeholder: share results with the camp team.', essential: false },
  { id: 'reminder', label: 'Reminders', description: 'Placeholder: send appointment reminders.', essential: false },
  { id: 'registry', label: 'Registry entry', description: 'Placeholder: recorded earlier, read-only here.', essential: false, decision: 'granted', locked: true },
];

type Scenario = 'adult' | 'minor' | 'verbal';

function Demo({ scenario }: { scenario: Scenario }) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [decisions, setDecisions] = useState<Record<string, 'granted' | 'refused'>>({});
  const [givenBy, setGivenBy] = useState<string | undefined>(scenario === 'minor' ? 'guardian' : scenario === 'adult' ? 'self' : undefined);
  const [guardian, setGuardian] = useState({ name: '', relationship: '' });
  const [method, setMethod] = useState<EmrConsentMethod | undefined>(scenario === 'verbal' ? 'verbal_attested' : scenario === 'adult' ? 'tap' : undefined);
  const [signed, setSigned] = useState<string>();
  const [attested, setAttested] = useState(false);
  const [done, setDone] = useState('');
  const [tried, setTried] = useState(false);

  // Categories are user-defined in VCMS; this demo groups the synthetic purposes into one of each kind.
  const byId = Object.fromEntries(PURPOSES.map(p => [p.id, p]));
  const pick = (ids: string[]) => ids.map(id => {
    const p = byId[id]!;
    return p.locked || p.essential ? p : { ...p, decision: decisions[p.id] };
  });
  const categories: EmrConsentCategory[] = [
    { id: 'care', label: 'Care', mode: 'whole', purposes: pick(['care']) },
    { id: 'contact', label: 'Contact', description: 'Placeholder: choose each kind of contact.', mode: 'per_purpose', purposes: pick(['followup', 'reminder', 'registry']) },
    { id: 'data', label: 'Data use', description: 'Placeholder: one choice covers both.', mode: 'whole', decision: decisions['cat:data'], purposes: pick(['research', 'camp']) },
  ];
  // The demo plays controller: a whole-mode category needs its own decision; per-purpose needs each one.
  const decided = categories.every(c => c.purposes.every(p => p.essential)
    || (c.mode === 'whole' ? !!c.decision : c.purposes.every(p => p.essential || p.decision)));
  const needsGuardian = scenario === 'minor';
  const guardianOk = !needsGuardian || (!!guardian.name.trim() && !!guardian.relationship.trim());
  const methodOk = method === 'tap' || (method === 'signature' && !!signed) || (method === 'thumbprint' && !!signed) || (method === 'verbal_attested' && attested);
  // The demo plays controller: canSubmit is its call, not the component's.
  const canSubmit = decided && !!givenBy && guardianOk && methodOk;

  const n = NOTICE[lang];
  const model: EmrConsentCaptureModel = {
    notice: { title: n.title, sections: [...n.sections], version: 'DEMO-1', languageLabel: n.label },
    languageOptions: [{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }],
    selectedLanguage: lang,
    categories,
    givenByOptions: scenario === 'adult' ? [{ id: 'self', label: 'Patient' }] : [{ id: 'self', label: 'Patient' }, { id: 'guardian', label: 'Guardian' }],
    selectedGivenBy: givenBy,
    guardian: needsGuardian ? {
      ...guardian, required: true,
      nameError: tried && !guardian.name.trim() ? 'Guardian name is required' : undefined,
      relationshipError: tried && !guardian.relationship.trim() ? 'Relationship is required' : undefined,
    } : undefined,
    methodOptions: scenario === 'verbal'
      ? [{ id: 'verbal_attested', label: 'Verbal, witnessed' }]
      : [{ id: 'tap', label: 'Tap to agree' }, { id: 'signature', label: 'Signature' }, { id: 'thumbprint', label: 'Thumbprint' }],
    selectedMethod: method,
    capture: signed ? { signatureLabel: `Signature captured ${signed}`, thumbprintLabel: `Thumbprint captured ${signed}` } : undefined,
    attestation: scenario === 'verbal' ? {
      id: 'verbal', title: 'Witness', statement: 'Placeholder: witness confirms consent was given verbally.',
      signatories: [{ id: 'w1', displayName: 'Test Witness', roleLabel: 'Staff', status: attested ? { label: 'Signed', tone: 'success' } : { label: 'Pending', tone: 'warning' }, signedAtLabel: attested ? '10:42' : undefined }],
      canSign: !attested, signLabel: 'Confirm witnessed',
    } : undefined,
    canSubmit,
    submitError: !canSubmit && tried ? 'Complete every choice before submitting' : undefined,
  };

  const onIntent = (i: EmrConsentIntent) => {
    switch (i.type) {
      case 'languageSelected': setLang(i.id as 'en' | 'hi'); break;
      case 'purposeDecided': setDecisions(d => ({ ...d, [i.id]: i.decision })); break;
      case 'categoryDecided': setDecisions(d => ({ ...d, [`cat:${i.id}`]: i.decision })); break;
      case 'givenBySelected': setGivenBy(i.id); break;
      case 'guardianChanged': setGuardian(g => ({ ...g, ...(i.name !== undefined && { name: i.name }), ...(i.relationship !== undefined && { relationship: i.relationship }) })); break;
      case 'methodSelected': setMethod(i.id); break;
      case 'signatureRequested': case 'thumbprintRequested': setSigned('10:42'); break;
      case 'attestationConfirmed': setAttested(true); break;
      case 'submitRequested': setDone('Submitted (demo)'); break;
      case 'cancelled': setDone('Cancelled (demo)'); setTried(false); break;
    }
    if (i.type !== 'submitRequested' && i.type !== 'cancelled') setDone('');
  };
  // A not-yet-submittable form shows its error after the first interaction attempt.
  const intentWithTry = (i: EmrConsentIntent) => { if (i.type === 'purposeDecided' || i.type === 'categoryDecided' || i.type === 'methodSelected') setTried(true); onIntent(i); };

  return (
    <View style={{ gap: 8 }}>
      <EmrConsentCapture model={model} onIntent={intentWithTry} />
      {done ? <EmrConsentStatusBadge badge={{ label: done, tone: 'info' }} /> : null}
    </View>
  );
}

const Badges = () => (
  <View style={{ gap: 8 }}>
    <EmrConsentStatusBadge badge={{ label: 'Granted', tone: 'success' }} detail="All purposes" />
    <EmrConsentStatusBadge badge={{ label: 'Partial', tone: 'warning' }} detail="2 of 5 purposes" onIntent={() => undefined} />
    <EmrConsentStatusBadge badge={{ label: 'Pending', tone: 'neutral' }} detail="Not yet captured" onIntent={() => undefined} />
    <EmrConsentStatusBadge badge={{ label: 'Withdrawn', tone: 'danger' }} detail="Withdrawn 10-10-2026" />
  </View>
);

export const gallery: GallerySection[] = [
  { id: 'consent-adult', title: 'Consent: adult, self, tap', render: () => <Demo scenario="adult" /> },
  { id: 'consent-minor', title: 'Consent: minor with guardian', render: () => <Demo scenario="minor" /> },
  { id: 'consent-verbal', title: 'Consent: verbal, attested', render: () => <Demo scenario="verbal" /> },
  { id: 'consent-badge', title: 'Consent status badge', render: () => <Badges /> },
];
