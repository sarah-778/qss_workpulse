import { useState } from 'react';
import Icon from './Icon';
import { useStore } from '../context/StoreContext';
import { SIGNOFF, hasPrice, money, signoffState } from '../utils/signoff';
import { fmtDateTime } from '../utils/dates';

// The client taps Confirm or Dispute on a day's output. Supervisors see the same card read-only.
export default function SignOffCard({ client, summary, date, signoff, readOnly }) {
  const { signOffDay, notify } = useStore();
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const st = signoffState(signoff, summary, date);
  if (st.key === SIGNOFF.nodata.key) return null;

  const unit = client.unit.toLowerCase();
  const amountNow = hasPrice(client) ? money(summary.totalActual * Number(client.unitPrice)) : null;
  const who = signoff ? `${signoff.byName} on ${fmtDateTime(signoff.at)}` : '';

  const send = (decision) => {
    setError('');
    const res = signOffDay({ clientId: client.id, date, decision, reason });
    if (!res.ok) { setError(res.error); return; }
    setDisputing(false); setReason('');
    notify(decision === 'confirmed' ? 'Day confirmed. It is now in your invoice-ready report.' : 'Dispute sent. QSS has been alerted.');
  };

  let message;
  switch (st.key) {
    case 'open':
      message = 'Sign-off opens once every shift has reported, or after the day has ended.'; break;
    case 'pending':
      message = readOnly
        ? `Waiting for ${client.name} to confirm or dispute this day.`
        : `Check the output: ${summary.totalActual.toLocaleString()} ${unit} against a daily target of ${summary.dailyTarget.toLocaleString()}.${amountNow ? ` Confirming adds ${amountNow} to your invoice-ready report.` : ''}`;
      break;
    case 'confirmed':
      message = `Confirmed by ${who}: ${Number(signoff.actual).toLocaleString()} ${unit}${signoff.unitPrice ? ` = ${money(signoff.actual * signoff.unitPrice)}` : ''}. This day counts towards the invoice.`;
      break;
    case 'disputed':
      message = `Disputed by ${who}: “${signoff.reason}” ${readOnly ? 'Correct the records below; the client will be asked to re-confirm.' : 'QSS has been alerted and will correct the records or reply.'}`;
      break;
    default: // revised
      message = `The records for this day changed after the client's ${signoff.decision === 'confirmed' ? 'confirmation' : 'dispute'} (${Number(signoff.actual).toLocaleString()} → ${summary.totalActual.toLocaleString()} ${unit}). ${readOnly ? 'Waiting for the client to review and confirm again.' : 'Please review and confirm again.'}`;
  }

  const showMain = !readOnly && (st.key === 'pending' || st.key === 'revised');
  const showChange = !readOnly && (st.key === 'confirmed' || st.key === 'disputed');

  return (
    <section className="card pad stack-sm signoff" style={{ borderLeft: `6px solid ${st.hex}` }}>
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">Daily sign-off</div>
          <h3 className="h3">{st.key === 'confirmed' ? 'This day is confirmed' : 'Do the numbers match your records?'}</h3>
        </div>
        <span className="pill" style={{ background: st.soft, color: st.text }}>{st.label}</span>
      </div>
      <p className="muted m0">{message}</p>

      {error && <div className="alert alert-error small" role="alert"><Icon name="warn" size={16} /> {error}</div>}

      {!disputing && showMain && (
        <div className="row-gap no-print">
          <button type="button" className="btn btn-primary" onClick={() => send('confirmed')}><Icon name="check" /> Confirm day</button>
          <button type="button" className="btn btn-ghost danger-text" onClick={() => setDisputing(true)}><Icon name="warn" /> Dispute</button>
        </div>
      )}
      {!disputing && showChange && (
        <div className="row-gap no-print">
          {st.key === 'confirmed'
            ? <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setDisputing(true)}>Dispute this day instead</button>
            : <button type="button" className="btn btn-ghost btn-sm" onClick={() => send('confirmed')}><Icon name="check" size={16} /> Confirm after all</button>}
        </div>
      )}
      {disputing && (
        <div className="stack-sm no-print">
          <label className="field"><span>What looks wrong?</span>
            <textarea className="input" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Our gate log shows 80 pallets left the dock, not 84." autoFocus /></label>
          <div className="row-gap">
            <button type="button" className="btn btn-primary" onClick={() => send('disputed')}>Send dispute</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setDisputing(false); setError(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
