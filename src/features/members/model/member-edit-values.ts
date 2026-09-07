export type MemberEditValues = {
  name: string;
  birthDate: string;
  phone: string;
  accountStatus: "general" | "flagged";
  restrictions: string[];
};
