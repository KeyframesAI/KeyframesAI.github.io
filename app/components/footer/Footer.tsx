'use client';
import { AiOutlineFacebook, AiOutlineX, AiOutlineGithub, AiOutlineLinkedin, AiOutlineInstagram } from "react-icons/ai";
import { usePathname } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname.startsWith("/projects/")) {
    return null;
  }

  return (
    <footer className="bg-black border-t border-gray-800 dark:bg-black shadow-sm text-gray-400 py-6 dark:border-t dark:border-gray-800">
      <div className="container mx-auto px-4 flex flex-wrap justify-center sm:justify-between items-center text-sm">
        <p className="ml-4">&copy; {currentYear} KeyframesAI. All rights reserved.</p>
        <div className="flex space-x-4 mt-2 mr-4 sm:mt-0">
          <a href="https://github.com/KeyframesAI/ui" aria-label="GitHub" className="hover:text-gray-300">
            <AiOutlineGithub className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
