import { AbsoluteFill, OffthreadVideo, Audio, Img, Sequence } from "remotion";
import { MediaFile, TextElement } from "@/app/types";
import { useAppDispatch } from "../../../../../store";
import { setAnimations } from "../../../../../store/slices/projectSlice";

import { Scatter } from "react-chartjs-2";
import "chartjs-plugin-dragdata";
import "chart.js/auto";

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

const createDataset = (
    label, data, hidden, color
) => {
    return {
      label: label,
      data: data, //[{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }],
      backgroundColor: color,
      borderWidth: 5,
      borderColor: color,
      showLine: true,
      pointRadius: function(context) {
          if (context.dataIndex === hidden) {
              return 0; 
          }
          return 15;
      },
      pointHoverRadius: function(context) {
          if (context.dataIndex === hidden) {
              return 0; 
          }
          return 20;
      },
      pointHoverBackgroundColor: 'rgba(92, 190, 255, 1)',
      
    }
};

const createDatasets = (pose, color) => {
    /*
    data.datasets.push(createDataset([
      //{x: 491, y: 0}, 
      {x: pose[0][0], y: pose[0][1]}, // nose
      {x: pose[1][0], y: pose[1][1]}, // neck
      {x: pose[2][0], y: pose[2][1]}, // shoulder-r
      {x: pose[3][0], y: pose[3][1]}, // elbow-r
      {x: pose[4][0], y: pose[4][1]}, // wrist-r
      {x: pose[5][0], y: pose[5][1]}, // shoulder-l
      {x: pose[6][0], y: pose[6][1]}, // elbow-l
      {x: pose[7][0], y: pose[7][1]}, //wrist-l
      {x: pose[8][0], y: pose[8][1]}, // hip-r
      {x: pose[9][0], y: pose[9][1]}, // knee-r
      {x: pose[10][0], y: pose[10][1]}, //ankle-r
      {x: pose[11][0], y: pose[11][1]}, // hip-l
      {x: pose[12][0], y: pose[12][1]}, // knee-l
      {x: pose[13][0], y: pose[13][1]}, // ankle-l
      {x: pose[14][0], y: pose[14][1]}, // eye-r
      {x: pose[15][0], y: pose[15][1]}, // eye-l
      {x: pose[16][0], y: pose[16][1]}, // ear-r
      {x: pose[17][0], y: pose[17][1]}, // ear-l
      
    ]));*/
    
    const datasets = []
    
    datasets.push(createDataset('head', [
      {x: pose[16][0], y: pose[16][1], id: 16}, // ear-r
      {x: pose[14][0], y: pose[14][1], id: 14}, // eye-r
      {x: pose[0][0], y: pose[0][1], id: 0, copies:[[2, 0]]}, // nose
      {x: pose[15][0], y: pose[15][1], id: 15}, // eye-l
      {x: pose[17][0], y: pose[17][1], id: 17}, // ear-l
    ], 2, color));
    
    datasets.push(createDataset('right side', [
      {x: pose[0][0], y: pose[0][1], id: 0, copies:[[1, 2]]}, // nose
      {x: pose[1][0], y: pose[1][1], id: 1, copies:[[3, 0], [4, 3]]}, // neck
      {x: pose[8][0], y: pose[8][1], id: 8}, // hip-r
      {x: pose[9][0], y: pose[9][1], id: 9}, // knee-r
      {x: pose[10][0], y: pose[10][1], id: 10}, //ankle-r          
    ], -1, color));
    
    datasets.push(createDataset('left side', [
      {x: pose[1][0], y: pose[1][1], id: 1, copies:[[2, 1], [4, 3]]}, // neck
      {x: pose[11][0], y: pose[11][1], id: 11}, // hip-l
      {x: pose[12][0], y: pose[12][1], id: 12}, // knee-l
      {x: pose[13][0], y: pose[13][1], id: 13}, // ankle-l
    ], 0, color));
    
    datasets.push(createDataset('arms', [
      {x: pose[4][0], y: pose[4][1], id: 4}, // wrist-r
      {x: pose[3][0], y: pose[3][1], id: 3}, // elbow-r
      {x: pose[2][0], y: pose[2][1], id: 2}, // shoulder-r
      {x: pose[1][0], y: pose[1][1], id: 1, copies:[[2, 1], [3, 0]]}, // neck
      {x: pose[5][0], y: pose[5][1], id: 5}, // shoulder-l
      {x: pose[6][0], y: pose[6][1], id: 6}, // elbow-l
      {x: pose[7][0], y: pose[7][1], id: 7}, //wrist-l
    ], 3, color));
    
    return datasets;
};



export const PoseSequenceItem = (item: MediaFile, options: SequenceItemOptions) => {

        const { fps, order, pose_raw, animations, activeAnimationIndex, frame_index } = options;
        
        const dispatch = useAppDispatch();

        const { from, durationInFrames } = calculateFrames(
            {
                from: order/fps, //item.positionStart,
                to: (order+1)/fps //item.positionEnd
            },
            fps
        );

        const crop = item.crop || {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        };
        
        var newWidth = crop.width;
        var newHeight = crop.height;
        var shiftx = 0;
        var shifty = 0;
        if (item.width/item.height > crop.width/crop.height) {
            newHeight = item.height/item.width * crop.width;
            shifty = (crop.height-item.height)/2;
        } else {
            newWidth = item.width/item.height * crop.height;
            shiftx = (crop.width-newWidth)/2;
        }
        //console.log(newWidth, newHeight, shiftx, shifty);
        
        
        const pose = pose_raw.map(coord => [coord[0] * newWidth + shiftx, (1-coord[1]) * newHeight - shifty]);
        
        //console.log(pose);
        //console.log(item);
        
        
        const data = {
          datasets: [
            {
              label: 'Hidden Dataset',
              data: [{ x: 0, y: 0 }, { x: crop.width, y: crop.height }],
              backgroundColor: 'rgba(255, 255, 255, 0)',
              pointRadius: 10,
              dragData: false,
            },
          ],
        };
        
        const bodyData = createDatasets(pose, 'rgba(0, 153, 255, 1)');
        data.datasets.push(...bodyData);
        
        
        //console.log(data.datasets);

        const config = {
          responsive: false,
          plugins: {
            dragData: {
              dragX: true,
              dragY: true,
              //round: 0,
              onDrag: function(e, datasetIndex, index, value) {
                if (value.copies) {
                  for (const copy of value.copies) {
                      data.datasets[copy[0]].data[copy[1]].x = value.x;
                      data.datasets[copy[0]].data[copy[1]].y = value.y;
                  }
                }
              },
              onDragEnd: function(e, datasetIndex, index, value) {
                //console.log('Dragged value:', value);
                //console.log(data.datasets);
                
                const updatedAnimations = animations.map((ani, index) => {
                  if (index == activeAnimationIndex) {
                      const frames = ani.frames.map((frame, index2) => {
                          if (index2 == frame_index) {
                              var body = [...frame.pose.body];
                              //console.log(body[value.id]);
                              const old = body[value.id];
                              body[value.id] = [(value.x-shiftx)/newWidth, 1-(value.y+shifty)/newHeight];
                              
                              var hand1 = [...frame.pose.hand1];
                              var hand2 = [...frame.pose.hand2];
                              const diff = [old[0] - body[value.id][0], old[1] - body[value.id][1]];
                              
                              if (value.id == 7) { // is wrist
                                hand1 = hand1.map(coord => [coord[0] - diff[0], coord[1] - diff[1]]);
                              } else if (value.id == 4) {
                                hand2 = hand2.map(coord => [coord[0] - diff[0], coord[1] - diff[1]]);
                              }
                              
                              //console.log(body[value.id]);
                              return { ...frame, pose: {...frame.pose, body:body, hand1:hand1, hand2:hand2} };
                          } else {
                              return frame;
                          }
                      })
                      return { ...ani, frames: frames };
                  } else {
                      return ani;
                  }
                });
                
                //console.log(updatedAnimations);
                
                dispatch(setAnimations(updatedAnimations));
                
              }
            },
            legend: {
              display: false,
              labels: {
                  padding: 0
              }
            },
            tooltip: {
              enabled: false
            },
          },
          animation: false,
          scales: {
            
              x: {
                  display: false,
              },
              y: {
                  display: false,
              },
      
          },
        };
        

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                style={{ pointerEvents: "all" }}
            >
                <AbsoluteFill
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    style={{
                        pointerEvents: "all",
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
                            pointerEvents: "all",
                            objectFit: "contain",
                        }}
                    >
                        <Scatter 
                            data={data} 
                            options={config}
                            style={{
                                pointerEvents: "all",
                                top: "-150px",
                                left: "-30px",
                                width: "2060px",
                                height: "1260px",
                                objectFit: "fill",
                                position: "absolute",
                                zIndex: 1000,
                            }}
                            data-id={item.id}
                            width={2060} 
                            height={1280}
                        />
                    </div>
                </AbsoluteFill>
            </Sequence>
        );
    
};
