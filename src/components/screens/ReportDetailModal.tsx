import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Dialog } from '@/components/common/Dialog';
import { TimesheetFooter, TimesheetToolbar } from '@/components/reports/TimesheetActions';
import { TimesheetDocument } from '@/components/reports/TimesheetDocument';
import { Shift, User, Workplace } from '@/types';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  workplace: Workplace | null;
  shifts: Shift[];
  dateRangeLabel: string;
  totalMinutes: number;
  onShare: () => void;
  onExportCSV: () => void;
  /** Creates and shares the PDF; the PDF buttons only show when this is provided. */
  onPrint?: () => void;
}

/** A full-page preview of the timesheet, with share and export actions. */
export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  workplace,
  shifts,
  dateRangeLabel,
  totalMinutes,
  onShare,
  onExportCSV,
  onPrint,
}) => {
  if (!isOpen) return null;

  const hasShifts = shifts.length > 0;

  return (
    <Dialog flush maxWidth={576} onClose={onClose}>
      <TimesheetToolbar
        hasShifts={hasShifts}
        onShare={onShare}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
        onClose={onClose}
      />

      <ScrollView contentContainerStyle={styles.sheet}>
        <TimesheetDocument
          employeeName={user.name}
          workplaceName={workplace ? workplace.name : 'All Workplaces'}
          rangeLabel={dateRangeLabel}
          shifts={shifts}
          totalMinutes={totalMinutes}
        />
      </ScrollView>

      <TimesheetFooter hasShifts={hasShifts} onExportCSV={onExportCSV} onPrint={onPrint} />
    </Dialog>
  );
};

const styles = StyleSheet.create({
  sheet: {
    padding: 16,
    gap: 20,
  },
});
