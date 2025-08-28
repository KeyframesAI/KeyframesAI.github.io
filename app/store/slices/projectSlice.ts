import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TextElement, MediaFile, Character, Animation, ActiveElement, ExportConfig } from '../../types';
import { ProjectState } from '../../types';

export const initialState: ProjectState = {
    id: crypto.randomUUID(),
    projectName: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mediaFiles: [],
    characters: [],
    animations: [],
    keyframes: [],
    textElements: [],
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
    duration: 0,
    zoomLevel: 1,
    timelineZoom: 1800,
    enableMarkerTracking: true,
    activeSection: 'media',
    activeElement: null,
    activeElementIndex: 0,
    activeAnimationIndex: 0,
    activeFrameIndex: 0,
    resolution: { width: 1920, height: 1080 },
    fps: 12,
    aspectRatio: '16:9',
    history: [],
    future: [],
    deletedFiles: [],
    exportSettings: {
        resolution: '1080p',
        quality: 'high',
        speed: 'fastest',
        fps: 12,
        format: 'mp4',
        includeSubtitles: false,
    },
};

const calculateTotalDuration = (
    mediaFiles: MediaFile[],
    textElements: TextElement[]
): number => {
    const mediaDurations = mediaFiles.map(v => v.positionEnd);
    const textDurations = textElements.map(v => v.positionEnd);
    return Math.max(0, ...mediaDurations, ...textDurations);
};

const calculateAnimationDuration = (
    animations: Animation[],
): number => {
    //const durations = animations.map(v => v.frames.length);
    const durations = animations.map(v => Math.max(...v.frames.map(f => f.order+f.duration)));
    
    //Math.max(...animations.map(ani => ani.frames.map(fr => fr.order)));
    
    return Math.max(0, ...durations);
};



const projectStateSlice = createSlice({
    name: 'projectState',
    initialState,
    reducers: {
        setMediaFiles: (state, action: PayloadAction<MediaFile[]>) => {
            state.mediaFiles = action.payload;
            // Calculate duration based on the last video's end time
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements);
            
            //state.history.push(state);
        },
        setCharacters: (state, action: PayloadAction<Character[]>) => {
            state.characters = action.payload;
            
            //state.history.push(state);
        },
        setAnimations: (state, action: PayloadAction<Animation[]>) => {
            state.animations = action.payload;
            
            state.duration = calculateAnimationDuration(state.animations) / state.fps;
        },
        setKeyframes: (state, action: PayloadAction<string[]>) => {
            state.keyframes = action.payload;
            
        },
        setHistory: (state, action: PayloadAction<ProjectState[]>) => {
            if (state.history.length < action.payload.length) {
              state.future = [];
            }
            
            state.history = action.payload;
        },
        setFuture: (state, action: PayloadAction<ProjectState[]>) => {
            state.future = action.payload;
        },
        setProjectName: (state, action: PayloadAction<string>) => {
            state.projectName = action.payload;
        },
        setProjectId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setProjectCreatedAt: (state, action: PayloadAction<string>) => {
            state.createdAt = action.payload;
        },
        setProjectLastModified: (state, action: PayloadAction<string>) => {
            state.lastModified = action.payload;
        },

        setTextElements: (state, action: PayloadAction<TextElement[]>) => {
            state.textElements = action.payload;
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements);
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setIsMuted: (state, action: PayloadAction<boolean>) => {
            state.isMuted = action.payload;
        },
        setActiveSection: (state, action: PayloadAction<ActiveElement>) => {
            state.activeSection = action.payload;
        },
        setActiveElement: (state, action: PayloadAction<ActiveElement | null>) => {
            state.activeElement = action.payload;
        },
        setActiveElementIndex: (state, action: PayloadAction<number>) => {
            state.activeElementIndex = action.payload;
        },
        setActiveAnimationIndex: (state, action: PayloadAction<number>) => {
            state.activeAnimationIndex = action.payload;
        },
        setActiveFrameIndex: (state, action: PayloadAction<number>) => {
            state.activeFrameIndex = action.payload;
        },
        setFilesID: (state, action: PayloadAction<string[]>) => {
            state.filesID = action.payload;
        },
        setExportSettings: (state, action: PayloadAction<ExportConfig>) => {
            state.exportSettings = action.payload;
        },
        setResolution: (state, action: PayloadAction<string>) => {
            state.exportSettings.resolution = action.payload;
        },
        setQuality: (state, action: PayloadAction<string>) => {
            state.exportSettings.quality = action.payload;
        },
        setSpeed: (state, action: PayloadAction<string>) => {
            state.exportSettings.speed = action.payload;
        },
        setFps: (state, action: PayloadAction<number>) => {
            state.exportSettings.fps = action.payload;
        },
        setTimelineZoom: (state, action: PayloadAction<number>) => {
            state.timelineZoom = action.payload;
        },
        setMarkerTrack: (state, action: PayloadAction<boolean>) => {
            state.enableMarkerTracking = action.payload;
        },
        // Special reducer for rehydrating state from IndexedDB
        rehydrate: (state, action: PayloadAction<ProjectState>) => {
            return { ...state, ...action.payload };
        },
        createNewProject: (state) => {
            return { ...initialState };
        },
    },
});

export const {
    setMediaFiles,
    setCharacters,
    setAnimations,
    setKeyframes,
    setHistory,
    setFuture,
    setTextElements,
    setCurrentTime,
    setProjectName,
    setIsPlaying,
    setFilesID,
    setExportSettings,
    setResolution,
    setQuality,
    setSpeed,
    setFps,
    setMarkerTrack,
    setIsMuted,
    setActiveSection,
    setActiveElement,
    setActiveElementIndex,
    setActiveAnimationIndex,
    setActiveFrameIndex,
    setTimelineZoom,
    rehydrate,
    createNewProject,
} = projectStateSlice.actions;

export default projectStateSlice.reducer; 