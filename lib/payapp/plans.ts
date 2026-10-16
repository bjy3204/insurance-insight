// Shared settings for the three new checkout links. Existing PayApp agreements
// keep their original schedule; changing this does not update those agreements.
export const PAYAPP_SUBSCRIPTION = {
  productName: "보험나무 자료 구독",
  amounts: [9900, 12000, 14000],
  cycleType: "Month",
  cycleDay: 10,
  expiresOn: "2080-08-20",
} as const;
