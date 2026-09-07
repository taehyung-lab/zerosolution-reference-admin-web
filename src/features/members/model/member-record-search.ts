export type MemberRecordSearch = {
  periodType?: string | undefined;
  startDateTime?: string | undefined;
  endDateTime?: string | undefined;
  keywords?:
    | { field: "email" | "name" | "phone" | "content"; value: string }[]
    | undefined;
  signupMethods?:
    ("direct" | "kakao" | "naver" | "apple" | "melon")[] | undefined;
  accountStatuses?: ("general" | "flagged")[] | undefined;
  restrictions?: ("specialContent" | "inquiry")[] | undefined;
  statuses?: ("waiting" | "reviewing" | "held" | "completed")[] | undefined;
  results?: ("waiting" | "completed" | "rejected")[] | undefined;
  inquiryType?: string | undefined;
  accessPaths?: "app"[] | undefined;
  sortType?: string | undefined;
  sortDirection?: "asc" | "desc" | undefined;
  page?: number | undefined;
  pageSize?: 100 | 200 | 300 | 400 | 500 | 700 | 1000 | undefined;
};
