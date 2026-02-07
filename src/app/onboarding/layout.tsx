import { OceanScene } from "@/components/features/ocean/OceanScene";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OceanScene>{children}</OceanScene>;
}
