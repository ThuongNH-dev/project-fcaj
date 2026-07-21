export interface NotificationPreferences {
  expenseAdded: boolean;
  paymentReceived: boolean;
  settlementReminder: boolean;
  weeklyDigest: boolean;
  groupInvites: boolean;
  marketingEmails: boolean;
}

export interface UpdateNotificationPreferencesInput {
  expenseAdded?: boolean;
  paymentReceived?: boolean;
  settlementReminder?: boolean;
  weeklyDigest?: boolean;
  groupInvites?: boolean;
  marketingEmails?: boolean;
}
