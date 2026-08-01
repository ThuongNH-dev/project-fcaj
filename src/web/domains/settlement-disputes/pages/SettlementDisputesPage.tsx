import { AlertTriangle, ArrowLeft, ExternalLink, FileImage, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AdminPagination } from "../../../app/admin/components/AdminPagination";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import {
  getMySettlementDisputes,
  getSettlementDisputeById,
  getSettlementDisputeEvidenceViewUrl,
  type SettlementDispute,
  type SettlementDisputeReason,
} from "..";

const PAGE_LIMIT = 10;

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

function DisputeSummaryCard({
  dispute,
  onOpen,
}: {
  dispute: SettlementDispute;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
            {REASON_LABELS[dispute.reason]}
          </p>
          <p className="mt-1 truncate text-xs text-[#6B7280]">
            Settlement: {dispute.settlementId}
          </p>
        </div>
        <StatusBadge status={dispute.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-[#4B5563]">{dispute.description}</p>
      <p className="mt-3 text-xs text-[#9CA3AF]">Created {formatDate(dispute.createdAt)}</p>
    </button>
  );
}

function MyDisputesList() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<SettlementDispute[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDisputes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await getMySettlementDisputes({ page, limit: PAGE_LIMIT });
      setDisputes(response.disputes);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load settlement disputes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadDisputes();
  }, [loadDisputes]);

  return (
    <div className="min-h-screen bg-[#F6FBF8] px-6 pb-8 pt-16 lg:pt-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/settlement")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#111827]"
          style={{ fontWeight: 600 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settlements
        </button>
        <div className="rounded-3xl border border-[#E5E7EB] bg-white px-6 py-6">
          <h1 className="text-2xl text-[#111827]" style={{ fontWeight: 800 }}>
            My settlement disputes
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Track the status and administrator response for disputes you submitted.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-[#6B7280]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        ) : disputes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-6 py-16 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-[#9CA3AF]" />
            <p className="mt-3 text-sm text-[#6B7280]">You have not submitted any disputes.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {disputes.map((dispute) => (
                <DisputeSummaryCard
                  key={dispute.id}
                  dispute={dispute}
                  onOpen={() => navigate(`/settlement/disputes/${encodeURIComponent(dispute.id)}`)}
                />
              ))}
            </div>
            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function MyDisputeDetail() {
  const navigate = useNavigate();
  const { disputeId = "" } = useParams();
  const { showToast } = useFeedback();
  const [dispute, setDispute] = useState<SettlementDispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadDispute() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await getSettlementDisputeById(disputeId);
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
      const response = await getSettlementDisputeEvidenceViewUrl(dispute.id, evidenceId);
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

  return (
    <div className="min-h-screen bg-[#F6FBF8] px-6 pb-8 pt-16 lg:pt-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/settlement/disputes")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#111827]"
          style={{ fontWeight: 600 }}
        >
          <ArrowLeft className="h-4 w-4" />
          My disputes
        </button>
        {isLoading ? (
          <div className="flex justify-center py-16 text-[#6B7280]"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">{errorMessage}</div>
        ) : dispute ? (
          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl text-[#111827]" style={{ fontWeight: 800 }}>
                  {REASON_LABELS[dispute.reason]}
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">Submitted {formatDate(dispute.createdAt)}</p>
              </div>
              <StatusBadge status={dispute.status} />
            </div>
            <dl className="mt-6 grid gap-4 rounded-2xl bg-[#F9FAFB] p-4 sm:grid-cols-2">
              <div><dt className="text-xs text-[#6B7280]">Settlement ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.settlementId}</dd></div>
              <div><dt className="text-xs text-[#6B7280]">Group ID</dt><dd className="mt-1 break-all text-sm text-[#111827]">{dispute.groupId}</dd></div>
            </dl>
            <section className="mt-6">
              <h2 className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4B5563]">{dispute.description}</p>
            </section>
            {dispute.adminNote ? (
              <section className="mt-6 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
                <h2 className="text-sm text-[#166534]" style={{ fontWeight: 700 }}>Administrator note</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#166534]">{dispute.adminNote}</p>
              </section>
            ) : null}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SettlementDisputesPage() {
  const { disputeId } = useParams();
  return disputeId ? <MyDisputeDetail /> : <MyDisputesList />;
}
