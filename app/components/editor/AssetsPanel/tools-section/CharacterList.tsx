"use client";

import { listFiles, deleteFile, useAppSelector, storeFile, getFile } from '@/app/store';
import { setCharacters } from '@/app/store/slices/projectSlice';
import { Character } from '@/app/types';
import { useAppDispatch } from '@/app/store';
import AddMedia from '../AddButtons/AddMedia';
import EditCharacter from '../Character/EditCharacter';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function CharacterList() {
    const { characters } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [chars, setChars] = useState<Character[]>([]);
    
    useEffect(() => {
        setChars(characters);

    }, [characters]);

    return (
        <>
            {chars.length > 0 && (
                <div className="space-y-4">
                    {chars.map((char) => (
                        <div key={char.id} className="border border-gray-700 p-3 rounded bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <AddMedia fileId={char.id} />
                                    
                                    <span className="py-1 px-1 text-sm flex-1 truncate" title={char.name}>
                                        {char.name}
                                    </span>
                                </div>
                                
                                
                                <EditCharacter charId={char.id} />
                                
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}