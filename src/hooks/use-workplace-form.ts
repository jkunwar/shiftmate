import { useState } from 'react';

import { Workplace } from '@/types';
import {
  initialWorkplaceValues,
  setScheduleTime,
  toggleScheduleDay,
  validateWorkplaceForm,
} from '@/utils/workplaceForm';

interface WorkplaceFormOptions {
  initialWorkplace?: Workplace | null;
  /** Pre-fills the hourly rate for a new workplace (from Settings). */
  defaultHourlyRate?: number;
  onSave: (workplace: Omit<Workplace, 'id'>) => void;
  onClose: () => void;
}

/** The add/edit workplace form: its fields, the usual schedule, and validation on save. */
export function useWorkplaceForm({
  initialWorkplace,
  defaultHourlyRate,
  onSave,
  onClose,
}: WorkplaceFormOptions) {
  // Mounted fresh each time the form opens, so these start from the workplace being edited
  const [initial] = useState(() => initialWorkplaceValues(initialWorkplace, defaultHourlyRate));

  const [name, setNameValue] = useState(initial.name);
  const [address, setAddress] = useState(initial.address);
  const [hourlyRate, setHourlyRate] = useState(initial.hourlyRate);
  const [notes, setNotes] = useState(initial.notes);
  const [color, setColor] = useState(initial.color);
  const [schedule, setSchedule] = useState(initial.schedule);
  const [errorMsg, setErrorMsg] = useState('');

  // Typing a name clears a previous "name is required" message
  const setName = (text: string) => {
    setNameValue(text);
    setErrorMsg('');
  };

  const toggleDay = (index: number) => setSchedule((prev) => toggleScheduleDay(prev, index));
  const setDayTime = (index: number, field: 'startTime' | 'endTime', value: string) =>
    setSchedule((prev) => setScheduleTime(prev, index, field, value));

  const submit = () => {
    const result = validateWorkplaceForm({ name, hourlyRate, schedule });
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    onSave({
      name: name.trim(),
      address: address.trim() || undefined,
      hourlyRate: result.rate,
      notes: notes.trim() || undefined,
      color,
      usualSchedule: schedule,
    });
    onClose();
  };

  return {
    name,
    setName,
    address,
    setAddress,
    hourlyRate,
    setHourlyRate,
    notes,
    setNotes,
    color,
    setColor,
    schedule,
    toggleDay,
    setDayTime,
    errorMsg,
    submit,
  };
}
