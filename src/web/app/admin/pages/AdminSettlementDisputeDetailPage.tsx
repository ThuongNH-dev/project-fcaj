import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  getAdminSettlementDisputeById,
  getAdminSettlementDisputeEvidenceViewUrl,
  updateAdminSettlementDisputeStatus,
  type SettlementDispute,
  type SettlementDisputeReason,
} from "../../../domains/settlement-disputes";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";

const REASON_LABELS: Record<SettlementDisputeReason, string> = {
  payment_not_received: "Payment not received",
  incorrect_amount: "Incorrect amount",
  unauthorized_settlement: "Unauthorized settlement",
  other: "Other",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function StatusBadge({ status }: { status: SettlementDispute["status"] }) {
  const styles = {
    pending: "bg-[#FEF3C7] text-[#92400E]",
    resolved: "bg-[#DCFCE7] text-[#166534]",
    rejected: "bg-[#FEE2E2] text-[#991B1B]",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs capitalize ${styles[status]}`}
      style={{ fontWeight: 700 }}
    >
      {status}
    </span>
  );
}

export function AdminSettlementDisputeDetailPage() {
  const navigate = useNavigate();
  const { disputeId = "" } = useParams();
  const { confirm, showToast } = useFeedback();
  const [dispute, setDispute] = useState<SettlementDispute | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadDispute() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await getAdminSettlementDisputeById(disputeId);
        if (isActive) setDispute(response.dispute);
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load settlement dispute.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    if (!disputeId) {
      setErrorMessage("Settlement dispute ID is required.");
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    void loadDispute();
    return () => {
      isActive = false;
    };
  }, [disputeId]);

  async function handleOpenEvidence(evidenceId: string) {
    if (!dispute || openingEvidenceId) return;

    try {
      setOpeningEvidenceId(evidenceId);
      const response = await getAdminSettlementDisputeEvidenceViewUrl(
        dispute.id,
        evidenceId,
      );
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to open evidence.",
      });
    } finally {
      setOpeningEvidenceId(null);
    }
  }

  async function handleStatusUpdate(status: "resolved" | "rejected") {
    if (!dispute || isUpdating) return;
    const normalizedNote = adminNote.trim();

    if (!normalizedNote) {
      showToast({ variant: "error", message: "An administrator note is required." });
      return;
    }

    const confirmed = await confirm({
      title: status === "resolved" ? "Resolve dispute" : "Reject dispute",
      message:
        status === "resolved"
          ? "This will permanently mark the dispute as resolved."
          : "This will permanently mark the dispute as rejected.",
      confirmLabel: status === "resolved" ? "Resolve" : "Reject",
      cancelLabel: "Cancel",
      variant: status === "resolved" ? "default" : "danger",
    });

    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const response = await updateAdminSettlementDisputeStatus(dispute.id, {
        status,
        adminNote: normalizedNote,
      });
      setDispute(response.dispute);
      setAdminNote("");
      showToast({ variant: "success", message: response.message });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update settlement dispute status.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#111827]"
        style={{ fontWeight: 600 }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to admin
      </button>

      {isLoading ? (
        <div className="flex justify-center py-16 text-[#6B7280]"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">{errorMessage}</div>
      ) : dispute ? (
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#B91C1C]" style={{ fontWeight: 700 }}>Settlement dispute</p>
              <h1 className="mt-1 text-2xl text-[#111827]" style={{ fontWeight: 800 }}>
                {REASON_LABELS[dispute.reason]}
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">Submitted {formatDate(dispute.createdAt)}</p>
            </div>
            <StatusBadge status={dispute.status} />
          </div>

          <dl className="mt-6 grid gap-4 rounded-2xl bg-[#F9FAFB] p-4 sm:grid-cols-2">
            <div><dt className="text-xs text-[#6B7280]">Settlement ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.settlementId}</dd></div>
            <div><dt className="text-xs text-[#6B7280]">Group ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.groupId}</dd></div>
            <div><dt className="text-xs text-[#6B7280]">Submitted by user ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.createdByUserId}</dd></div>
            <div><dt className="text-xs text-[#6B7280]">Against user ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.againstUserId}</dd></div>
          </dl>

          <section className="mt-6">
            <h2 className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>User description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4B5563]">{dispute.description}</p>
          </section>

          <section className="mt-6">
            <h2 className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>Evidence</h2>
            {dispute.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-[#6B7280]">No evidence was attached.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {dispute.evidence.map((evidence) => (
                  <button
                    key={evidence.id}
                    type="button"
                    onClick={() => void handleOpenEvidence(evidence.id)}
                    disabled={openingEvidenceId !== null}
                    className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3 text-left text-sm text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate"><FileImage className="h-4 w-4 flex-shrink-0" />{evidence.originalFileName}</span>
                    {openingEvidenceId === evidence.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </section>

          {dispute.status === "pending" ? (
            <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <label htmlFor="admin-dispute-note" className="block text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                Administrator note
              </label>
              <textarea
                id="admin-dispute-note"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Explain the decision for the user..."
                className="mt-2 w-full resize-y rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#BBF7D0]"
              />
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void handleStatusUpdate("rejected")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#FCA5A5] px-4 py-2.5 text-sm text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-60"
                  style={{ fontWeight: 700 }}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void handleStatusUpdate("resolved")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm text-white hover:bg-[#15803D] disabled:opacity-60"
                  style={{ fontWeight: 700 }}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Resolve
                </button>
              </div>
            </section>
          ) : (
            <section className="mt-6 rounded-2xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
              <h2 className="text-sm text-[#166534]" style={{ fontWeight: 700 }}>Administrator decision</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#166534]">{dispute.adminNote ?? "No note was recorded."}</p>
            </section>
          )}
        </div>
      ) : null}
    </section>
  );
}
