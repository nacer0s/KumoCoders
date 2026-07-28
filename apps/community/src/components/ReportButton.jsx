import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ReportDialog from './ReportDialog.jsx';

export default function ReportButton({ targetType, targetId }) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        className="community-report-btn"
        onClick={(e) => { e.stopPropagation(); setShowDialog(true); }}
        title="Report"
        aria-label="Report"
      >
        <span className="nf nf-fa-flag" />
      </button>

      {showDialog && (
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
