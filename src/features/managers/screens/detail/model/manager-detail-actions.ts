export type ManagerDetailActionRequest =
  | {
      readonly type: "approve" | "delete" | "activate" | "deactivate";
      readonly managerId: string;
    }
  | {
      readonly type: "reject";
      readonly managerId: string;
      readonly reason: string;
    }
  | {
      readonly type: "password" | "unlock";
      readonly managerId: string;
      readonly password: string;
    }
  | {
      readonly type: "reveal";
      readonly managerId: string;
      readonly operatorPassword: string;
    }
  | {
      readonly type: "verifyWithdrawal";
      readonly managerId: string;
      readonly reason: string;
      readonly operatorPassword: string;
    };
