import Image from 'next/image';

export default function CharactersButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            className="bg-white border border-solid rounded border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
            onClick={onClick}
        >
            <Image
                alt="Characters"
                className="h-auto w-auto max-w-[30px] max-h-[30px]"
                height={30}
                width={30}
                src="https://www.svgrepo.com/show/535560/person.svg"
            />
            <span className="text-xs">Characters</span>
        </button>
    );
}