'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type { NavItem } from '@drguptavivek/emr-controller';
import { EmrAppShell, type EmrAppShellIntent, type EmrSearchGroup } from '../../src/l4-web-shell';
import type { GallerySection } from './types';

const NAV: NavItem[] = [
  { id: 'patients', label: 'Patients' },
  { id: 'worklists', label: 'Worklists', badge: { label: '12', tone: 'info', assistiveText: '12 open' }, children: [
    { id: 'referred', label: 'Referred not arrived', badge: { label: '7', tone: 'warning', assistiveText: '7 overdue' } },
    { id: 'booked', label: 'Booked not delivered' },
  ] },
  { id: 'dq', label: 'Data quality' },
  { id: 'forms', label: 'Forms admin' },
  { id: 'users', label: 'Users' },
];

const RESULTS: EmrSearchGroup[] = [
  { id: 'patients', label: 'Patients', results: [
    { id: 'p1', label: 'Asha Verma', sub: 'MRN 000123 · 54 F' },
    { id: 'p2', label: 'Ashok Verma', sub: 'MRN 000456 · 61 M' },
  ] },
  { id: 'barcodes', label: 'Barcodes', results: [{ id: 'b1', label: 'SPC-0007741', sub: 'Serum, collected', badge: { label: 'Received', tone: 'success' } }] },
  { id: 'historical', label: 'Historical', results: [{ id: 'h1', label: 'Asha Verma (merged)', sub: 'Archived 2021', badge: { label: 'Archived', tone: 'neutral' } }] },
];

function Demo() {
  const [activeId, setActiveId] = useState('patients');
  const [expanded, setExpanded] = useState<string[]>(['worklists']);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('Nothing selected yet.');
  const groups = query.trim() ? RESULTS : [];

  const onIntent = (i: EmrAppShellIntent) => {
    switch (i.type) {
      case 'itemSelected': setActiveId(i.itemId); setNavOpen(false); break;
      case 'itemExpansionRequested': setExpanded(e => (i.expanded ? [...e, i.itemId] : e.filter(x => x !== i.itemId))); break;
      case 'navToggleRequested': setNavOpen(o => !o); break;
      case 'queryChanged': setQuery(i.query); setOpen(true); break;
      case 'searchOpenRequested': setOpen(true); break;
      case 'searchCloseRequested': setOpen(false); break;
      case 'resultSelected': setLast(`Selected ${i.groupId}/${i.id}`); setOpen(false); break;
      case 'menuRequested': setLast('User menu requested'); break;
    }
  };

  return (
    <View style={{ height: 560, borderWidth: 1, borderColor: '#c7d3da' }}>
      <EmrAppShell onIntent={onIntent} model={{
        navOpen,
        nav: { items: NAV, activeId, expandedIds: expanded },
        topBar: { title: 'Data manager', userLabel: 'Dr Rao', search: { query, open, groups } },
      }}>
        <Text role="heading">{NAV.flatMap(n => [n, ...(n.children ?? [])]).find(n => n.id === activeId)?.label}</Text>
        <Text>Placeholder content. {last}</Text>
      </EmrAppShell>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'l4-web-shell', title: 'L4 web app shell (nav, search, top bar)', render: () => <Demo /> },
];
