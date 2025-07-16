'use client'
import Link from "next/link";
import ThemeSwitch from "../buttons/ThemeSwitch";
import { usePathname } from "next/navigation";
export default function Header() {
    const pathname = usePathname();

    if (pathname.startsWith("/projects/")) {
        return null;
    }

    return (
        <header className="bg-black border-b border-gray-800 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="text-3xl dark:text-gray-100">KeyframesAI</Link>
                </div>
                <nav className="flex items-center">
                    <ul className="flex space-x-2 mr-2">
                    </ul>
                    {/* <ThemeSwitch /> */}
                </nav>
            </div>
        </header>
    );
}
