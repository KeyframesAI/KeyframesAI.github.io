import { AbsoluteFill, OffthreadVideo, Audio, Img, Sequence } from "remotion";
import { MediaFile, TextElement } from "@/app/types";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    return { from, durationInFrames };
};

export const SequenceItem: Record<
    string,
    (item: any, options: SequenceItemOptions) => JSX.Element> = {
    
    frame: (item: MediaFile, options: SequenceItemOptions) => {
        const { fps } = options;

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        const crop = item.crop || {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        };

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                style={{ pointerEvents: "none" }}
            >
                <AbsoluteFill
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    style={{
                        pointerEvents: "auto",
                        top: item.y,
                        left: item.x,
                        width: crop.width || "100%",
                        height: crop.height || "auto",
                        // transform: item?.transform || "none",
                        opacity:
                            item?.opacity !== undefined
                                ? item.opacity / 100
                                : 1,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: crop.width || "100%",
                            height: crop.height || "auto",
                            position: "relative",
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        <Img
                            style={{
                                pointerEvents: "none",
                                top: -crop.y || 0,
                                left: -crop.x || 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                position: "absolute",
                                zIndex: item.zIndex || 0,
                            }}
                            data-id={item.id}
                            src={item.src || ""}
                        />
                    </div>
                </AbsoluteFill>
            </Sequence>
        );
    },
    
    image: (item: MediaFile, options: SequenceItemOptions) => {
        const { fps } = options;

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        const crop = item.crop || {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        };

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                style={{ pointerEvents: "none" }}
            >
                <AbsoluteFill
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    style={{
                        pointerEvents: "auto",
                        top: item.y,
                        left: item.x,
                        width: crop.width || "100%",
                        height: crop.height || "auto",
                        // transform: item?.transform || "none",
                        opacity:
                            item?.opacity !== undefined
                                ? item.opacity / 100
                                : 1,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: crop.width || "100%",
                            height: crop.height || "auto",
                            position: "relative",
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        <Img
                            style={{
                                pointerEvents: "none",
                                top: -crop.y || 0,
                                left: -crop.x || 0,
                                width: crop.width || "100%",
                                height: crop.height || "auto",
                                position: "absolute",
                                zIndex: item.zIndex || 0,
                            }}
                            data-id={item.id}
                            src={item.src || ""}
                        />
                    </div>
                </AbsoluteFill>
            </Sequence>
        );
    }
};
