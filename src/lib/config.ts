export const config = {
  allowedEmailDomain: (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "college.harvard.edu").trim(),
  ticketCount: parseInt(process.env.NEXT_PUBLIC_TICKET_COUNT || "7", 10),
  votingDeadline: process.env.NEXT_PUBLIC_VOTING_DEADLINE || "Fri 4/17, 11:59pm",
  electionTitle: process.env.NEXT_PUBLIC_ELECTION_TITLE || "HUA Co-Presidents 2026",
} as const;
