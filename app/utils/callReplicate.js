import { writeFile } from "fs/promises";
import Replicate from "replicate";


async function getFileFromUrl(url, name, defaultType = 'image/png'){

  //console.log(url);
  const response = await fetch(url);
  //console.log(response);
  
  const data = await response.blob();
  return new File([data], name, {
    type: data.type || defaultType,
  });
  
}

export const interpolateFILM = async (img1, img2) => {

    const replicate = new Replicate();

    const input = {
        frame1: "https://replicate.delivery/mgxm/5de85319-a354-4178-a2b0-aab4a65fa480/start.png",
        frame2: "https://replicate.delivery/mgxm/aebabf54-c730-4efe-857d-1182960918d4/end.png",
        times_to_interpolate: "7"
    };

    const output = await replicate.run("google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d", { input });

    // To access the file URL:
    console.log(output.url());
    console.log(output);
    //=> "https://replicate.delivery/.../output"

    // To write the file to disk:
    //await writeFile("output", output);
    //=> output written to disk
};
