import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "vi";

export const translations = {
  en: {
    // Nav
    home: "Home", features: "Features", pricing: "Pricing", about: "About",
    login: "Log in", signupFree: "Sign up free", signOut: "Sign out",

    // Landing
    heroHeadline: "Split expenses beautifully and effortlessly",
    heroDesc: "Create groups, add expenses, split bills, and instantly know who owes whom. No more spreadsheets. No more awkward conversations.",
    getStarted: "Get Started", viewDemo: "View Demo",
    getStartedFree: "Get started for free →",
    lovedBy: "Loved by 12,000+ users",
    freeForSmall: "Free for small groups",
    featuresTitle: "Everything you need to split fairly",
    featuresDesc: "Built for real groups — friends, families, roommates, and teams.",
    howItWorks: "How it works",
    howItWorksDesc: "Up and running in under 2 minutes.",
    peopleLove: "People love Splitly",
    realStories: "Real stories from real groups.",
    simplePricing: "Simple, honest pricing",
    startFree: "Start free. Upgrade when you need more.",
    readyToSplit: "Ready to split smarter?",
    joinUsers: "Join 12,000+ people already using Splitly to keep things fair.",
    step1Title: "Create a group", step1Desc: "Invite friends by email or link. No sign-up required to join.",
    step2Title: "Add expenses", step2Desc: "Enter amount, choose who paid, and split however you like.",
    step3Title: "Settle up", step3Desc: "See the minimal set of payments to clear all debts.",
    feat1Title: "Group Expenses", feat1Desc: "Create groups for any occasion — trips, rent, dinners, or projects. Add members and start tracking instantly.",
    feat2Title: "Smart Split", feat2Desc: "Split evenly, by percentage, by shares, or enter exact amounts. Our smart algorithm handles any scenario.",
    feat3Title: "Settlement Tracking", feat3Desc: "See exactly who owes whom with a clear debt graph. One tap to mark payments as settled.",
    feat4Title: "Receipt Upload", feat4Desc: "Snap a photo of any receipt and we'll parse the amounts automatically. Keep records for everyone.",
    // Pricing
    free: "Free", pro: "Pro", team: "Team",
    startTrial: "Start free trial", contactSales: "Contact sales",
    pricingPeriod: "/mo",
    pricingFreePrice: "$0", pricingProPrice: "$4", pricingTeamPrice: "$12",
    pricingFreeFeatures: ["Up to 3 groups", "10 expenses/month", "Basic split options", "Email support"],
    pricingProFeatures: ["Unlimited groups", "Unlimited expenses", "Receipt scanning", "All split types", "Priority support"],
    pricingTeamFeatures: ["Everything in Pro", "Admin dashboard", "Export reports", "SSO", "Dedicated support"],
    // Footer
    privacy: "Privacy", terms: "Terms", helpCenter: "Help Center", contact: "Contact",

    // Auth
    welcomeBack: "Welcome back", createAccount: "Create your account",
    startSplitting: "Start splitting expenses in minutes.",
    signInToContinue: "Sign in to continue to Splitly.",
    continueWithGoogle: "Continue with Google",
    orWithEmail: "or with email",
    fullName: "Full name", emailAddress: "Email", password: "Password",
    confirmPassword: "Confirm password", forgotPassword: "Forgot password?",
    signIn: "Sign in", createAccountBtn: "Create account",
    alreadyHaveAccount: "Already have an account?", dontHaveAccount: "Don't have an account?",
    fairSplits: "Fair splits, happy friendships.",
    leftPanelDesc: "Stop worrying about who owes what. Splitly handles the maths so you can focus on the memories.",
    recentActivity: "Recent activity",

    // Sidebar
    dashboard: "Dashboard", groups: "Groups", expenses: "Expenses",
    settlements: "Settlements", receipts: "Receipts", admin: "Admin", settings: "Settings",

    // Dashboard
    goodMorning: "Good morning",
    welcomeMsg: "Welcome! Create a group to get started.",
    searchExpenses: "Search expenses...",
    totalExpenses: "Total Expenses", youOwe: "You Owe", youAreOwed: "You Are Owed",
    activeGroups: "Active Groups", noExpensesYet: "No expenses yet",
    expenseChart: "Expense Analytics", monthlyOverview: "Monthly overview",
    noCategoryData: "No category data yet", byCategory: "By Category", thisMonth: "This month",
    noActivityYet: "No activity yet", activityDesc: "Expenses and payments will show up here.",
    quickDebts: "Quick Debts", noOutstandingDebts: "No outstanding debts",
    goToGroups: "Go to Groups to begin",

    // Groups
    groupsTitle: "Groups", groupsTotal: "groups total",
    newGroup: "New Group", searchGroups: "Search groups...",
    noGroupsYet: "No groups yet",
    noGroupsDesc: "Create a group for your trip, apartment, or any shared expense situation.",
    createFirstGroup: "Create your first group",
    all: "All", active: "Active", settled: "Settled", pending: "Pending",
    members: "members", viewExpenses: "View expenses",
    totalExpensesLabel: "Total expenses", yourBalance: "Your balance",

    // Create Group Modal
    createGroup: "Create Group", createGroupDesc: "Set up a new shared expense group",
    editGroup: "Edit Group", editGroupDesc: "Update your group details",
    deleteGroup: "Delete Group", deleteGroupConfirm: "Delete group",
    readyToUpdate: "Ready to update",
    deleting: "Deleting...", updating: "Updating...",
    groupName: "Group name", groupNamePlaceholder: "e.g. Bali Trip 2026",
    groupIcon: "Group icon", color: "Color",
    inviteMembers: "Invite members (optional)", addAnother: "Add another",
    cancel: "Cancel", justCreated: "Just created · 1 member",

    // Group Detail
    backToGroups: "Back to Groups",
    addExpense: "Add Expense", noExpensesInGroup: "No expenses yet",
    addExpensePrompt: "Click \"Add Expense\" to record the first one.",
    memberBalances: "Member Balances", whoOwesWhom: "Who Owes Whom",
    noDebts: "No debts to show", goToSettlements: "Go to Settlements →",
    noMembersYet: "No members added yet", noReceiptsYet: "No receipts attached yet.",
    manageMembers: "Manage members", addMemberByEmail: "Add member by email",
    addMember: "Add", addingMember: "Adding...",
    removeMember: "Remove member", removeMemberConfirm: "Remove member",
    yourShare: "Your Share", youPaid: "You Paid",
    expense: "Expense", category: "Category", paidBy: "Paid By",
    amount: "Amount", date: "Date", status: "Status",

    // Add Expense Modal
    addExpenseTitle: "Add Expense", chooseGroupDesc: "Choose a group and fill in the details",
    expenseTitle: "Expense title", expensePlaceholder: "e.g. Team dinner at Locavore",
    amountLabel: "Amount", dateLabel: "Date", paidByLabel: "Paid by",
    categoryLabel: "Category", splitBetween: "Split between",
    equal: "Equal", custom: "Custom", each: "each",
    receiptOptional: "Receipt (optional)", dropReceipt: "Drop receipt here or click to upload",
    receiptHint: "PNG, JPG, or PDF up to 10MB",
    saveExpense: "Save Expense", selectAtLeastOne: "Select at least one member to split with.",
    enterTitle: "Please enter an expense title.", enterValidAmount: "Please enter a valid amount.",
    group: "Group",
    categories: { food: "Food & Drink", travel: "Travel", accommodation: "Accommodation", entertainment: "Entertainment", shopping: "Shopping", utilities: "Utilities", other: "Other" },

    // Expenses Page
    expensesTitle: "Expenses", expenseTotal: "expense", expensesTotal: "expenses",
    addExpenseBtn: "Add Expense", totalSpent: "Total Spent (Your Share)",
    pendingSettlement: "Pending Settlement", expensesThisMonth: "Expenses This Month",
    searchExpensesGroups: "Search expenses or groups...",
    noExpensesTitle: "No expenses yet", noExpensesAddFirst: "Add your first expense to start tracking.",
    noResultsFound: "No results found", adjustFilter: "Try adjusting your search or filter.",

    // Settlements
    settlementsTitle: "Settlements", settlementsDesc: "Track and manage payments between group members.",
    youAreOwedLabel: "You Are Owed", youOweLabel: "You Owe", settledThisMonth: "Settled This Month",
    pendingSettlements: "Pending Settlements", allClear: "All clear!",
    noSettlementsDesc: "No settlements yet. Add expenses to groups and debts will appear here.",
    settlementTimeline: "Settlement Timeline", noActivityLogged: "No activity yet",
    netPosition: "Net position", addExpensesToSeeBalance: "Add expenses to see your net balance.",
    markAsPaid: "Mark as Paid", markedPaid: "Marked paid",

    // Receipts
    receiptsTitle: "Receipts", receiptsUploaded: "receipts uploaded",
    uploadReceipt: "Upload Receipt", dragDrop: "Drag & drop receipts here",
    dragDropHint: "Supports PNG, JPG, and PDF up to 10 MB each",
    processed: "Processed", pendingReview: "Pending Review", failedErrors: "Failed / Errors",
    searchReceipts: "Search receipts...",
    noReceiptsTitle: "No receipts yet", noReceiptsDesc: "Upload a receipt to attach it to an expense.",
    uploadFirstReceipt: "Upload your first receipt",

    // Admin
    adminTitle: "Admin Dashboard", adminDesc: "Manage users, monitor activity, and export data.",
    exportData: "Export Data", totalUsers: "Total Users", totalGroups: "Total Groups",
    rejectedTx: "Rejected Tx", users: "Users", uploads: "Uploads",
    activityLogs: "Activity Logs", searchUsers: "Search users...",
    noUsersYet: "No users yet", noUsersDesc: "Users will appear here once they sign up.",
    noUploads: "No uploads yet", noUploadsDesc: "Receipt uploads will be listed here.",
    noRejectedTx: "No rejected transactions", noRejectedDesc: "Any rejected payments will appear here.",
    noLogsYet: "No activity logged", noLogsDesc: "System events will be recorded here.",
    uploadHistory: "Upload History", rejectedTransactions: "Rejected Transactions", systemLogs: "System Activity Logs",

    // Settings
    settingsTitle: "Settings", settingsDesc: "Manage your account, preferences, and security.",
    profile: "Profile", notifications: "Notifications", security: "Security",
    billing: "Billing", appearance: "Appearance",
    profileInfo: "Profile Information", firstName: "First name", lastName: "Last name",
    firstNamePlaceholder: "Enter first name", lastNamePlaceholder: "Enter last name",
    emailPlaceholder: "you@example.com", bio: "Bio",
    bioPaceholder: "Tell your group members a little about yourself…",
    defaultCurrency: "Default currency", saveChanges: "Save changes", saved: "Saved!",
    removePhoto: "Remove photo",
    notificationPrefs: "Notification Preferences",
    expenseAdded: "Expense added", expenseAddedDesc: "When someone adds an expense to your group",
    paymentReceived: "Payment received", paymentReceivedDesc: "When a group member marks a payment as sent",
    settlementReminder: "Settlement reminders", settlementReminderDesc: "Weekly reminders for pending settlements",
    weeklyDigest: "Weekly digest", weeklyDigestDesc: "A weekly summary of your group activity",
    groupInvitesLabel: "Group invites", groupInvitesDesc: "When you are invited to a new group",
    marketingEmails: "Product updates & tips", marketingEmailsDesc: "News, feature updates, and tips from Splitly",
    changePassword: "Change Password", currentPassword: "Current password",
    newPassword: "New password", confirmNewPassword: "Confirm new password",
    updatePassword: "Update password",
    dangerZone: "Danger Zone", dangerZoneDesc: "Once you delete your account, all your data will be permanently removed.",
    deleteAccount: "Delete account",
    currentPlan: "Current Plan", onFreePlan: "You are on the Free plan.",
    groupsUsed: "Groups", expensesUsed: "Expenses", membersLabel: "Members",
    receiptScan: "Receipt scan", unlimited: "Unlimited", notIncluded: "Not included",
    upgradePro: "Upgrade to Pro — $4/mo",
    paymentMethod: "Payment Method", noPaymentMethod: "No payment method",
    noPaymentDesc: "Add a card to upgrade your plan.", addPaymentMethod: "+ Add payment method",
    appearanceTitle: "Appearance", theme: "Theme", accentColor: "Accent color", density: "Density",
    light: "Light", dark: "Dark", system: "System",
    compact: "Compact", default: "Default", comfortable: "Comfortable",
  },
  vi: {
    // Nav
    home: "Trang chủ", features: "Tính năng", pricing: "Bảng giá", about: "Giới thiệu",
    login: "Đăng nhập", signupFree: "Đăng ký miễn phí", signOut: "Đăng xuất",

    // Landing
    heroHeadline: "Chia sẻ chi phí dễ dàng và tiện lợi",
    heroDesc: "Tạo nhóm, thêm chi phí, chia hóa đơn và biết ngay ai nợ ai. Không cần bảng tính. Không còn tình huống khó xử.",
    getStarted: "Bắt đầu ngay", viewDemo: "Xem demo",
    getStartedFree: "Bắt đầu miễn phí →",
    lovedBy: "Được 12.000+ người dùng yêu thích",
    freeForSmall: "Miễn phí cho nhóm nhỏ",
    featuresTitle: "Mọi thứ bạn cần để chia công bằng",
    featuresDesc: "Được xây dựng cho các nhóm thực tế — bạn bè, gia đình, bạn cùng phòng và đồng nghiệp.",
    howItWorks: "Cách hoạt động",
    howItWorksDesc: "Bắt đầu trong vòng 2 phút.",
    peopleLove: "Mọi người yêu thích Splitly",
    realStories: "Câu chuyện thật từ các nhóm thật.",
    simplePricing: "Bảng giá đơn giản, minh bạch",
    startFree: "Bắt đầu miễn phí. Nâng cấp khi cần.",
    readyToSplit: "Sẵn sàng chia thông minh hơn?",
    joinUsers: "Tham gia cùng 12.000+ người đang dùng Splitly để chia công bằng.",
    step1Title: "Tạo nhóm", step1Desc: "Mời bạn bè qua email hoặc liên kết. Không cần đăng ký để tham gia.",
    step2Title: "Thêm chi phí", step2Desc: "Nhập số tiền, chọn người đã trả, và chia theo cách bạn muốn.",
    step3Title: "Thanh toán", step3Desc: "Xem danh sách thanh toán tối thiểu để xóa tất cả các khoản nợ.",
    feat1Title: "Chi phí nhóm", feat1Desc: "Tạo nhóm cho mọi dịp — chuyến đi, thuê nhà, bữa tối hoặc dự án. Thêm thành viên và bắt đầu theo dõi ngay.",
    feat2Title: "Chia thông minh", feat2Desc: "Chia đều, theo phần trăm, theo phần hoặc nhập số tiền chính xác. Thuật toán thông minh xử lý mọi tình huống.",
    feat3Title: "Theo dõi thanh toán", feat3Desc: "Xem chính xác ai nợ ai với biểu đồ nợ rõ ràng. Một chạm để đánh dấu đã thanh toán.",
    feat4Title: "Tải hóa đơn", feat4Desc: "Chụp ảnh hóa đơn và chúng tôi sẽ tự động phân tích số tiền. Lưu hồ sơ cho tất cả mọi người.",
    free: "Miễn phí", pro: "Pro", team: "Nhóm",
    startTrial: "Dùng thử miễn phí", contactSales: "Liên hệ bán hàng",
    pricingPeriod: "/tháng",
    pricingFreePrice: "0 ₫", pricingProPrice: "99.000 ₫", pricingTeamPrice: "299.000 ₫",
    pricingFreeFeatures: ["Tối đa 3 nhóm", "10 chi phí/tháng", "Tùy chọn chia cơ bản", "Hỗ trợ qua email"],
    pricingProFeatures: ["Không giới hạn nhóm", "Không giới hạn chi phí", "Quét hóa đơn", "Tất cả kiểu chia", "Hỗ trợ ưu tiên"],
    pricingTeamFeatures: ["Tất cả tính năng Pro", "Bảng quản trị", "Xuất báo cáo", "SSO", "Hỗ trợ chuyên trách"],
    privacy: "Quyền riêng tư", terms: "Điều khoản", helpCenter: "Trung tâm hỗ trợ", contact: "Liên hệ",

    // Auth
    welcomeBack: "Chào mừng trở lại", createAccount: "Tạo tài khoản của bạn",
    startSplitting: "Bắt đầu chia chi phí trong vài phút.",
    signInToContinue: "Đăng nhập để tiếp tục với Splitly.",
    continueWithGoogle: "Tiếp tục với Google",
    orWithEmail: "hoặc với email",
    fullName: "Họ và tên", emailAddress: "Email", password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu", forgotPassword: "Quên mật khẩu?",
    signIn: "Đăng nhập", createAccountBtn: "Tạo tài khoản",
    alreadyHaveAccount: "Đã có tài khoản?", dontHaveAccount: "Chưa có tài khoản?",
    fairSplits: "Chia công bằng, tình bạn bền vững.",
    leftPanelDesc: "Không cần lo ai nợ ai. Splitly tính toán để bạn tập trung vào những kỷ niệm.",
    recentActivity: "Hoạt động gần đây",

    // Sidebar
    dashboard: "Tổng quan", groups: "Nhóm", expenses: "Chi phí",
    settlements: "Thanh toán", receipts: "Hóa đơn", admin: "Quản trị", settings: "Cài đặt",

    // Dashboard
    goodMorning: "Chào buổi sáng",
    welcomeMsg: "Chào mừng! Tạo nhóm để bắt đầu.",
    searchExpenses: "Tìm kiếm chi phí...",
    totalExpenses: "Tổng chi phí", youOwe: "Bạn nợ", youAreOwed: "Bạn được nợ",
    activeGroups: "Nhóm đang hoạt động", noExpensesYet: "Chưa có chi phí",
    expenseChart: "Phân tích chi phí", monthlyOverview: "Tổng quan hàng tháng",
    noCategoryData: "Chưa có dữ liệu danh mục", byCategory: "Theo danh mục", thisMonth: "Tháng này",
    noActivityYet: "Chưa có hoạt động", activityDesc: "Chi phí và thanh toán sẽ hiển thị ở đây.",
    quickDebts: "Nợ nhanh", noOutstandingDebts: "Không có nợ tồn đọng",
    goToGroups: "Vào mục Nhóm để bắt đầu",

    // Groups
    groupsTitle: "Nhóm", groupsTotal: "nhóm tổng cộng",
    newGroup: "Nhóm mới", searchGroups: "Tìm kiếm nhóm...",
    noGroupsYet: "Chưa có nhóm nào",
    noGroupsDesc: "Tạo nhóm cho chuyến đi, căn hộ hoặc bất kỳ chi phí chung nào.",
    createFirstGroup: "Tạo nhóm đầu tiên",
    all: "Tất cả", active: "Đang hoạt động", settled: "Đã thanh toán", pending: "Đang chờ",
    members: "thành viên", viewExpenses: "Xem chi phí",
    totalExpensesLabel: "Tổng chi phí", yourBalance: "Số dư của bạn",

    // Create Group Modal
    createGroup: "Tạo nhóm", createGroupDesc: "Thiết lập nhóm chi phí chung mới",
    editGroup: "Sửa nhóm", editGroupDesc: "Cập nhật thông tin nhóm",
    deleteGroup: "Xóa nhóm", deleteGroupConfirm: "Xóa nhóm",
    readyToUpdate: "Sẵn sàng cập nhật",
    deleting: "Đang xóa...", updating: "Đang cập nhật...",
    groupName: "Tên nhóm", groupNamePlaceholder: "vd: Chuyến đi Bali 2026",
    groupIcon: "Biểu tượng nhóm", color: "Màu sắc",
    inviteMembers: "Mời thành viên (tùy chọn)", addAnother: "Thêm người khác",
    cancel: "Hủy", justCreated: "Vừa tạo · 1 thành viên",

    // Group Detail
    backToGroups: "Quay lại Nhóm",
    addExpense: "Thêm chi phí", noExpensesInGroup: "Chưa có chi phí",
    addExpensePrompt: "Nhấn \"Thêm chi phí\" để ghi lại chi phí đầu tiên.",
    memberBalances: "Số dư thành viên", whoOwesWhom: "Ai nợ ai",
    noDebts: "Không có khoản nợ", goToSettlements: "Đến Thanh toán →",
    noMembersYet: "Chưa có thành viên", noReceiptsYet: "Chưa có hóa đơn đính kèm.",
    manageMembers: "Quản lý thành viên", addMemberByEmail: "Thêm thành viên bằng email",
    addMember: "Thêm thành viên", addingMember: "Đang thêm...",
    removeMember: "Xóa thành viên", removeMemberConfirm: "Xóa thành viên",
    yourShare: "Phần của bạn", youPaid: "Bạn đã trả",
    expense: "Chi phí", category: "Danh mục", paidBy: "Người trả",
    amount: "Số tiền", date: "Ngày", status: "Trạng thái",

    // Add Expense Modal
    addExpenseTitle: "Thêm chi phí", chooseGroupDesc: "Chọn nhóm và điền thông tin",
    expenseTitle: "Tên chi phí", expensePlaceholder: "vd: Bữa tối nhóm tại Nobu",
    amountLabel: "Số tiền", dateLabel: "Ngày", paidByLabel: "Người trả",
    categoryLabel: "Danh mục", splitBetween: "Chia cho",
    equal: "Đều nhau", custom: "Tùy chỉnh", each: "mỗi người",
    receiptOptional: "Hóa đơn (tùy chọn)", dropReceipt: "Kéo thả hóa đơn hoặc nhấn để tải lên",
    receiptHint: "PNG, JPG hoặc PDF tối đa 10MB",
    saveExpense: "Lưu chi phí", selectAtLeastOne: "Chọn ít nhất một thành viên để chia.",
    enterTitle: "Vui lòng nhập tên chi phí.", enterValidAmount: "Vui lòng nhập số tiền hợp lệ.",
    group: "Nhóm",
    categories: { food: "Ăn uống", travel: "Di chuyển", accommodation: "Lưu trú", entertainment: "Giải trí", shopping: "Mua sắm", utilities: "Tiện ích", other: "Khác" },

    // Expenses Page
    expensesTitle: "Chi phí", expenseTotal: "chi phí", expensesTotal: "chi phí",
    addExpenseBtn: "Thêm chi phí", totalSpent: "Tổng đã chi (phần của bạn)",
    pendingSettlement: "Chờ thanh toán", expensesThisMonth: "Chi phí tháng này",
    searchExpensesGroups: "Tìm kiếm chi phí hoặc nhóm...",
    noExpensesTitle: "Chưa có chi phí", noExpensesAddFirst: "Thêm chi phí đầu tiên để bắt đầu theo dõi.",
    noResultsFound: "Không tìm thấy kết quả", adjustFilter: "Thử điều chỉnh tìm kiếm hoặc bộ lọc.",

    // Settlements
    settlementsTitle: "Thanh toán", settlementsDesc: "Theo dõi và quản lý các khoản thanh toán giữa các thành viên.",
    youAreOwedLabel: "Bạn được nợ", youOweLabel: "Bạn nợ", settledThisMonth: "Đã thanh toán tháng này",
    pendingSettlements: "Chờ thanh toán", allClear: "Tất cả đã ổn!",
    noSettlementsDesc: "Chưa có thanh toán. Thêm chi phí vào nhóm và các khoản nợ sẽ hiện ở đây.",
    settlementTimeline: "Lịch sử thanh toán", noActivityLogged: "Chưa có hoạt động",
    netPosition: "Vị thế ròng", addExpensesToSeeBalance: "Thêm chi phí để xem số dư ròng.",
    markAsPaid: "Đánh dấu đã trả", markedPaid: "Đã đánh dấu trả",

    // Receipts
    receiptsTitle: "Hóa đơn", receiptsUploaded: "hóa đơn đã tải lên",
    uploadReceipt: "Tải hóa đơn", dragDrop: "Kéo thả hóa đơn vào đây",
    dragDropHint: "Hỗ trợ PNG, JPG và PDF tối đa 10 MB mỗi file",
    processed: "Đã xử lý", pendingReview: "Chờ xem xét", failedErrors: "Thất bại / Lỗi",
    searchReceipts: "Tìm kiếm hóa đơn...",
    noReceiptsTitle: "Chưa có hóa đơn", noReceiptsDesc: "Tải hóa đơn để đính kèm vào chi phí.",
    uploadFirstReceipt: "Tải lên hóa đơn đầu tiên",

    // Admin
    adminTitle: "Bảng quản trị", adminDesc: "Quản lý người dùng, theo dõi hoạt động và xuất dữ liệu.",
    exportData: "Xuất dữ liệu", totalUsers: "Tổng người dùng", totalGroups: "Tổng nhóm",
    rejectedTx: "Giao dịch từ chối", users: "Người dùng", uploads: "Tải lên",
    activityLogs: "Nhật ký hoạt động", searchUsers: "Tìm kiếm người dùng...",
    noUsersYet: "Chưa có người dùng", noUsersDesc: "Người dùng sẽ xuất hiện khi họ đăng ký.",
    noUploads: "Chưa có tải lên", noUploadsDesc: "Lịch sử tải hóa đơn sẽ được liệt kê ở đây.",
    noRejectedTx: "Không có giao dịch bị từ chối", noRejectedDesc: "Các khoản thanh toán bị từ chối sẽ hiện ở đây.",
    noLogsYet: "Chưa có nhật ký", noLogsDesc: "Sự kiện hệ thống sẽ được ghi lại ở đây.",
    uploadHistory: "Lịch sử tải lên", rejectedTransactions: "Giao dịch từ chối", systemLogs: "Nhật ký hệ thống",

    // Settings
    settingsTitle: "Cài đặt", settingsDesc: "Quản lý tài khoản, tùy chọn và bảo mật của bạn.",
    profile: "Hồ sơ", notifications: "Thông báo", security: "Bảo mật",
    billing: "Thanh toán", appearance: "Giao diện",
    profileInfo: "Thông tin hồ sơ", firstName: "Tên", lastName: "Họ",
    firstNamePlaceholder: "Nhập tên", lastNamePlaceholder: "Nhập họ",
    emailPlaceholder: "ban@example.com", bio: "Giới thiệu",
    bioPaceholder: "Giới thiệu bản thân với các thành viên trong nhóm…",
    defaultCurrency: "Tiền tệ mặc định", saveChanges: "Lưu thay đổi", saved: "Đã lưu!",
    removePhoto: "Xóa ảnh",
    notificationPrefs: "Tùy chọn thông báo",
    expenseAdded: "Chi phí được thêm", expenseAddedDesc: "Khi ai đó thêm chi phí vào nhóm của bạn",
    paymentReceived: "Nhận thanh toán", paymentReceivedDesc: "Khi thành viên đánh dấu đã thanh toán",
    settlementReminder: "Nhắc nhở thanh toán", settlementReminderDesc: "Nhắc nhở hàng tuần về các khoản chờ thanh toán",
    weeklyDigest: "Tóm tắt hàng tuần", weeklyDigestDesc: "Tóm tắt hoạt động nhóm hàng tuần",
    groupInvitesLabel: "Lời mời nhóm", groupInvitesDesc: "Khi bạn được mời vào nhóm mới",
    marketingEmails: "Cập nhật sản phẩm & mẹo", marketingEmailsDesc: "Tin tức, tính năng mới và mẹo từ Splitly",
    changePassword: "Đổi mật khẩu", currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới", confirmNewPassword: "Xác nhận mật khẩu mới",
    updatePassword: "Cập nhật mật khẩu",
    dangerZone: "Vùng nguy hiểm", dangerZoneDesc: "Sau khi xóa tài khoản, tất cả dữ liệu sẽ bị xóa vĩnh viễn.",
    deleteAccount: "Xóa tài khoản",
    currentPlan: "Gói hiện tại", onFreePlan: "Bạn đang dùng gói Miễn phí.",
    groupsUsed: "Nhóm", expensesUsed: "Chi phí", membersLabel: "Thành viên",
    receiptScan: "Quét hóa đơn", unlimited: "Không giới hạn", notIncluded: "Không có",
    upgradePro: "Nâng cấp lên Pro — $4/tháng",
    paymentMethod: "Phương thức thanh toán", noPaymentMethod: "Chưa có phương thức thanh toán",
    noPaymentDesc: "Thêm thẻ để nâng cấp gói.", addPaymentMethod: "+ Thêm phương thức thanh toán",
    appearanceTitle: "Giao diện", theme: "Chủ đề", accentColor: "Màu nhấn", density: "Mật độ",
    light: "Sáng", dark: "Tối", system: "Hệ thống",
    compact: "Thu gọn", default: "Mặc định", comfortable: "Thoải mái",
  },
} as const;

export type T = typeof translations.en;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
