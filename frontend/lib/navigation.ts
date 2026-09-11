import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  FileSearch,
  FileText,
  Gauge,
  GitBranch,
  Factory,
  ShieldCheck,
} from "lucide-react";

export const primaryNavigation = [
  {
    label: "Command Center",
    href: "/",
    icon: Gauge,
  },
  {
    label: "AI Agent",
    href: "/agent",
    icon: Bot,
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: FileText,
  },
  {
    label: "IT World",
    href: "/it-world",
    icon: Boxes,
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    icon: BookOpen,
  },
];

export const operationsNavigation = [
  {
    label: "Policies",
    href: "/policies",
    icon: ShieldCheck,
  },
  {
    label: "Tools",
    href: "/tools",
    icon: GitBranch,
  },
  {
    label: "Observatory",
    href: "/observatory",
    icon: Activity,
  },
  {
    label: "Audit",
    href: "/audit",
    icon: FileSearch,
  },
  {
    label: "Evaluation",
    href: "/evaluation",
    icon: BarChart3,
  },
];

export const environmentNavigation = [
  {
    label: "Production",
    href: "/production",
    icon: Factory,
  },
];