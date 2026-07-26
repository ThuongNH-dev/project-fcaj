import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyVnpayReturn } from "../api/payments.api";

interface ReturnState {
  isLoading: boolean;
  ok: boolean;
  message: string;
}

export function VnpayReturnPage() {
  const [state, setState] = useState<ReturnState>({
    isLoading: true,
    ok: false,
    message: "Verifying VNPay payment...",
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const responseCode = searchParams.get("vnp_ResponseCode");
    const transactionStatus = searchParams.get("vnp_TransactionStatus");
    const isVnpaySuccess = responseCode === "00" && transactionStatus === "00";

    if (isVnpaySuccess) {
      window.setTimeout(() => {
        window.location.replace("/settings?tab=billing");
      }, 1200);
    }

    async function verify() {
      try {
        const response = await verifyVnpayReturn(window.location.search);

        setState({
          isLoading: false,
          ok: response.ok,
          message: response.message,
        });
      } catch (error) {
        if (isVnpaySuccess) {
          setState({
            isLoading: false,
            ok: true,
            message: "VNPay returned a successful transaction.",
          });
          return;
        }

        setState({
          isLoading: false,
          ok: false,
          message:
            error instanceof Error ? error.message : "Unable to verify VNPay payment.",
        });
      }
    }

    void verify();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6FBF8] px-6 py-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F9FAFB]">
          {state.isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
          ) : state.ok ? (
            <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
          ) : (
            <XCircle className="h-8 w-8 text-[#DC2626]" />
          )}
        </div>

        <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">
          {state.isLoading
            ? "Checking payment status"
            : state.ok
              ? "Payment successful"
              : "Payment was not completed"}
        </h1>
        <p className="mb-6 text-sm text-[#6B7280]">{state.message}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.replace("/settings?tab=billing")}
            className="rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
          >
            Go to billing
          </button>
          <Link
            to="/dashboard"
            className="rounded-xl border border-[#D1D5DB] px-5 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
