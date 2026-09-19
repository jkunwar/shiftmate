import * as Print from 'expo-print';
import { Platform, Share } from 'react-native';

import { useFormat } from '@/hooks/use-format';
import { deliverFile, errorDetail } from '@/lib/export-file';
import { Shift, User, UserPreferences, Workplace } from '@/types';
import { base64ToBytes } from '@/utils/base64';
import { ReportRange } from '@/utils/reportFilters';
import { generateTimesheetCSV } from '@/utils/timeCalculations';
import { buildShareText, buildTimesheetHtml } from '@/utils/timesheet';

interface ReportExportOptions {
  user: User;
  workplaces: Workplace[];
  /** The shifts in the report, already filtered. */
  shifts: Shift[];
  /** The single workplace being reported on, or null for all of them. */
  workplace: Workplace | null;
  range: ReportRange;
  weekStartsOn: UserPreferences['weekStartsOn'];
  showToast: (message: string) => void;
}

/** Share, CSV and PDF export for a report. Each does nothing when there are no shifts. */
export function useReportExport({
  user,
  workplaces,
  shifts,
  workplace,
  range,
  weekStartsOn,
  showToast,
}: ReportExportOptions) {
  const { time } = useFormat();
  const hasShifts = shifts.length > 0;

  const exportCSV = async () => {
    if (!hasShifts) return;
    const csvContent = generateTimesheetCSV(
      shifts,
      workplaces,
      `${workplace?.name || 'All Workplaces'} - ${range.label}`,
      time,
    );

    try {
      await deliverFile(
        {
          label: 'Timesheet CSV',
          name: `timesheet_${range.start}_to_${range.end}.csv`,
          mimeType: 'text/csv',
          uti: 'public.comma-separated-values-text',
          data: csvContent,
        },
        showToast,
      );
    } catch (error) {
      console.warn('Timesheet CSV export failed:', error);
      showToast(`Could not export the timesheet CSV${errorDetail(error)}`);
    }
  };

  const share = async () => {
    if (!hasShifts) return;
    const summaryText = buildShareText({
      workplaceName: workplace?.name || 'All Jobs',
      rangeLabel: range.label,
      shifts,
      weekStartsOn,
    });

    try {
      const result = await Share.share({ title: 'Work Timesheet Report', message: summaryText });
      if (result.action === Share.sharedAction) {
        showToast('Timesheet shared');
      }
    } catch {
      showToast('Could not share the timesheet');
    }
  };

  const exportPDF = async () => {
    if (!hasShifts) return;
    const html = buildTimesheetHtml({
      user,
      workplaces,
      workplaceName: workplace?.name || 'All Workplaces',
      rangeLabel: range.label,
      shifts,
      weekStartsOn,
      showWorkplace: workplace === null,
      formatTimeValue: time,
    });

    try {
      // No file to hand over on the web: open the browser's print dialog (Save as PDF)
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      // Asked for as base64 so the app writes the file itself (see deliverFile)
      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!base64) throw new Error('The PDF came back empty');

      await deliverFile(
        {
          label: 'Timesheet PDF',
          name: `timesheet_${range.start}_to_${range.end}.pdf`,
          mimeType: 'application/pdf',
          uti: 'com.adobe.pdf',
          data: base64ToBytes(base64),
        },
        showToast,
      );
    } catch (error) {
      console.warn('Timesheet PDF export failed:', error);
      showToast(`Could not create the timesheet PDF${errorDetail(error)}`);
    }
  };

  return { hasShifts, exportCSV, share, exportPDF };
}
