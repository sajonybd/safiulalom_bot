import { LayoutDashboard, Users, Wallet, BookOpen, BarChart3, UsersRound } from "lucide-react";

export const navigationItems = [
  { label: 'overview', icon: LayoutDashboard, to: '/' },
  { label: 'entities', icon: Users, to: '/entities' },
  { label: 'accounts', icon: Wallet, to: '/accounts' },
  { label: 'lenden', icon: BookOpen, to: '/lenden' },
  { label: 'reports', icon: BarChart3, to: '/reports' },
  { label: 'team', icon: UsersRound, to: '/team' },
];
