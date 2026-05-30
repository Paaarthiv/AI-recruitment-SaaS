import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "RecruitAI",
    template: "%s | RecruitAI",
  },
  description:
    "AI-assisted recruitment workspace where math decides and AI explains.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
