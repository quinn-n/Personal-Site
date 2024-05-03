import { SideNav } from "@/app/ui/sidenav";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-row justify-start h-full w-screen">
    <SideNav navLinks={NAV_LINKS}/>
    {children}
  </div>;
}

const NAV_LINKS: { path: string, label: string }[] = [
];
