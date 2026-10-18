'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  EmrCheckbox, EmrDateInput, EmrDateTimeInput, EmrNumberInput, EmrPairedInput, EmrQuantityInput,
  EmrRadioGroup, EmrTextInput, EmrTimeInput, EmrToggle,
} from '../../src';
import type { GallerySection } from './types';

const sexOptions = [{ value: 'f', label: 'Female' }, { value: 'm', label: 'Male' }, { value: 'o', label: 'Other' }];
const units = [{ value: 'mmHg', label: 'mmHg' }, { value: 'kPa', label: 'kPa' }];

function TextDemo() {
  const [a, setA] = useState<string | null>('Synthetic note');
  const [b, setB] = useState<string | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <EmrTextInput label="Chief complaint" hint="Free text" value={a} onValueChange={setA} />
      <EmrTextInput label="Required, read-only" required readOnly value="Fixed value" onValueChange={() => {}} />
      <EmrTextInput label="Disabled" disabled value="Locked" onValueChange={() => {}} />
      <EmrTextInput label="With error" required error="This field is required." value={b} onValueChange={setB} />
      <EmrTextInput label="With warning" warning="Unusually long entry." value={b} onValueChange={setB} />
    </View>
  );
}

function NumberDemo() {
  const [n, setN] = useState<number | null>(7);
  const [i, setI] = useState<number | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <EmrNumberInput label="Decimal" min={0} max={20} hint="Try -1.5 and 7." value={n} onValueChange={setN} />
      <EmrNumberInput label="Integer" mode="integer" value={i} onValueChange={setI} />
      <EmrNumberInput label="Read-only" readOnly value={12.5} onValueChange={() => {}} />
      <EmrNumberInput label="Error" error="Out of range." value={99} onValueChange={() => {}} />
    </View>
  );
}

function DateDemo() {
  const [d, setD] = useState<string | null>('2026-03-05');
  const [y, setY] = useState<string | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <EmrDateInput label="Date of visit (dd-mm-yyyy)" hint="Accepts - / . or space. 31-02-2026 is not emitted." value={d} onValueChange={setD} />
      <EmrDateInput label="Year first" displayFormat="yyyy-mm-dd" value={y} onValueChange={setY} />
      <EmrDateInput label="Read-only" readOnly value="2026-12-31" onValueChange={() => {}} />
      <EmrDateInput label="Error" error="Date is in the future." value="2030-01-01" onValueChange={() => {}} />
      <EmrDateInput label="Warning" warning="More than 5 years ago." value="2019-01-01" onValueChange={() => {}} />
    </View>
  );
}

function TimeDemo() {
  const [t, setT] = useState<string | null>('08:30');
  return (
    <View style={{ gap: 12 }}>
      <EmrTimeInput label="Time of onset" hint="HH:mm" value={t} onValueChange={setT} />
      <EmrTimeInput label="Read-only" readOnly value="23:59" onValueChange={() => {}} />
      <EmrTimeInput label="Error" error="Not a valid time." value={null} onValueChange={() => {}} />
    </View>
  );
}

function DateTimeDemo() {
  const [v, setV] = useState<string | null>('2026-03-05T08:30');
  return (
    <View style={{ gap: 12 }}>
      <EmrDateTimeInput label="Recorded at" hint={`Value: ${v ?? 'none'}`} value={v} onValueChange={setV} />
      <EmrDateTimeInput label="Read-only" readOnly value="2026-12-31T23:59" onValueChange={() => {}} />
      <EmrDateTimeInput label="Error" error="Both date and time are needed." value={null} onValueChange={() => {}} />
    </View>
  );
}

function QuantityDemo() {
  const [n, setN] = useState<number | null>(16);
  const [u, setU] = useState<string | null>('mmHg');
  return (
    <View style={{ gap: 12 }}>
      <EmrQuantityInput label="IOP" units={units} value={n} unit={u} onValueChange={setN} onUnitChange={setU} />
      <EmrQuantityInput label="Read-only" readOnly units={units} value={21} unit="kPa" onValueChange={() => {}} onUnitChange={() => {}} />
      <EmrQuantityInput label="Error" error="Above range." units={units} value={80} unit="mmHg" onValueChange={() => {}} onUnitChange={() => {}} />
    </View>
  );
}

function PairedDemo() {
  const [od, setOd] = useState<string | null>('6/6');
  const [os, setOs] = useState<string | null>('6/9');
  return (
    <View style={{ gap: 12 }}>
      <EmrPairedInput label="Visual acuity" firstLabel="OD" secondLabel="OS" firstValue={od} secondValue={os}
        onFirstValueChange={setOd} onSecondValueChange={setOs} />
      <EmrPairedInput label="Read-only, custom separator" separator="|" readOnly firstLabel="OD" secondLabel="OS"
        firstValue="14" secondValue="16" onFirstValueChange={() => {}} onSecondValueChange={() => {}} />
      <EmrPairedInput label="Error" error="Enter both eyes." firstLabel="OD" secondLabel="OS" firstValue="6/6" secondValue={null}
        onFirstValueChange={() => {}} onSecondValueChange={() => {}} />
    </View>
  );
}

function CheckboxDemo() {
  const [a, setA] = useState<boolean | null>(true);
  const [b, setB] = useState<boolean | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <EmrCheckbox label="Patient consents" value={a} onValueChange={setA} />
      <EmrCheckbox label="Required, unchecked" required hint="Tick to continue." value={b} onValueChange={setB} />
      <EmrCheckbox label="Read-only checked" readOnly value onValueChange={() => {}} />
      <EmrCheckbox label="Disabled" disabled value={false} onValueChange={() => {}} />
      <EmrCheckbox label="With error" error="Consent is required." value={false} onValueChange={() => {}} />
    </View>
  );
}

function ToggleDemo() {
  const [a, setA] = useState<boolean | null>(true);
  const [b, setB] = useState<boolean | null>(false);
  return (
    <View style={{ gap: 8 }}>
      <EmrToggle label="Dilated" value={a} onValueChange={setA} />
      <EmrToggle label="Contact lens worn" hint="Off by default." value={b} onValueChange={setB} />
      <EmrToggle label="Read-only on" readOnly value onValueChange={() => {}} />
      <EmrToggle label="Disabled" disabled value={false} onValueChange={() => {}} />
      <EmrToggle label="With warning" warning="Confirm with patient." value onValueChange={() => {}} />
    </View>
  );
}

function RadioDemo() {
  const [v, setV] = useState<string | null>('f');
  return (
    <View style={{ gap: 12 }}>
      <EmrRadioGroup label="Sex" options={sexOptions} value={v} onValueChange={setV} />
      <EmrRadioGroup label="Read-only" readOnly options={sexOptions} value="m" onValueChange={() => {}} />
      <EmrRadioGroup label="Error" required error="Choose one." options={sexOptions} value={null} onValueChange={() => {}} />
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'text-input', title: 'EmrTextInput', render: TextDemo },
  { id: 'number-input', title: 'EmrNumberInput', render: NumberDemo },
  { id: 'date-input', title: 'EmrDateInput', render: DateDemo },
  { id: 'time-input', title: 'EmrTimeInput', render: TimeDemo },
  { id: 'datetime-input', title: 'EmrDateTimeInput', render: DateTimeDemo },
  { id: 'quantity-input', title: 'EmrQuantityInput', render: QuantityDemo },
  { id: 'paired-input', title: 'EmrPairedInput', render: PairedDemo },
  { id: 'checkbox', title: 'EmrCheckbox', render: CheckboxDemo },
  { id: 'toggle', title: 'EmrToggle', render: ToggleDemo },
  { id: 'radio-group', title: 'EmrRadioGroup', render: RadioDemo },
];
