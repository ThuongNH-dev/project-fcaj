import { useEffect, useMemo, useState } from "react";
import { X, Upload, DollarSign, Calendar, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import type { Group } from "../../groups";

export interface NewExpense {
  title: string;
  description?: string;
  amount: number;
  paidBy: string;
  paidByUserId?: string;
  category: string;
  categoryKey?: string;
  date: string;
  splitWith: string[];
  participantShares?: Array<{
    userId: string;
    shareAmount: number;
  }>;
  group?: string;
  groupId?: string;
  splitMode?: "equal" | "custom";
  receiptFile?: File | null;
}

const fallbackGroups = [
  "Bali Trip 2026",
  "Apartment - Unit 4B",
  "Friday Dinners",
  "Tokyo Team Trip",
  "Office Supplies Pool",
  "NYC Bachelor Party",
];

const fallbackMembers = ["Jamie Davis", "Alex Lin", "Mia Chen", "Sam Kim"];

const memberColors: Record<string, string> = {
  "Jamie Davis": "#7EDDBA",
  "Alex Lin": "#93C5FD",
  "Mia Chen": "#FCA5A5",
  "Sam Kim": "#FCD34D",
};

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (expense: NewExpense) => Promise<void> | void;
  showGroupSelect?: boolean;
  availableGroups?: Group[];
  defaultGroupId?: string | null;
  currentUserId?: string | null;
}

function formatIsoDateForInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildEqualShares(totalAmount: number, userIds: string[]) {
  const normalizedTotalAmount = Number(totalAmount.toFixed(2));
  const baseShare = Math.floor((normalizedTotalAmount / userIds.length) * 100) / 100;
  let remainingAmount = normalizedTotalAmount;

  return userIds.map((userId, index) => {
    const shareAmount =
      index === userIds.length - 1 ? Number(remainingAmount.toFixed(2)) : baseShare;
    remainingAmount = Number((remainingAmount - shareAmount).toFixed(2));

    return {
      userId,
      shareAmount,
    };
  });
}

export function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
  showGroupSelect = false,
  availableGroups = [],
  defaultGroupId = null,
  currentUserId = null,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(formatIsoDateForInput(new Date()));
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const normalizedGroups = useMemo(() => {
    if (availableGroups.length > 0) {
      return availableGroups.map((group) => ({
        id: group.id,
        label: group.name,
        members: group.members.map((member) => ({
          id: member.id,
          label: member.name,
        })),
      }));
    }

    return fallbackGroups.map((groupName) => ({
      id: groupName,
      label: groupName,
      members: fallbackMembers.map((memberName) => ({
        id: memberName,
        label: memberName,
      })),
    }));
  }, [availableGroups]);

  const activeGroup =
    normalizedGroups.find((group) => group.id === selectedGroup) ??
    normalizedGroups[0] ??
    null;
  const memberOptions = activeGroup?.members ?? [];

  const categoryOptions = [
    { key: "food", label: t.categories.food },
    { key: "travel", label: t.categories.travel },
    { key: "accommodation", label: t.categories.accommodation },
    { key: "entertainment", label: t.categories.entertainment },
    { key: "shopping", label: t.categories.shopping },
    { key: "utilities", label: t.categories.utilities },
    { key: "other", label: t.categories.other },
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialGroupId =
      (defaultGroupId &&
        normalizedGroups.some((group) => group.id === defaultGroupId) &&
        defaultGroupId) ||
      normalizedGroups[0]?.id ||
      "";

    setSelectedGroup(initialGroupId);
  }, [defaultGroupId, isOpen, normalizedGroups]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fallbackPaidBy =
      memberOptions.find((member) => member.id === currentUserId)?.id ??
      memberOptions[0]?.id ??
      "";

    setPaidBy(fallbackPaidBy);
    setSelectedMembers(memberOptions.map((member) => member.id));
    setCustomShares({});
  }, [currentUserId, isOpen, memberOptions]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((currentMemberId) => currentMemberId !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t.enterTitle);
      return;
    }

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError(t.enterValidAmount);
      return;
    }

    if (selectedMembers.length === 0) {
      setError(t.selectAtLeastOne);
      return;
    }

    if (!paidBy) {
      setError("Please choose who paid.");
      return;
    }

    if (showGroupSelect && !selectedGroup) {
      setError("Please choose a group.");
      return;
    }

    const numericAmount = Number(amount);
    let participantShares = buildEqualShares(numericAmount, selectedMembers);

    if (splitType === "custom") {
      participantShares = selectedMembers.map((memberId) => ({
        userId: memberId,
        shareAmount: Number(customShares[memberId] ?? "0"),
      }));

      const totalCustomAmount = participantShares.reduce(
        (totalAmount, participant) => totalAmount + participant.shareAmount,
        0,
      );

      if (
        participantShares.some(
          (participant) =>
            !Number.isFinite(participant.shareAmount) || participant.shareAmount <= 0,
        )
      ) {
        setError("Each custom share must be greater than zero.");
        return;
      }

      if (Number(totalCustomAmount.toFixed(2)) !== Number(numericAmount.toFixed(2))) {
        setError("Custom shares must add up to the total amount.");
        return;
      }
    }

    const categoryLabel =
      categoryOptions.find((categoryOption) => categoryOption.key === category)?.label ??
      category;
    const paidByLabel =
      memberOptions.find((member) => member.id === paidBy)?.label ?? paidBy;
    const splitWithLabels = selectedMembers.map(
      (memberId) =>
        memberOptions.find((member) => member.id === memberId)?.label ?? memberId,
    );

    try {
      setIsSubmitting(true);

      await onAdd?.({
        title: title.trim(),
        amount: Number(numericAmount.toFixed(2)),
        paidBy: paidByLabel,
        paidByUserId: paidBy,
        category: categoryLabel,
        categoryKey: category,
        date,
        splitWith: splitWithLabels,
        participantShares,
        group: activeGroup?.label,
        groupId: activeGroup?.id,
        splitMode: splitType,
        receiptFile: uploadedFile,
      });

      setTitle("");
      setAmount("");
      setCategory("food");
      setDate(formatIsoDateForInput(new Date()));
      setUploadedFile(null);
      setError("");
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save expense.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <div>
            <h2
              className="text-[#111827]"
              style={{ fontWeight: 800, fontSize: "1.125rem" }}
            >
              {t.addExpenseTitle}
            </h2>
            <p className="text-[#9CA3AF] text-xs mt-0.5">
              {showGroupSelect ? t.chooseGroupDesc : activeGroup?.label ?? "Group"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {showGroupSelect && (
            <div>
              <label
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 600 }}
              >
                {t.group}
              </label>
              <div className="relative">
                <select
                  value={selectedGroup}
                  onChange={(event) => setSelectedGroup(event.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent pr-8"
                >
                  {normalizedGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
          )}

          {error && (
            <div
              className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991b1b] text-sm px-4 py-2.5 rounded-xl"
              style={{ fontWeight: 500 }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm text-[#374151] mb-1.5"
              style={{ fontWeight: 600 }}
            >
              {t.expenseTitle}
            </label>
            <input
              type="text"
              placeholder={t.expensePlaceholder}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 600 }}
              >
                {t.amountLabel}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError("");
                  }}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 600 }}
              >
                {t.dateLabel}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 600 }}
              >
                {t.paidByLabel}
              </label>
              <div className="relative">
                <select
                  value={paidBy}
                  onChange={(event) => setPaidBy(event.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent pr-8"
                >
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
            <div>
              <label
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 600 }}
              >
                {t.categoryLabel}
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent pr-8"
                >
                  {categoryOptions.map((categoryOption) => (
                    <option key={categoryOption.key} value={categoryOption.key}>
                      {categoryOption.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-sm text-[#374151]"
                style={{ fontWeight: 600 }}
              >
                {t.splitBetween}
                {selectedMembers.length > 0 && amount && (
                  <span
                    className="ml-2 text-[#9CA3AF]"
                    style={{ fontWeight: 400 }}
                  >
                    (${(Number(amount || "0") / selectedMembers.length).toFixed(2)} {t.each})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-lg p-0.5">
                <button
                  onClick={() => setSplitType("equal")}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${
                    splitType === "equal" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {t.equal}
                </button>
                <button
                  onClick={() => setSplitType("custom")}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${
                    splitType === "custom" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {t.custom}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {memberOptions.map((member) => {
                const selected = selectedMembers.includes(member.id);

                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      toggleMember(member.id);
                      setError("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                      selected
                        ? "bg-[#F0FAF5] border-[#7EDDBA]"
                        : "bg-[#F9FAFB] border-[#E5E7EB] opacity-60"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: memberColors[member.label] ?? "#D1FAE5",
                        color: "#065f46",
                        fontWeight: 700,
                      }}
                    >
                      {member.label[0]}
                    </div>
                    <span
                      className="flex-1 text-left text-sm text-[#374151]"
                      style={{ fontWeight: 500 }}
                    >
                      {member.label}
                    </span>
                    {selected && (
                      <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    )}
                    {splitType === "custom" && selected && (
                      <input
                        type="number"
                        placeholder="0.00"
                        value={customShares[member.id] ?? ""}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setCustomShares((prev) => ({
                            ...prev,
                            [member.id]: event.target.value,
                          }))
                        }
                        className="w-16 text-right text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#7EDDBA]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              className="block text-sm text-[#374151] mb-1.5"
              style={{ fontWeight: 600 }}
            >
              {t.receiptOptional}
            </label>
            {uploadedFile ? (
              <div className="flex items-center gap-3 bg-[#F0FAF5] border border-[#7EDDBA] rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#16A34A]" />
                </div>
                <span
                  className="text-sm text-[#16A34A] flex-1 truncate"
                  style={{ fontWeight: 500 }}
                >
                  {uploadedFile.name}
                </span>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-[#9CA3AF] hover:text-[#EF4444] flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] border-2 border-dashed border-[#D1FAE5] rounded-xl px-4 py-5 cursor-pointer hover:bg-[#F0FAF5] hover:border-[#7EDDBA] transition-all">
                <div className="w-9 h-9 bg-[#D1FAE5] rounded-xl flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#16A34A]" />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm text-[#374151]"
                    style={{ fontWeight: 500 }}
                  >
                    {t.dropReceipt}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {t.receiptHint}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(event) => {
                    if (event.target.files?.[0]) {
                      setUploadedFile(event.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm hover:bg-[#F9FAFB] transition-colors"
            style={{ fontWeight: 600 }}
          >
            {t.cancel}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white text-sm hover:bg-[#15803d] transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontWeight: 600 }}
          >
            {isSubmitting ? "Saving..." : t.saveExpense}
          </button>
        </div>
      </div>
    </div>
  );
}
